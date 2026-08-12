const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

/**
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email et mot de passe requis');
  }

  const user = await User.findOne({ email: email.toLowerCase() })
    .select('+password')
    .populate('department', 'name');

  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error('Identifiants incorrects');
  }

  if (!user.status) {
    res.status(403);
    throw new Error('Ce compte a été désactivé. Contactez le RH.');
  }

  const token = generateToken(user._id, user.role);

  res.json({
    token,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      department: user.department
        ? { id: user.department._id, name: user.department.name }
        : null,
    },
  });
});

/**
 * GET /api/auth/me
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('department', 'name');
  res.json(user);
});

/**
 * POST /api/auth/forgot-password
 * Génère un token temporaire (30 min) et envoie un lien de réinitialisation par email.
 * Renvoie toujours le même message, que le compte existe ou non (ne révèle pas
 * quels emails sont enregistrés dans le système).
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400);
    throw new Error('Email requis');
  }

  const genericMessage = { message: 'Si ce compte existe, un email de réinitialisation a été envoyé.' };

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    res.json(genericMessage);
    return;
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:8080'}/reset-password/${rawToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: 'Smart Stage — Réinitialisation de votre mot de passe',
      text: `Bonjour ${user.firstName}, cliquez sur ce lien pour réinitialiser votre mot de passe (valable 30 minutes) : ${resetUrl}`,
      html: `
        <p>Bonjour ${user.firstName},</p>
        <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe (valable 30 minutes) :</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p style="color:#6B7280;font-size:12px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
      `,
    });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    console.error("Erreur lors de l'envoi de l'email de réinitialisation :", err.message);
    res.status(500);
    throw new Error("Erreur lors de l'envoi de l'email. Réessayez plus tard.");
  }

  res.json(genericMessage);
});

/**
 * POST /api/auth/reset-password/:token
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    res.status(400);
    throw new Error('Le mot de passe doit contenir au moins 6 caractères');
  }

  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select('+resetPasswordToken +resetPasswordExpire');

  if (!user) {
    res.status(400);
    throw new Error('Lien de réinitialisation invalide ou expiré');
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.json({ message: 'Mot de passe réinitialisé avec succès' });
});

/**
 * PATCH /api/auth/change-password  (connecté — chaque utilisateur change son propre mot de passe)
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    res.status(400);
    throw new Error('currentPassword et newPassword (min. 6 caractères) sont requis');
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!user || !(await user.comparePassword(currentPassword))) {
    res.status(401);
    throw new Error('Mot de passe actuel incorrect');
  }

  user.password = newPassword;
  await user.save();

  res.json({ message: 'Mot de passe modifié avec succès' });
});

module.exports = { login, getMe, forgotPassword, resetPassword, changePassword };