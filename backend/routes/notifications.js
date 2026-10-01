const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { listNotifications, createNotification, markRead, getAllNotifications, deleteNotification, markNotificationRead } = require('../controllers/notificationController');

// User routes
router.get('/', authMiddleware, listNotifications);
router.post('/', authMiddleware, createNotification);
router.put('/:id/read', authMiddleware, markRead);

// Admin routes - get all notifications across all users
router.get('/all', authMiddleware, adminMiddleware, getAllNotifications);
// Admin - delete a notification
router.delete('/:id', authMiddleware, adminMiddleware, deleteNotification);
// Admin - mark notification as read
router.patch('/:id/read', authMiddleware, adminMiddleware, markNotificationRead);
// Admin - mark all as read
router.post('/mark-all-read', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const adapter = require('../models/adapter');
    // Get all unread notifications
    const allNotifs = await adapter.Notification.find({ read: false });
    // Mark each as read
    for (const notif of allNotifs) {
      await adapter.Notification.findByIdAndUpdate(notif._id || notif.id, { read: true });
    }
    res.json({ success: true, updated: allNotifs.length });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
