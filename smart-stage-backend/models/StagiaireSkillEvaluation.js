const mongoose = require('mongoose');
const { SKILL_LEVELS } = require('../config/constants');

const stagiaireSkillEvaluationSchema = new mongoose.Schema(
  {
    stagiaire: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
    level: { type: String, enum: SKILL_LEVELS, required: true },
    comment: { type: String, default: '' },
    evaluatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: 'evaluatedAt', updatedAt: true } }
);

// Un stagiaire n'a qu'une seule évaluation par compétence (elle est mise à jour, pas dupliquée)
stagiaireSkillEvaluationSchema.index({ stagiaire: 1, skill: 1 }, { unique: true });

module.exports = mongoose.model('StagiaireSkillEvaluation', stagiaireSkillEvaluationSchema);
