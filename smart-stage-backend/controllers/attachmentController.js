const asyncHandler = require('express-async-handler');
const Attachment = require('../models/Attachment');
const Task = require('../models/Task');

/**
 * POST /api/tasks/:taskId/attachments  (multipart/form-data, champ "file")
 */
const uploadAttachment = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId);
  if (!task) {
    res.status(404);
    throw new Error('Tâche introuvable');
  }

  if (!req.file) {
    res.status(400);
    throw new Error('Aucun fichier reçu (champ attendu : "file")');
  }

  const attachment = await Attachment.create({
    task: task._id,
    fileName: req.file.originalname,
    fileUrl: `/uploads/${req.file.filename}`,
    uploadedBy: req.user._id,
  });

  res.status(201).json(attachment);
});

/**
 * GET /api/tasks/:taskId/attachments
 */
const getAttachments = asyncHandler(async (req, res) => {
  const attachments = await Attachment.find({ task: req.params.taskId }).sort('-uploadedAt');
  res.json(attachments);
});

module.exports = { uploadAttachment, getAttachments };
