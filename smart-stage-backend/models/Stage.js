const mongoose = require('mongoose');

// Représente l'affectation d'un stagiaire à un encadrant et un département.
const stageSchema = new mongoose.Schema(
  {
    stagiaire: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    encadrant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  { timestamps: true }
);

// Un stagiaire ne peut avoir qu'une seule affectation active à la fois
stageSchema.index({ stagiaire: 1 }, { unique: true });

module.exports = mongoose.model('Stage', stageSchema);
