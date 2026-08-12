const express = require('express');
const {
  login, getMe, forgotPassword, resetPassword, changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.patch('/change-password', protect, changePassword);

module.exports = router;