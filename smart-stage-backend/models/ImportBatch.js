const mongoose = require('mongoose');
const { IMPORT_STATUSES } = require('../config/constants');

const importBatchSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    importedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    totalRows: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    errorCount: { type: Number, default: 0 },
    status: { type: String, enum: IMPORT_STATUSES, default: 'EnCours' },
  },
  { timestamps: { createdAt: 'importDate', updatedAt: true } }
);

module.exports = mongoose.model('ImportBatch', importBatchSchema);
