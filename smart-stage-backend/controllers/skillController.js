const asyncHandler = require('express-async-handler');
const Skill = require('../models/Skill');
const StagiaireSkillEvaluation = require('../models/StagiaireSkillEvaluation');
const notify = require('../utils/notify');

/**
 * POST /api/skills  (RH uniquement) — définit une compétence du référentiel pour un département
 */
const createSkill = asyncHandler(async (req, res) => {
  const { name, description, department } = req.body;
  if (!name || !department) {
    res.status(400);
    throw new Error('name et department sont requis');
  }
  const skill = await Skill.create({ name, description, department });
  res.status(201).json(skill);
});

/**
 * GET /api/skills?department=...
 * UC "Consulter le référentiel de compétences"
 */
const getSkills = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.department) filter.department = req.query.department;
  const skills = await Skill.find(filter).populate('department', 'name').sort('name');
  res.json(skills);
});

/**
 * DELETE /api/skills/:id  (RH uniquement)
 */
const deleteSkill = asyncHandler(async (req, res) => {
  const skill = await Skill.findByIdAndDelete(req.params.id);
  if (!skill) {
    res.status(404);
    throw new Error('Compétence introuvable');
  }
  res.json({ message: 'Compétence supprimée', id: req.params.id });
});

/**
 * PUT/POST /api/skills/evaluations
 * Encadrant évalue (ou met à jour) le niveau d'un stagiaire sur une compétence donnée.
 */
const evaluateSkill = asyncHandler(async (req, res) => {
  const { stagiaire, skill, level, comment } = req.body;
  if (!stagiaire || !skill || !level) {
    res.status(400);
    throw new Error('stagiaire, skill et level sont requis');
  }

  const evaluation = await StagiaireSkillEvaluation.findOneAndUpdate(
    { stagiaire, skill },
    { stagiaire, skill, level, comment, evaluatedBy: req.user._id },
    { new: true, upsert: true, runValidators: true }
  );

  await notify(stagiaire, 'Votre niveau de compétence a été mis à jour', 'EvaluationCompetence');

  res.status(201).json(evaluation);
});

/**
 * GET /api/skills/evaluations/:stagiaireId
 * Retourne la progression complète d'un stagiaire (utilisé pour la barre de progression frontend).
 */
const getStagiaireEvaluations = asyncHandler(async (req, res) => {
  const evaluations = await StagiaireSkillEvaluation.find({ stagiaire: req.params.stagiaireId })
    .populate('skill', 'name description')
    .populate('evaluatedBy', 'firstName lastName')
    .sort('-updatedAt');
  res.json(evaluations);
});

module.exports = {
  createSkill,
  getSkills,
  deleteSkill,
  evaluateSkill,
  getStagiaireEvaluations,
};