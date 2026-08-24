const Notification = require('../models/Notification');
const User = require('../models/User');
const sendEmail = require('./sendEmail');
const { emitToUser } = require('./socket');

/**
 * Crée une notification in-app, la pousse en TEMPS RÉEL via Socket.io au
 * navigateur ouvert (si connecté), et envoie un email correspondant.
 * Utilisé par tous les contrôleurs existants (tasks, comments, attestations,
 * skills...) sans qu'ils aient besoin d'être modifiés individuellement.
 */
async function notify(userId, message, type) {
  const notification = await Notification.create({ user: userId, message, type });

  // Temps réel : pousse immédiatement au navigateur, sans attendre le
  // prochain rafraîchissement automatique (polling) de secours.
  try {
    emitToUser(userId.toString(), 'notification:new', notification);
  } catch (err) {
    console.error('Erreur lors de la diffusion Socket.io :', err.message);
  }

  try {
    const user = await User.findById(userId).select('email firstName');
    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: 'Smart Stage — Nouvelle notification',
        text: message,
        html: `
          <p>Bonjour ${user.firstName},</p>
          <p>${message}</p>
          <p style="color:#6B7280;font-size:12px;">Connectez-vous à Smart Stage pour plus de détails.</p>
        `,
      });
    }
  } catch (err) {
    console.error("Erreur lors de l'envoi de l'email de notification :", err.message);
  }

  return notification;
}

module.exports = notify;