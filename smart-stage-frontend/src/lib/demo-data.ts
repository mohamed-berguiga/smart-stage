export type TaskStatus = "A faire" | "En cours" | "Terminée" | "En retard";
export type TaskPriority = "Faible" | "Moyenne" | "Haute" | "Urgente";

export type Task = {
  id: string;
  title: string;
  type: string;
  priority: TaskPriority;
  status: TaskStatus;
  deadline: string;
  assignedTo: string;
  createdBy: string;
  createdAt?: string;
  isPersonal?: boolean;
};

export const departments = [
  { name: "IT", tasks: 50, interns: 6 },
  { name: "Marketing", tasks: 20, interns: 3 },
  { name: "Finance", tasks: 15, interns: 2 },
  { name: "RH", tasks: 11, interns: 1 },
];

export const interns = [
  { id: "s1", name: "Ahmed Mohamed", department: "IT", supervisor: "Nadia Bensaid", tasks: 15, done: 11, progress: 75 },
  { id: "s2", name: "Ali Trabelsi", department: "IT", supervisor: "Nadia Bensaid", tasks: 10, done: 6, progress: 60 },
  { id: "s3", name: "Sami Gharbi", department: "Marketing", supervisor: "Karim Haddad", tasks: 8, done: 7, progress: 88 },
  { id: "s4", name: "Ines Khelifi", department: "Finance", supervisor: "Sonia Mejri", tasks: 12, done: 5, progress: 42 },
];

export const supervisors = [
  { id: "e1", name: "Nadia Bensaid", department: "IT", interns: 2, openTasks: 9 },
  { id: "e2", name: "Karim Haddad", department: "Marketing", interns: 1, openTasks: 3 },
  { id: "e3", name: "Sonia Mejri", department: "Finance", interns: 1, openTasks: 7 },
];

export const tasks: Task[] = [
  { id: "t1", title: "Intégrer la page de connexion", type: "Développement", priority: "Haute", status: "En cours", deadline: "12 août", assignedTo: "Ahmed Mohamed", createdBy: "Nadia Bensaid" },
  { id: "t2", title: "Rédiger la documentation API", type: "Documentation", priority: "Moyenne", status: "Terminée", deadline: "05 août", assignedTo: "Ahmed Mohamed", createdBy: "Nadia Bensaid" },
  { id: "t3", title: "Corriger le bug d'affectation", type: "Correction", priority: "Urgente", status: "En retard", deadline: "01 août", assignedTo: "Ali Trabelsi", createdBy: "Nadia Bensaid" },
  { id: "t4", title: "Réunion de suivi hebdomadaire", type: "Réunion", priority: "Faible", status: "A faire", deadline: "14 août", assignedTo: "Ali Trabelsi", createdBy: "Nadia Bensaid" },
  { id: "t5", title: "Étude de marché concurrents", type: "Recherche", priority: "Moyenne", status: "En cours", deadline: "18 août", assignedTo: "Sami Gharbi", createdBy: "Karim Haddad" },
  { id: "t6", title: "Formation tableaux croisés", type: "Formation", priority: "Faible", status: "Terminée", deadline: "02 août", assignedTo: "Ines Khelifi", createdBy: "Sonia Mejri" },
];

export const personalTasks = [
  { id: "p1", title: "Apprendre React Router", done: true },
  { id: "p2", title: "Préparer le rapport de stage", done: false },
  { id: "p3", title: "Réviser MongoDB", done: false },
];

export const comments = [
  { id: "c1", author: "Nadia Bensaid", role: "Encadrant", text: "Pense à valider les champs du formulaire avant l'envoi.", time: "il y a 2 h" },
  { id: "c2", author: "Ahmed Mohamed", role: "Stagiaire", text: "C'est fait, j'ai ajouté la validation et un message d'erreur.", time: "il y a 1 h" },
];

export const notifications = [
  { id: "n1", text: "Nouvelle tâche assignée : Intégrer la page de connexion", tone: "primary" as const },
  { id: "n2", text: "Échéance proche : Corriger le bug d'affectation", tone: "warning" as const },
  { id: "n3", text: "Commentaire ajouté par Nadia Bensaid", tone: "muted" as const },
];

export const statusBreakdown = [
  { label: "Terminées", value: 70, tone: "success" as const },
  { label: "En cours", value: 20, tone: "warning" as const },
  { label: "En retard", value: 10, tone: "danger" as const },
];

export const weeklyProgress = [
  { week: "S1", done: 4 },
  { week: "S2", done: 7 },
  { week: "S3", done: 8 },
  { week: "S4", done: 12 },
];

export type JournalEntry = {
  id: string;
  date: string;
  author: string;
  role: "RH" | "Encadrant" | "Stagiaire";
  department: string;
  title: string;
  text: string;
  hours?: number;
};

