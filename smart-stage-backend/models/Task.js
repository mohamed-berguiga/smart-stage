const mongoose = require('mongoose');
const { TASK_TYPES, TASK_PRIORITIES, TASK_STATUSES } = require('../config/constants');

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    type: { type: String, enum: TASK_TYPES, required: true },
    priority: { type: String, enum: TASK_PRIORITIES, default: 'Moyenne' },
    status: { type: String, enum: TASK_STATUSES, default: 'À faire' },
    isPersonal: { type: Boolean, default: false },
    dueDate: { type: Date },

    // Créateur : RH, Encadrant ou le stagiaire lui-même (tâche personnelle)
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Stagiaire concerné par la tâche (obligatoire même pour les tâches personnelles)
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true } // createdAt / updatedAt automatiques
);

// Calcule dynamiquement si la tâche est en retard, sans stocker ce statut en base.
// Règle du cahier des charges : dateActuelle > dueDate ET statut != "Terminée".
taskSchema.virtual('isLate').get(function computeIsLate() {
  if (!this.dueDate) return false;
  return this.status !== 'Terminée' && new Date() > this.dueDate;
});

taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

// Index utiles pour les filtres fréquents (par stagiaire, par statut)
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ creator: 1 });

module.exports = mongoose.model('Task', taskSchema);
