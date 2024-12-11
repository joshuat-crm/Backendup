const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");

// Route to create a new notification
router.post("/", notificationController.createNotification);

// Route to get notifications for a specific user
router.get("/user/:userId", notificationController.getUserNotifications);

// Route to get admin-specific notifications
router.get("/admin", notificationController.getAdminNotifications);

// Route to mark a specific notification as read
router.patch("/:notificationId/read", notificationController.markAsRead);

// Route to delete a specific notification
router.delete("/:notificationId", notificationController.deleteNotification);

module.exports = router;