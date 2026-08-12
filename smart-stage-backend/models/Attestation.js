const mongoose = require('mongoose');
const { ATTESTATION_STATUSES } = require('../config/constants');

const attestationSchema = new mongoose.Schema(
  {
    stagiaire: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    issueDate: { type: Date, default: Date.now },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    fileUrl: { type: String, required: true },
    status: { type: String, enum: ATTESTATION_STATUSES, default: 'Généré' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Attestation', attestationSchema);
