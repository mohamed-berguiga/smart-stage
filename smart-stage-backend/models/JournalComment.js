const mongoose = require('mongoose');

const journalCommentSchema = new mongoose.Schema(
  {
    journalEntry: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model('JournalComment', journalCommentSchema);