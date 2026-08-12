const asyncHandler = require('express-async-handler');
const XLSX = require('xlsx');
const fs = require('fs');
const User = require('../models/User');
const Stage = require('../models/Stage');
const ImportBatch = require('../models/ImportBatch');
const ImportError = require('../models/ImportError');

const REQUIRED_COLUMNS = ['firstName', 'lastName', 'email', 'password'];

/**
 * Valide une ligne du fichier importé. Retourne un message d'erreur (string) ou null si OK.
 */
function validateRow(row, existingEmails) {
  for (const col of REQUIRED_COLUMNS) {
    if (!row[col] || String(row[col]).trim() === '') {
      return `Colonne "${col}" manquante ou vide`;
    }
  }
  const email = String(row.email).toLowerCase().trim();
  if (existingEmails.has(email)) {
    return `Email en double dans le fichier ou déjà utilisé : ${email}`;
  }
  return null;
}

/**
 * POST /api/imports/stagiaires  (RH uniquement, multipart/form-data)
 * Champs du formulaire : "file" (obligatoire), et optionnellement
 * "department", "encadrant", "startDate", "endDate" appliqués à
 * TOUS les stagiaires importés (utile pour une rentrée en bloc).
 */
const importStagiaires = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Aucun fichier reçu (champ attendu : "file")');
  }

  const { department, encadrant, startDate, endDate } = req.body;
  const createStageLinks = !!(department && encadrant && startDate && endDate);

  const workbook = XLSX.readFile(req.file.path);
  const sheetName = workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

  const batch = await ImportBatch.create({
    fileName: req.file.originalname,
    importedBy: req.user._id,
    totalRows: rows.length,
    status: 'EnCours',
  });

  const existingUsers = await User.find({}, 'email').lean();
  const existingEmails = new Set(existingUsers.map((u) => u.email));

  let successCount = 0;
  const errors = [];

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const rowNumber = i + 2;
    const validationError = validateRow(row, existingEmails);

    if (!validationError) {
      try {
        const user = await User.create({
          firstName: row.firstName,
          lastName: row.lastName,
          email: String(row.email).toLowerCase().trim(),
          password: String(row.password),
          phone: row.phone || '',
          role: 'STAGIAIRE',
          department: department || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });

        if (createStageLinks) {
          await Stage.findOneAndUpdate(
            { stagiaire: user._id },
            { stagiaire: user._id, encadrant, department, startDate, endDate },
            { upsert: true }
          );
        }

        existingEmails.add(String(row.email).toLowerCase().trim());
        successCount += 1;
      } catch (err) {
        errors.push({ importBatch: batch._id, rowNumber, errorMessage: err.message });
      }
    } else {
      errors.push({ importBatch: batch._id, rowNumber, errorMessage: validationError });
    }
  }

  if (errors.length > 0) {
    await ImportError.insertMany(errors);
  }

  batch.successCount = successCount;
  batch.errorCount = errors.length;
  batch.status = 'Terminé';
  await batch.save();

  fs.unlink(req.file.path, () => {});

  res.status(201).json({
    batchId: batch._id,
    totalRows: rows.length,
    successCount,
    errorCount: errors.length,
    errors: errors.map((e) => ({ rowNumber: e.rowNumber, errorMessage: e.errorMessage })),
  });
});

const getImportBatches = asyncHandler(async (req, res) => {
  const batches = await ImportBatch.find().populate('importedBy', 'firstName lastName').sort('-importDate');
  res.json(batches);
});

const getImportErrors = asyncHandler(async (req, res) => {
  const errors = await ImportError.find({ importBatch: req.params.id }).sort('rowNumber');
  res.json(errors);
});

module.exports = { importStagiaires, getImportBatches, getImportErrors };