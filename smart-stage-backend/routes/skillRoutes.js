const express = require('express');
const {
  createSkill, getSkills, deleteSkill, evaluateSkill, getStagiaireEvaluations,
} = require('../controllers/skillController');
const { protect } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.route('/')
  .post(allowRoles('RH'), createSkill)
  .get(getSkills);

router.delete('/:id', allowRoles('RH'), deleteSkill);

router.post('/evaluations', allowRoles('ENCADRANT'), evaluateSkill);
router.get('/evaluations/:stagiaireId', getStagiaireEvaluations);

module.exports = router;