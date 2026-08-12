const express = require('express');
const {
  createEntry, getEntries, toggleVisa, addComment, getComments,
} = require('../controllers/journalController');
const { protect } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.route('/')
  .post(allowRoles('STAGIAIRE'), createEntry)
  .get(getEntries);

router.patch('/:id/visa', allowRoles('ENCADRANT'), toggleVisa);

router.route('/:id/comments')
  .post(addComment)
  .get(getComments);

module.exports = router;