const mongoose = require('mongoose');

const importErrorSchema = new mongoose.Schema(
  {
    importBatch: { type: mongoose.Schema.Types.ObjectId, ref: 'ImportBatch', required: true },
    rowNumber: { type: Number, required: true },
    errorMessage: { type: String, required: true },
  },
  { timestamps: false }
);

module.exports = mongoose.model('ImportError', importErrorSchema);
