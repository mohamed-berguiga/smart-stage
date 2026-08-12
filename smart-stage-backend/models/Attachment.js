const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true }, // chemin/URL vers le fichier stocké
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: 'uploadedAt', updatedAt: false } }
);

module.exports = mongoose.model('Attachment', attachmentSchema);
