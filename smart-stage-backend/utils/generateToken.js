const jwt = require('jsonwebtoken');

/**
 * Génère un token JWT signé contenant l'id et le rôle de l'utilisateur.
 * @param {string} userId
 * @param {string} role
 */
function generateToken(userId, role) {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

module.exports = generateToken;
