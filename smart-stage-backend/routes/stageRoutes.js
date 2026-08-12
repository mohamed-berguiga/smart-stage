const express = require('express');
const { createStage, getStages, updateStage, deleteStage } = require('../controllers/stageController');
const { protect } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.route('/')
  .post(allowRoles('RH'), createStage)
  .get(allowRoles('RH', 'ENCADRANT'), getStages);

router.route('/:id')
  .put(allowRoles('RH'), updateStage)
  .delete(allowRoles('RH'), deleteStage);

module.exports = router;
