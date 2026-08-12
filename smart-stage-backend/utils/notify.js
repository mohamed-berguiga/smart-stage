const Notification = require('../models/Notification');
const User = require('../models/User');
const sendEmail = require('./sendEmail');

/**
 * Crée une notification in-app ET envoie un email correspondant.
 * Utilisé par tous les contrôleurs existants (tasks, comments, attestations,
 * skills...) sans qu'ils aient besoin d'être modifiés individuellement.
 */
async function notify(userId, message, type) {
  const notification = await Notification.create({ user: userId, message, type });

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
    // Une erreur d'envoi d'email ne doit jamais faire échouer l'action
    // principale (création de tâche, etc.) — on logue simplement.
    console.error("Erreur lors de l'envoi de l'email de notification :", err.message);
  }

  return notification;
}

module.exports = notify;