const express = require('express');
const {
  generateWeeklyReport, getReportsByStagiaire, generatePdfReport,
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.post('/weekly/:stagiaireId', allowRoles('RH', 'ENCADRANT'), generateWeeklyReport);
router.get('/stagiaire/:stagiaireId', getReportsByStagiaire);
router.post('/pdf', generatePdfReport);

module.exports = router;