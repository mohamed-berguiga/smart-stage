const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

/**
 * Vérifie le token JWT envoyé dans le header "Authorization: Bearer <token>".
 * Si valide, attache l'utilisateur connecté à req.user (sans le mot de passe).
 * C'est l'étape "Vérifier le rôle (RBAC)" de votre diagramme de cas d'utilisation,
 * combinée à la vérification d'identité.
 */
const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401);
    throw new Error('Non autorisé : token manquant');
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    res.status(401);
    throw new Error('Non autorisé : token invalide ou expiré');
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    res.status(401);
    throw new Error('Non autorisé : utilisateur introuvable');
  }
  if (!user.status) {
    res.status(403);
    throw new Error('Compte désactivé');
  }

  req.user = user; // dispo dans tous les contrôleurs suivants
  next();
});

module.exports = { protect };
