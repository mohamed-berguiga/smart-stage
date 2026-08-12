const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Skill', skillSchema);
