const express = require('express');
const {
  generateTaskDescription, summarizeWeek, askData, faqChat, suggestSkillLevel,
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.post('/generate-task-description', generateTaskDescription);
router.post('/summarize-week/:stagiaireId', summarizeWeek);
router.post('/ask-data', allowRoles('RH'), askData);
router.post('/faq-chat', faqChat);
router.post('/suggest-skill-level', allowRoles('ENCADRANT'), suggestSkillLevel);

module.exports = router;