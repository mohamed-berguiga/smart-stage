const asyncHandler = require('express-async-handler');
const { askAI } = require('../utils/askAI');
const JournalEntry = require('../models/JournalEntry');
const Task = require('../models/Task');
const Stage = require('../models/Stage');
const User = require('../models/User');
const Skill = require('../models/Skill');

/**
 * POST /api/ai/generate-task-description
 * L'encadrant (ou n'importe quel rôle créant une tâche perso) tape juste un
 * titre, l'IA propose une description détaillée à relire/ajuster avant
 * d'enregistrer la tâche. Aucune donnée n'est sauvegardée ici — c'est un
 * simple brouillon, l'utilisateur reste maître du texte final.
 */
const generateTaskDescription = asyncHandler(async (req, res) => {
  const { title, type } = req.body;

  if (!title || !title.trim()) {
    res.status(400);
    throw new Error('title est requis');
  }

  const prompt = [
    `Rédige une description de tâche professionnelle en français, claire et concise (3 à 5 phrases),`,
    `pour une tâche de stage intitulée "${title.trim()}"${type ? ` (type : ${type})` : ''}.`,
    `La description doit expliquer l'objectif de la tâche et lister 2 à 3 attentes concrètes.`,
    `Réponds uniquement avec le texte de la description, sans titre ni formules d'introduction.`,
  ].join(' ');

  const description = await askAI(prompt);
  res.json({ description });
});

/**
 * POST /api/ai/summarize-week/:stagiaireId
 * Lit les entrées de journal + tâches des 7 derniers jours d'un stagiaire
 * et fait rédiger un court paragraphe de synthèse par l'IA, pour la page
 * Rapports. Le cloisonnement par rôle est appliqué exactement comme sur
 * les autres routes (RH voit tout, encadrant seulement ses stagiaires,
 * stagiaire seulement lui-même).
 */
const summarizeWeek = asyncHandler(async (req, res) => {
  const { stagiaireId } = req.params;

  if (req.user.role === 'STAGIAIRE' && req.user._id.toString() !== stagiaireId) {
    res.status(403);
    throw new Error('Vous ne pouvez générer un résumé que pour votre propre rapport.');
  }
  if (req.user.role === 'ENCADRANT') {
    const stage = await Stage.findOne({ stagiaire: stagiaireId, encadrant: req.user._id });
    if (!stage) {
      res.status(403);
      throw new Error("Ce stagiaire n'est pas affecté à votre suivi.");
    }
  }

  const since = new Date();
  since.setDate(since.getDate() - 7);

  const [entries, tasks] = await Promise.all([
    JournalEntry.find({ author: stagiaireId, createdAt: { $gte: since } }).sort('createdAt'),
    Task.find({ assignedTo: stagiaireId, isPersonal: false, createdAt: { $gte: since } }),
  ]);

  if (entries.length === 0 && tasks.length === 0) {
    res.json({ summary: 'Aucune activité enregistrée sur les 7 derniers jours pour ce stagiaire.' });
    return;
  }

  const done = tasks.filter((t) => t.status === 'Terminée').length;
  const journalText = entries
    .map((e) => `- ${e.title}${e.text ? ` : ${e.text}` : ''}${e.hours ? ` (${e.hours} h)` : ''}`)
    .join('\n');

  const prompt = [
    'Voici les entrées de journal de stage de la semaine :',
    journalText || '(aucune entrée de journal cette semaine)',
    '',
    `Statistiques de tâches sur la même période : ${tasks.length} tâche(s) au total, ${done} terminée(s).`,
    '',
    'Rédige un court paragraphe de synthèse en français (4 à 6 phrases), professionnel et',
    "factuel, résumant l'activité de la semaine pour un rapport de stage. Synthétise, ne liste",
    'pas les entrées une par une. Ne mets pas de titre.',
  ].join('\n');

  const summary = await askAI(prompt);
  res.json({ summary });
});

/**
 * POST /api/ai/ask-data  (RH uniquement)
 *
 * Le RH pose une question en langage naturel. Le backend récupère lui-même
 * toutes les vraies données (stagiaires, départements, tâches) et ne donne
 * à l'IA QUE ce résumé structuré — elle ne génère jamais de requête vers la
 * base et n'a accès à rien d'autre. Ça élimine tout risque d'injection ou
 * de fuite de données hors du périmètre RH.
 */
