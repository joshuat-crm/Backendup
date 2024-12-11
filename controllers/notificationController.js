const mongoose = require('mongoose')
const Notification = require('../models/Notification')
const User = require('../models/User')

const notificationController = {
  // Create a new notification
  createNotification: async (req, res) => {
    try {
      const { userId, message, type, recipientRole } = req.body

      // Validate required fields
      if (!message || !recipientRole) {
        return res
          .status(400)
          .json({ error: 'Message and recipientRole are required' })
      }

      // Create and save the notification
      const notification = new Notification({
        userId,
        message,
        type,
        recipientRole
      })

      await notification.save()

      res.status(201).json({
        message: 'Notification created successfully',
        notification
      })
    } catch (error) {
      console.error('Error creating notification:', error.message)
      res.status(500).json({ error: 'Failed to create notification' })
    }
  },

  getUserNotifications: async (req, res) => {
    try {
      const { userId } = req.params;
  
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: 'Invalid userId format' });
      }
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Fetch notifications for the user's specific userId or role-based notifications
      const notifications = await Notification.find({
        $or: [
          { userId: user._id }, // Fetch notifications specifically for the user
          { recipientRole: user.role } // Or role-based notifications
        ]
      })
        .sort({ createdAt: -1 })
        .limit(50);
  
      res.json({ notifications });
    } catch (error) {
      console.error('Error fetching notifications:', error.message);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  }
,  
  getAdminNotifications: async (req, res) => {
    try {
      // Fetch notifications where recipient is "Admin"
      const notifications = await Notification.find({
        recipient: 'Admin'
      }).sort({ createdAt: -1 }) // Sort by createdAt in descending order

      if (!notifications.length) {
        return res.status(404).json({ error: 'No admin notifications found' })
      }

      res.json({ notifications })
    } catch (error) {
      console.error('Error fetching admin notifications:', error)
      res.status(500).json({ error: 'Failed to fetch admin notifications' })
    }
  },

  // Mark a notification as read
  markAsRead: async (req, res) => {
    try {
      const { notificationId } = req.params

      if (!mongoose.Types.ObjectId.isValid(notificationId)) {
        return res.status(400).json({ error: 'Invalid notificationId format' })
      }

      const notification = await Notification.findByIdAndUpdate(
        notificationId,
        { isRead: true },
        { new: true }
      )

      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' })
      }

      res.json({ message: 'Notification marked as read', notification })
    } catch (error) {
      console.error('Error marking notification as read:', error.message)
      res.status(500).json({ error: 'Failed to mark notification as read' })
    }
  },
  // Delete a notification
  deleteNotification: async (req, res) => {
    try {
      const { notificationId } = req.params

      if (!mongoose.Types.ObjectId.isValid(notificationId)) {
        return res.status(400).json({ error: 'Invalid notificationId format' })
      }

      const notification = await Notification.findByIdAndDelete(notificationId)

      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' })
      }

      res.json({ message: 'Notification deleted successfully' })
    } catch (error) {
      console.error('Error deleting notification:', error.message)
      res.status(500).json({ error: 'Failed to delete notification' })
    }
  }
}

module.exports = notificationController
