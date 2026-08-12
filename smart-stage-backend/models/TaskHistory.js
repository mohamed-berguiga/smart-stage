const mongoose = require('mongoose');

const taskHistorySchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    action: { type: String, required: true }, // ex: "Statut → En cours"
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: 'timestamp', updatedAt: false } }
);

module.exports = mongoose.model('TaskHistory', taskHistorySchema);