const askData = asyncHandler(async (req, res) => {
  const { question } = req.body;
  if (!question || !question.trim()) {
    res.status(400);
    throw new Error('question est requis');
  }

  const [stagiaires, stages, tasks] = await Promise.all([
    User.find({ role: 'STAGIAIRE' }).select('firstName lastName status'),
    Stage.find().populate('encadrant', 'firstName lastName').populate('department', 'name'),
    Task.find({ isPersonal: false }).select('assignedTo status isLate dueDate'),
  ]);

  const stageByStagiaire = new Map();
  stages.forEach((s) => {
    if (s.stagiaire) stageByStagiaire.set(s.stagiaire.toString(), s);
  });

  const tasksByStagiaire = new Map();
  tasks.forEach((t) => {
    if (!t.assignedTo) return;
    const key = t.assignedTo.toString();
    const entry = tasksByStagiaire.get(key) || { total: 0, done: 0, late: 0 };
    entry.total += 1;
    if (t.status === 'Terminée') entry.done += 1;
    if (t.isLate) entry.late += 1;
    tasksByStagiaire.set(key, entry);
  });

  const rows = stagiaires.map((s) => {
    const stage = stageByStagiaire.get(s._id.toString());
    const stats = tasksByStagiaire.get(s._id.toString()) || { total: 0, done: 0, late: 0 };
    return {
      nom: `${s.firstName} ${s.lastName}`,
      actif: !!s.status,
      departement: stage?.department?.name ?? null,
      encadrant: stage?.encadrant ? `${stage.encadrant.firstName} ${stage.encadrant.lastName}` : null,
      tachesTotal: stats.total,
      tachesTerminees: stats.done,
      tachesEnRetard: stats.late,
    };
  });

  const prompt = [
    'Voici les données actuelles de la plateforme Smart Stage, au format JSON (un objet par stagiaire) :',
    JSON.stringify(rows, null, 2),
    '',
    `Question du RH : "${question.trim()}"`,
    '',
    'Réponds à cette question UNIQUEMENT à partir des données ci-dessus, en français, de façon',
    'concise et factuelle (chiffres précis, cite des noms si pertinent). Si la question porte sur',
    "une information absente de ces données, dis-le clairement plutôt que d'inventer une réponse.",
  ].join('\n');

  const answer = await askAI(prompt);
  res.json({ answer, dataPointCount: rows.length });
});

/**
 * POST /api/ai/faq-chat
 * Chatbot d'aide à l'utilisation de l'application (base de connaissance
 * statique décrivant les fonctionnalités — pas d'accès aux vraies données,
 * contrairement à askData). Accessible à tous les rôles connectés.
 */
const APP_KNOWLEDGE_BASE = `
CONNEXION ET COMPTE
- La connexion se fait avec email + mot de passe (créés uniquement par le RH, pas d'inscription publique).
- "Mot de passe oublié ?" sur la page de connexion envoie un lien de réinitialisation par email.
- Chaque utilisateur peut changer son propre mot de passe dans "Mon profil" (menu latéral), en indiquant son mot de passe actuel.

TÂCHES (menu "Suivi des tâches")
- Vue Liste ou vue Kanban (glisser-déposer pour changer le statut).
- La colonne/statut "En retard" est calculé automatiquement selon la date d'échéance — on ne peut pas l'assigner manuellement.
- Chaque tâche peut avoir des commentaires, des pièces jointes (bouton "Joindre un fichier") et un historique des actions (bouton "Historique").
- Un Encadrant crée des tâches pour ses stagiaires ; un Stagiaire peut créer des tâches personnelles pour lui-même.
- Recherche par titre et filtres par statut/priorité disponibles en haut de la liste.
- Bouton "Générer avec l'IA" dans le formulaire de tâche pour rédiger automatiquement une description.

COMPÉTENCES (menu "Compétences")
- Le RH définit le référentiel de compétences par département.
- L'Encadrant évalue le niveau de ses stagiaires sur chaque compétence.
- Le Stagiaire voit sa progression en lecture seule.

JOURNAL DE STAGE (menu "Journal")
- Le Stagiaire ajoute une entrée quotidienne (titre, activités, heures travaillées).
- L'Encadrant peut "viser" (valider) une entrée et y laisser un commentaire.
- Le RH voit toutes les entrées de l'entreprise, l'Encadrant celles de son département.

RAPPORTS & STATISTIQUES (menu "Rapports & statistiques")
- Statistiques adaptées au rôle connecté (progression, tâches par département, etc.).
- Bouton "Télécharger en PDF" pour exporter le rapport.
- Panneau "Résumé de la semaine (IA)" pour obtenir une synthèse rédigée automatiquement à partir du journal et des tâches.

ESPACE RH UNIQUEMENT
- "Gestion des comptes" : créer/activer/désactiver/supprimer des comptes RH, Encadrant ou Stagiaire.
- "Importer en masse" : ajouter plusieurs stagiaires d'un coup via un fichier Excel/CSV.
- Panneau "Assistant IA — interrogez vos données" en haut de l'Aperçu : poser des questions en langage naturel sur les stagiaires et tâches.
- Attestations de stage PDF générées depuis la fiche d'un stagiaire (disponible seulement après la fin de son stage).

NOTIFICATIONS
- Cloche en haut à droite : notifications in-app ET par e-mail sur les événements importants (nouvelle tâche, tâche terminée, attestation prête...).

AUTRE
- Bouton lune/soleil dans le header pour basculer entre mode clair et mode sombre.
`;

