const asyncHandler = require('express-async-handler');
const JournalEntry = require('../models/JournalEntry');
const JournalComment = require('../models/JournalComment');

/**
 * POST /api/journal  (Stagiaire uniquement)
 */
const createEntry = asyncHandler(async (req, res) => {
  const { title, text, hours } = req.body;

  if (!title) {
    res.status(400);
    throw new Error('title est requis');
  }
  if (!req.user.department) {
    res.status(400);
    throw new Error('Aucun département associé à votre compte. Contactez le RH.');
  }

  const entry = await JournalEntry.create({
    author: req.user._id,
    department: req.user.department,
    title,
    text,
    hours: hours !== undefined && hours !== '' ? Number(hours) : undefined,
  });

  await entry.populate([
    { path: 'author', select: 'firstName lastName role' },
    { path: 'department', select: 'name' },
  ]);

  res.status(201).json(entry);
});

/**
 * GET /api/journal
 * RH : toutes les entrées. Encadrant : celles de son département.
 * Stagiaire : uniquement les siennes.
 */
const getEntries = asyncHandler(async (req, res) => {
  let filter = {};
  if (req.user.role === 'ENCADRANT') {
    filter = { department: req.user.department };
  } else if (req.user.role === 'STAGIAIRE') {
    filter = { author: req.user._id };
  }

  const entries = await JournalEntry.find(filter)
    .populate('author', 'firstName lastName role')
    .populate('department', 'name')
    .sort('-createdAt');

  res.json(entries);
});

/**
 * PATCH /api/journal/:id/visa  (Encadrant uniquement) — bascule le visa
 */
const toggleVisa = asyncHandler(async (req, res) => {
  const entry = await JournalEntry.findById(req.params.id);
  if (!entry) {
    res.status(404);
    throw new Error('Entrée introuvable');
  }
  entry.visaed = !entry.visaed;
  await entry.save();
  res.json(entry);
});

/**
 * POST /api/journal/:id/comments — ajoute un commentaire sur une entrée précise
 */
const addComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content) {
    res.status(400);
    throw new Error('content est requis');
  }
  const entry = await JournalEntry.findById(req.params.id);
  if (!entry) {
    res.status(404);
    throw new Error('Entrée introuvable');
  }
  const comment = await JournalComment.create({
    journalEntry: entry._id,
    author: req.user._id,
    content,
  });
  await comment.populate('author', 'firstName lastName role');
  res.status(201).json(comment);
});

/**
 * GET /api/journal/:id/comments
 */
const getComments = asyncHandler(async (req, res) => {
  const comments = await JournalComment.find({ journalEntry: req.params.id })
    .populate('author', 'firstName lastName role')
    .sort('createdAt');
  res.json(comments);
});

module.exports = { createEntry, getEntries, toggleVisa, addComment, getComments };