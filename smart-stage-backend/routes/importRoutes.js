const express = require('express');
const { importStagiaires, getImportBatches, getImportErrors } = require('../controllers/importController');
const { protect } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(protect, allowRoles('RH'));

router.post('/stagiaires', upload.single('file'), importStagiaires);
router.get('/', getImportBatches);
router.get('/:id/errors', getImportErrors);

module.exports = router;
