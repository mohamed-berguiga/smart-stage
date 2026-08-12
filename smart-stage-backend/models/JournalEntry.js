const mongoose = require('mongoose');

// Journal de stage : une entrée quotidienne rédigée par un stagiaire,
// que son encadrant peut "viser" (valider) et commenter.
const journalEntrySchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    title: { type: String, required: true, trim: true },
    text: { type: String, default: '' },
    hours: { type: Number, min: 0 },
    visaed: { type: Boolean, default: false },
  },
  { timestamps: true } // createdAt sert de "date" de l'entrée
);

module.exports = mongoose.model('JournalEntry', journalEntrySchema);