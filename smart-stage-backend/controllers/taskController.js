const asyncHandler = require('express-async-handler');
const Task = require('../models/Task');
const TaskHistory = require('../models/TaskHistory');
const Stage = require('../models/Stage');
const notify = require('../utils/notify');

/**
 * Construit le filtre MongoDB de base selon le rôle de l'utilisateur connecté.
 * C'est ici qu'on applique les règles de confidentialité du cahier des charges :
 *  - RH voit toutes les tâches professionnelles (pas les tâches personnelles)
 *  - Encadrant voit les tâches de ses stagiaires (pas les tâches personnelles des autres)
 *  - Stagiaire voit uniquement ses propres tâches
 */
const buildScopeFilter = async (user) => {
  if (user.role === 'RH') {
    return { isPersonal: false };
  }

  if (user.role === 'ENCADRANT') {
    const stages = await Stage.find({ encadrant: user._id }).select('stagiaire');
    const stagiaireIds = stages.map((s) => s.stagiaire);
    return {
      $or: [
        { creator: user._id, isPersonal: true }, // ses propres tâches perso
        { assignedTo: { $in: stagiaireIds }, isPersonal: false }, // tâches pro de ses stagiaires
      ],
    };
  }

  // STAGIAIRE : ses tâches pro assignées + ses propres tâches perso
  return {
    assignedTo: user._id,
    $or: [{ isPersonal: false }, { isPersonal: true, creator: user._id }],
  };
};

/**
 * POST /api/tasks
 * Encadrant : crée une tâche professionnelle pour un de ses stagiaires.
 * Stagiaire/Encadrant : peut aussi créer une tâche personnelle (isPersonal = true, assignedTo = lui-même).
 */
const createTask = asyncHandler(async (req, res) => {
  const { title, description, type, priority, status, dueDate, isPersonal, assignedTo } = req.body;

  if (!title || !type) {
    res.status(400);
    throw new Error('title et type sont requis');
  }

  let finalAssignedTo = assignedTo;
  let finalIsPersonal = !!isPersonal;

  if (finalIsPersonal) {
    // Une tâche personnelle est toujours assignée à son créateur, jamais visible par les autres
    finalAssignedTo = req.user._id;
  } else {
    if (req.user.role !== 'ENCADRANT') {
      res.status(403);
      throw new Error('Seul un encadrant peut créer une tâche professionnelle');
    }
    if (!finalAssignedTo) {
      res.status(400);
      throw new Error('assignedTo (stagiaire) est requis pour une tâche professionnelle');
    }
    // Vérifie que ce stagiaire lui est bien affecté
    const stage = await Stage.findOne({ encadrant: req.user._id, stagiaire: finalAssignedTo });
    if (!stage) {
      res.status(403);
      throw new Error("Ce stagiaire ne vous est pas affecté");
    }
  }

  const task = await Task.create({
    title, description, type, priority, status, dueDate,
    isPersonal: finalIsPersonal,
    creator: req.user._id,
    assignedTo: finalAssignedTo,
  });

  await TaskHistory.create({
    task: task._id,
    action: 'Tâche créée',
    performedBy: req.user._id,
  });

  if (!finalIsPersonal) {
    await notify(finalAssignedTo, `Nouvelle tâche : "${title}"`, 'NouvelleTâche');
  }

  res.status(201).json(task);
});

/**
 * GET /api/tasks
 * Filtres possibles : status, priority, type, assignedTo, search (titre)
 * Le scope (qui voit quoi) est toujours appliqué automatiquement selon le rôle.
 */
const getTasks = asyncHandler(async (req, res) => {
  const scope = await buildScopeFilter(req.user);
  const filter = { ...scope };

  if (req.query.status) filter.status = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;
  if (req.query.type) filter.type = req.query.type;
  if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
  if (req.query.search) filter.title = { $regex: req.query.search, $options: 'i' };

  const tasks = await Task.find(filter)
    .populate('creator', 'firstName lastName role')
    .populate('assignedTo', 'firstName lastName')
    .sort('-createdAt');

  res.json(tasks);
});

/**
 * GET /api/tasks/:id
 */
const getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('creator', 'firstName lastName role')
    .populate('assignedTo', 'firstName lastName');

  if (!task) {
    res.status(404);
    throw new Error('Tâche introuvable');
  }

  // Vérification d'accès : le user doit être dans le scope de cette tâche
  const scope = await buildScopeFilter(req.user);
  const allowed = await Task.exists({ _id: task._id, ...scope });
  if (!allowed) {
    res.status(403);
    throw new Error('Accès refusé à cette tâche');
  }

  res.json(task);
});

/**
 * PUT /api/tasks/:id — modification générale (titre, description, priorité, échéance...)
 */
const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    res.status(404);
    throw new Error('Tâche introuvable');
  }

  const isOwnerOrCreator =
    String(task.creator) === String(req.user._id) || String(task.assignedTo) === String(req.user._id);
  if (!isOwnerOrCreator && req.user.role !== 'RH') {
    res.status(403);
    throw new Error("Vous n'êtes pas autorisé à modifier cette tâche");
  }

  const { title, description, priority, type, dueDate } = req.body;
  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (priority !== undefined) task.priority = priority;
  if (type !== undefined) task.type = type;
  if (dueDate !== undefined) task.dueDate = dueDate;

  await task.save();
  res.json(task);
});

/**
 * PATCH /api/tasks/:id/status — changement de statut (utilisé aussi par la vue Kanban drag & drop)
 */
const changeTaskStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const task = await Task.findById(req.params.id);
  if (!task) {
    res.status(404);
    throw new Error('Tâche introuvable');
  }

  const isAssignee = String(task.assignedTo) === String(req.user._id);
  const isCreator = String(task.creator) === String(req.user._id);
  if (!isAssignee && !isCreator && req.user.role !== 'RH') {
    res.status(403);
    throw new Error("Vous n'êtes pas autorisé à changer le statut de cette tâche");
  }

  const previousStatus = task.status;
  task.status = status;
  await task.save();

  await TaskHistory.create({
    task: task._id,
    action: `Statut → ${status}`,
    performedBy: req.user._id,
  });

  // Notifie le créateur (encadrant) quand une tâche pro passe à "Terminée"
  if (!task.isPersonal && status === 'Terminée' && previousStatus !== 'Terminée') {
    await notify(task.creator, `La tâche "${task.title}" a été terminée`, 'TâcheTerminée');
  }

  res.json(task);
});

/**
 * DELETE /api/tasks/:id
 */
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    res.status(404);
    throw new Error('Tâche introuvable');
  }

  const isCreator = String(task.creator) === String(req.user._id);
  if (!isCreator && req.user.role !== 'RH') {
    res.status(403);
    throw new Error("Vous n'êtes pas autorisé à supprimer cette tâche");
  }

  await task.deleteOne();
  res.json({ message: 'Tâche supprimée', id: req.params.id });
});

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  changeTaskStatus,
  deleteTask,
  buildScopeFilter, // exporté pour être réutilisé par reportController
};
