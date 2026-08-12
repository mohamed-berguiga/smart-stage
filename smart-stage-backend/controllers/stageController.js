const asyncHandler = require('express-async-handler');
const Stage = require('../models/Stage');
const User = require('../models/User');

/**
 * POST /api/stages  (RH uniquement)
 * Affecte un stagiaire à un encadrant et un département.
 */
const createStage = asyncHandler(async (req, res) => {
  const { stagiaire, encadrant, department, startDate, endDate } = req.body;

  if (!stagiaire || !encadrant || !department || !startDate || !endDate) {
    res.status(400);
    throw new Error('stagiaire, encadrant, department, startDate et endDate sont requis');
  }

  // Vérifications de cohérence des rôles
  const [stagiaireUser, encadrantUser] = await Promise.all([
    User.findById(stagiaire),
    User.findById(encadrant),
  ]);

  if (!stagiaireUser || stagiaireUser.role !== 'STAGIAIRE') {
    res.status(400);
    throw new Error("L'utilisateur désigné comme stagiaire n'a pas le rôle STAGIAIRE");
  }
  if (!encadrantUser || encadrantUser.role !== 'ENCADRANT') {
    res.status(400);
    throw new Error("L'utilisateur désigné comme encadrant n'a pas le rôle ENCADRANT");
  }

  // Un stagiaire ne peut avoir qu'une seule affectation : on remplace si elle existe déjà
  const stage = await Stage.findOneAndUpdate(
    { stagiaire },
    { stagiaire, encadrant, department, startDate, endDate },
    { new: true, upsert: true, runValidators: true }
  );

  // On garde le département/dates aussi sur le profil User pour un accès rapide
  await User.findByIdAndUpdate(stagiaire, { department, startDate, endDate });

  res.status(201).json(stage);
});

const getStages = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.encadrant) filter.encadrant = req.query.encadrant;
  if (req.query.department) filter.department = req.query.department;

  const stages = await Stage.find(filter)
    .populate('stagiaire', 'firstName lastName email')
    .populate('encadrant', 'firstName lastName email')
    .populate('department', 'name');

  res.json(stages);
});

const updateStage = asyncHandler(async (req, res) => {
  const stage = await Stage.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!stage) {
    res.status(404);
    throw new Error('Affectation introuvable');
  }
  res.json(stage);
});

const deleteStage = asyncHandler(async (req, res) => {
  const stage = await Stage.findByIdAndDelete(req.params.id);
  if (!stage) {
    res.status(404);
    throw new Error('Affectation introuvable');
  }
  res.json({ message: 'Affectation supprimée', id: req.params.id });
});

module.exports = { createStage, getStages, updateStage, deleteStage };
