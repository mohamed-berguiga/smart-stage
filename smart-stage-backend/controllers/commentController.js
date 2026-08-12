const asyncHandler = require('express-async-handler');
const Comment = require('../models/Comment');
const Task = require('../models/Task');
const notify = require('../utils/notify');

/**
 * POST /api/tasks/:taskId/comments
 */
const addComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content) {
    res.status(400);
    throw new Error('Le contenu du commentaire est requis');
  }

  const task = await Task.findById(req.params.taskId);
  if (!task) {
    res.status(404);
    throw new Error('Tâche introuvable');
  }

  const comment = await Comment.create({
    task: task._id,
    author: req.user._id,
    content,
  });

  // Notifie l'autre partie (créateur si c'est le stagiaire qui commente, et inversement)
  const recipient = String(task.creator) === String(req.user._id) ? task.assignedTo : task.creator;
  if (recipient && String(recipient) !== String(req.user._id)) {
    await notify(recipient, `Nouveau commentaire sur "${task.title}"`, 'NouveauCommentaire');
  }

  res.status(201).json(comment);
});

/**
 * GET /api/tasks/:taskId/comments
 */
const getComments = asyncHandler(async (req, res) => {
  const comments = await Comment.find({ task: req.params.taskId })
    .populate('author', 'firstName lastName role')
    .sort('createdAt');
  res.json(comments);
});

module.exports = { addComment, getComments };