const faqChat = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    res.status(400);
    throw new Error('message est requis');
  }

  const systemInstruction = [
    "Tu es l'assistant d'aide intégré à l'application Smart Stage (gestion de stages).",
    `L'utilisateur qui te parle a le rôle : ${req.user.role}.`,
    'Réponds UNIQUEMENT à des questions sur comment utiliser cette application, en te basant',
    "sur les informations ci-dessous. Sois bref (2 à 4 phrases), en français, ton amical mais",
    "professionnel. Si la question ne concerne pas l'utilisation de Smart Stage, dis poliment",
    'que tu ne peux aider que sur ce sujet, sans répondre à la question hors-sujet.',
    '',
    '=== Fonctionnalités de Smart Stage ===',
    APP_KNOWLEDGE_BASE,
  ].join('\n');

  const answer = await askAI(message.trim(), systemInstruction);
  res.json({ answer });
});

/**
 * POST /api/ai/suggest-skill-level  (Encadrant uniquement)
 * Analyse les tâches terminées d'un stagiaire pour suggérer un niveau sur
 * une compétence donnée. L'encadrant reste maître de la décision finale —
 * la suggestion ne fait que pré-remplir le formulaire d'évaluation existant.
 */
const suggestSkillLevel = asyncHandler(async (req, res) => {
  const { stagiaireId, skillId } = req.body;
  if (!stagiaireId || !skillId) {
    res.status(400);
    throw new Error('stagiaireId et skillId sont requis');
  }

  const stage = await Stage.findOne({ stagiaire: stagiaireId, encadrant: req.user._id });
  if (!stage) {
    res.status(403);
    throw new Error("Ce stagiaire n'est pas affecté à votre suivi.");
  }

  const skill = await Skill.findById(skillId);
  if (!skill) {
    res.status(404);
    throw new Error('Compétence introuvable');
  }

  const tasks = await Task.find({ assignedTo: stagiaireId, isPersonal: false });
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === 'Terminée');
  const titles = done.map((t) => t.title).slice(0, 20);

  const prompt = [
    `Compétence à évaluer : "${skill.name}"${skill.description ? ` — ${skill.description}` : ''}.`,
    `Le stagiaire a ${total} tâche(s) au total, dont ${done.length} terminée(s).`,
    `Titres des tâches terminées : ${titles.length ? titles.join(', ') : '(aucune)'}.`,
    '',
    'À partir de ces informations, suggère un niveau parmi EXACTEMENT ces 4 valeurs :',
    'Débutant, Intermédiaire, Avancé, Maîtrisé.',
    '',
    'Réponds UNIQUEMENT au format JSON strict, sans texte autour :',
    '{"niveau": "...", "justification": "..."}',
    'où justification est une phrase courte en français expliquant le choix.',
  ].join('\n');

  const raw = await askAI(prompt);

  let parsed;
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
  } catch {
    res.status(502);
    throw new Error("Réponse de l'IA illisible, réessayez.");
  }

  const validLevels = ['Débutant', 'Intermédiaire', 'Avancé', 'Maîtrisé'];
  if (!validLevels.includes(parsed.niveau)) {
    res.status(502);
    throw new Error("Niveau suggéré invalide, réessayez.");
  }

  res.json({ suggestedLevel: parsed.niveau, reasoning: parsed.justification || '' });
});

module.exports = {
  generateTaskDescription, summarizeWeek, askData, faqChat, suggestSkillLevel,
};