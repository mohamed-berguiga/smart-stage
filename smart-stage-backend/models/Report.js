const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    stagiaire: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    inProgressTasks: { type: Number, default: 0 },
    lateTasks: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 }, // en pourcentage
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
