const express = require('express');
const {
  createUser, getUsers, getMyStagiaires, getUserById, updateUser, toggleUserStatus, deleteUser,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect); // toutes les routes users nécessitent d'être connecté

router.get('/my-stagiaires', allowRoles('ENCADRANT'), getMyStagiaires);

router.route('/')
  .post(allowRoles('RH'), createUser)
  .get(allowRoles('RH'), getUsers);

router.route('/:id')
  .get(allowRoles('RH', 'ENCADRANT'), getUserById)
  .put(allowRoles('RH'), updateUser)
  .delete(allowRoles('RH'), deleteUser);

router.patch('/:id/status', allowRoles('RH'), toggleUserStatus);

module.exports = router;