export const journal: JournalEntry[] = [
  { id: "j1", date: "06 août", author: "Ahmed Mohamed", role: "Stagiaire", department: "IT", title: "Intégration de la page de connexion", text: "Mise en place du formulaire, validation des champs et gestion des erreurs.", hours: 6 },
  { id: "j2", date: "05 août", author: "Ahmed Mohamed", role: "Stagiaire", department: "IT", title: "Documentation API", text: "Rédaction des endpoints utilisateurs et tâches.", hours: 4 },
  { id: "j3", date: "05 août", author: "Nadia Bensaid", role: "Encadrant", department: "IT", title: "Revue de code Ahmed", text: "Retours sur la validation du formulaire, tâche renvoyée en cours.", hours: 1 },
  { id: "j4", date: "04 août", author: "Ali Trabelsi", role: "Stagiaire", department: "IT", title: "Bug d'affectation", text: "Analyse du bug, correctif partiel, tâche encore en retard.", hours: 5 },
  { id: "j5", date: "04 août", author: "Sami Gharbi", role: "Stagiaire", department: "Marketing", title: "Étude de marché", text: "Benchmark de 5 concurrents, synthèse en cours.", hours: 3 },
  { id: "j6", date: "03 août", author: "Leila Mansour", role: "RH", department: "Ressources Humaines", title: "Ouverture de 2 comptes stagiaires", text: "Comptes créés et affectés aux encadrants IT et Finance.", hours: 2 },
];

/* ----------------------- Compétences & évaluations ----------------------- */

export type SkillLevel = "Débutant" | "Intermédiaire" | "Avancé" | "Maîtrisé";

export const skillLevels: SkillLevel[] = ["Débutant", "Intermédiaire", "Avancé", "Maîtrisé"];

export const levelPercent: Record<SkillLevel, number> = {
  Débutant: 25,
  Intermédiaire: 50,
  Avancé: 75,
  Maîtrisé: 100,
};

export type Skill = {
  id: string;
  name: string;
  description: string;
  department: string;
};

export const skills: Skill[] = [
  { id: "sk1", name: "React & composants", description: "Créer des interfaces réutilisables et lisibles.", department: "IT" },
  { id: "sk2", name: "API REST", description: "Consommer et documenter des endpoints.", department: "IT" },
  { id: "sk3", name: "Git & collaboration", description: "Branches, revues de code, résolution de conflits.", department: "IT" },
  { id: "sk4", name: "Rédaction de contenu", description: "Produire des contenus clairs et ciblés.", department: "Marketing" },
  { id: "sk5", name: "Analyse concurrentielle", description: "Benchmarker et synthétiser un marché.", department: "Marketing" },
  { id: "sk6", name: "Tableaux de bord Excel", description: "Modéliser et visualiser des données financières.", department: "Finance" },
];

export type SkillEvaluation = {
  id: string;
  intern: string;
  skillId: string;
  level: SkillLevel;
  comment: string;
  evaluatedBy: string;
  evaluatedAt: string;
};

export const skillEvaluations: SkillEvaluation[] = [
  { id: "ev1", intern: "Ahmed Mohamed", skillId: "sk1", level: "Avancé", comment: "Très bonne maîtrise des composants.", evaluatedBy: "Nadia Bensaid", evaluatedAt: "05 août" },
  { id: "ev2", intern: "Ahmed Mohamed", skillId: "sk2", level: "Intermédiaire", comment: "À consolider sur la gestion d'erreurs.", evaluatedBy: "Nadia Bensaid", evaluatedAt: "05 août" },
  { id: "ev3", intern: "Ali Trabelsi", skillId: "sk3", level: "Débutant", comment: "", evaluatedBy: "Nadia Bensaid", evaluatedAt: "04 août" },
];

/* ---------------------------- Stages & attestations --------------------- */

export type StagePeriod = { startDate: string; endDate: string };

/** Périodes de stage (ISO) — utilisées pour l'attestation de fin de stage. */
export const stagePeriods: Record<string, StagePeriod> = {
  "Ahmed Mohamed": { startDate: "2026-02-01", endDate: "2026-07-31" },
  "Ali Trabelsi": { startDate: "2026-03-01", endDate: "2026-09-30" },
  "Sami Gharbi": { startDate: "2026-01-15", endDate: "2026-06-30" },
  "Ines Khelifi": { startDate: "2026-04-01", endDate: "2026-10-31" },
};

export type Attestation = {
  id: string;
  intern: string;
  issueDate: string;
  startDate: string;
  endDate: string;
  status: "Généré";
};

export const attestations: Attestation[] = [
  { id: "at1", intern: "Sami Gharbi", issueDate: "2026-07-02", startDate: "2026-01-15", endDate: "2026-06-30", status: "Généré" },
];
