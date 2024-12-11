const express = require("express");
const { sendMessage, fetchMessages, markMessagesAsRead } = require("../controllers/messageController");
const { verifyJWT, hasRole } = require("../middlewares/authMiddleware");
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });  // Destination directory for uploaded files

const router = express.Router();

// Use middleware for authentication and role-based access
router.use(verifyJWT);
router.use(hasRole("Admin", "Employee")); // Ensure only Admin and Employee can send messages

// Send a new message
// The upload middleware is used here to handle file uploads
router.post('/send', upload.array('attachment', 10), sendMessage);  // `attachment` matches the formData field name

// Get messages between two users
router.get("/:otherUserId", fetchMessages);

// Mark messages as read
router.post("/mark-as-read", markMessagesAsRead);

module.exports = router;
