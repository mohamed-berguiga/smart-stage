const express = require('express');
const { generateAttestation, getAttestationsByStagiaire } = require('../controllers/attestationController');
const { protect } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.post('/:stagiaireId', allowRoles('RH'), generateAttestation);
router.get('/:stagiaireId', getAttestationsByStagiaire);

module.exports = router;
