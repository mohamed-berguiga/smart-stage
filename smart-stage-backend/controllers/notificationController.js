const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');

/**
 * GET /api/notifications — notifications de l'utilisateur connecté
 */
const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort('-createdAt');
  res.json(notifications);
});

/**
 * PATCH /api/notifications/:id/read
 */
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!notification) {
    res.status(404);
    throw new Error('Notification introuvable');
  }
  res.json(notification);
});

/**
 * PATCH /api/notifications/read-all
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.json({ message: 'Toutes les notifications ont été marquées comme lues' });
});

module.exports = { getMyNotifications, markAsRead, markAllAsRead };
