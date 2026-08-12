const asyncHandler = require('express-async-handler');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const Attestation = require('../models/Attestation');
const Stage = require('../models/Stage');
const User = require('../models/User');
const notify = require('../utils/notify');

/**
 * POST /api/attestations/:stagiaireId  (RH uniquement)
 * UC "Générer une attestation de stage" -> include "Vérifier l'éligibilité (stage terminé)"
 */
const generateAttestation = asyncHandler(async (req, res) => {
  const { stagiaireId } = req.params;

  const stagiaire = await User.findById(stagiaireId);
  if (!stagiaire || stagiaire.role !== 'STAGIAIRE') {
    res.status(404);
    throw new Error('Stagiaire introuvable');
  }

  const stage = await Stage.findOne({ stagiaire: stagiaireId })
    .populate('encadrant', 'firstName lastName')
    .populate('department', 'name');

  if (!stage) {
    res.status(404);
    throw new Error("Aucune affectation trouvée pour ce stagiaire");
  }

  // --- Vérifier l'éligibilité : le stage doit être terminé ---
  if (new Date() < new Date(stage.endDate)) {
    res.status(400);
    throw new Error(`Stage non terminé (fin prévue le ${stage.endDate.toISOString().slice(0, 10)})`);
  }

  // --- Génération du PDF ---
  const fileName = `attestation-${stagiaireId}-${Date.now()}.pdf`;
  const filePath = path.join(__dirname, '..', 'uploads', fileName);
  const doc = new PDFDocument({ size: 'A4', margin: 60 });
  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);

  doc.fontSize(20).fillColor('#1E3A8A').text('SMART STAGE', { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(14).fillColor('#111827').text("ATTESTATION DE STAGE", { align: 'center' });
  doc.moveDown(2);

  doc.fontSize(11).fillColor('#111827').text(
    `Nous soussignés, certifions que ${stagiaire.firstName} ${stagiaire.lastName} a effectué un stage ` +
    `au sein du département ${stage.department.name}, sous l'encadrement de ` +
    `${stage.encadrant.firstName} ${stage.encadrant.lastName}, ` +
    `du ${new Date(stage.startDate).toLocaleDateString('fr-FR')} ` +
    `au ${new Date(stage.endDate).toLocaleDateString('fr-FR')}.`,
    { align: 'justify', lineGap: 4 }
  );

  doc.moveDown(2);
  doc.text(`Fait pour servir et valoir ce que de droit.`);
  doc.moveDown(3);
  doc.text(`Fait le ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' });
  doc.moveDown(2);
  doc.text('Signature RH : ______________________', { align: 'right' });

  doc.end();

  await new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });

  const attestation = await Attestation.create({
    stagiaire: stagiaireId,
    startDate: stage.startDate,
    endDate: stage.endDate,
    fileUrl: `/uploads/${fileName}`,
    status: 'Généré',
  });

  await notify(stagiaireId, 'Votre attestation de stage est disponible', 'AttestationDisponible');

  res.status(201).json(attestation);
});

/**
 * GET /api/attestations/:stagiaireId
 */
const getAttestationsByStagiaire = asyncHandler(async (req, res) => {
  const attestations = await Attestation.find({ stagiaire: req.params.stagiaireId }).sort('-issueDate');
  res.json(attestations);
});

module.exports = { generateAttestation, getAttestationsByStagiaire };
