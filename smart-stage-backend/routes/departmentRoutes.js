const express = require('express');
const {
  createDepartment, getDepartments, updateDepartment, deleteDepartment,
} = require('../controllers/departmentController');
const { protect } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.route('/')
  .post(allowRoles('RH'), createDepartment)
  .get(getDepartments); // tout utilisateur connecté peut lister les départements (formulaires...)

router.route('/:id')
  .put(allowRoles('RH'), updateDepartment)
  .delete(allowRoles('RH'), deleteDepartment);

module.exports = router;
