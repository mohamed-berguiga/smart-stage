const asyncHandler = require('express-async-handler');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const Report = require('../models/Report');
const Task = require('../models/Task');

/**
 * POST /api/reports/weekly/:stagiaireId
 */
const generateWeeklyReport = asyncHandler(async (req, res) => {
  const { stagiaireId } = req.params;
  const periodEnd = req.body.periodEnd ? new Date(req.body.periodEnd) : new Date();
  const periodStart = req.body.periodStart
    ? new Date(req.body.periodStart)
    : new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

  const tasks = await Task.find({
    assignedTo: stagiaireId,
    isPersonal: false,
    createdAt: { $gte: periodStart, $lte: periodEnd },
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Terminée').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'En cours').length;
  const lateTasks = tasks.filter((t) => t.isLate).length;
  const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 10000) / 100;

  const report = await Report.create({
    stagiaire: stagiaireId,
    periodStart,
    periodEnd,
    totalTasks,
    completedTasks,
    inProgressTasks,
    lateTasks,
    completionRate,
  });

  res.status(201).json(report);
});

/**
 * GET /api/reports/stagiaire/:stagiaireId
 */
const getReportsByStagiaire = asyncHandler(async (req, res) => {
  const reports = await Report.find({ stagiaire: req.params.stagiaireId }).sort('-periodEnd');
  res.json(reports);
});

/**
 * POST /api/reports/pdf  (tout utilisateur connecté)
 * Génère un PDF générique à partir des statistiques déjà calculées côté
 * frontend (RH / Encadrant / Stagiaire ont chacun leur propre vue), pour
 * éviter de dupliquer la logique d'agrégation côté serveur.
 *
 * Body : { title, subtitle?, stats?: [{label,value}], rows?: [{label,value}],
 *          weekly?: [{week,done}] }
 */
const generatePdfReport = asyncHandler(async (req, res) => {
  const { title, subtitle, stats, rows, weekly } = req.body;
  if (!title) {
    res.status(400);
    throw new Error('title est requis');
  }

  const fileName = `rapport-${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`;
  const filePath = path.join(__dirname, '..', 'uploads', fileName);
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);

  doc.fontSize(20).fillColor('#1E3A8A').text('SMART STAGE', { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(14).fillColor('#111827').text(String(title), { align: 'center' });
  if (subtitle) {
    doc.moveDown(0.2);
    doc.fontSize(10).fillColor('#6B7280').text(String(subtitle), { align: 'center' });
  }
  doc.moveDown(1.5);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#D1D5DB').stroke();
  doc.moveDown(1);

  if (Array.isArray(stats) && stats.length > 0) {
    doc.fontSize(12).fillColor('#1E3A8A').text('Indicateurs clés', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#111827');
    stats.forEach((s) => {
      doc.text(`${s.label} : ${s.value}`);
      doc.moveDown(0.25);
    });
    doc.moveDown(1);
  }

  if (Array.isArray(rows) && rows.length > 0) {
    doc.fontSize(12).fillColor('#1E3A8A').text('Détail', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#111827');
    rows.forEach((r) => {
      doc.text(`${r.label} : ${r.value}`);
      doc.moveDown(0.2);
    });
    doc.moveDown(1);
  }

  if (Array.isArray(weekly) && weekly.length > 0) {
    doc.fontSize(12).fillColor('#1E3A8A').text('Évolution hebdomadaire', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#111827');
    weekly.forEach((w) => {
      doc.text(`${w.week} : ${w.done} tâche(s) terminée(s)`);
      doc.moveDown(0.2);
    });
  }

  doc.moveDown(2);
  doc.fontSize(9).fillColor('#6B7280').text(
    `Généré le ${new Date().toLocaleDateString('fr-FR')} par ${req.user.firstName} ${req.user.lastName}`,
    { align: 'right' },
  );

  doc.end();

  await new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });

  res.status(201).json({ fileUrl: `/uploads/${fileName}` });
});

module.exports = { generateWeeklyReport, getReportsByStagiaire, generatePdfReport };