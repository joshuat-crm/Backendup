const Message = require("../models/Message");
const User = require("../models/User");
const Notification = require("../models/Notification"); // Import Notification model
const mongoose = require("mongoose");

// Send a message (only Admin and Employee roles)
const sendMessage = async (req, res) => {
  try {
    const senderId = req.user._id; // Extract senderId from logged-in user
    const { receiverId, content } = req.body; // Extract from body (FormData)

    // Log received data for debugging
    // console.log('Received body data:', req.body)
    // console.log('Received files:', req.files)

    // Check if receiverId and content exist
    // if (!receiverId || !content) {
    //   return res
    //     .status(400)
    //     .json({ success: false, message: 'Receiver and content are required.' })
    // }

    // Ensure the receiver is valid
    const receiver = await User.findById(receiverId);
    if (
      !receiver ||
      (receiver.role !== "Admin" && receiver.role !== "Employee")
    ) {
      return res.status(403).json({
        success: false,
        message: "Receiver must be an Admin or Employee.",
      });
    }

    const sender = await User.findById(senderId);
    if (!sender) {
      return res
        .status(404)
        .json({ success: false, message: "Sender not found." });
    }

    // Process attachments if they exist
    const attachments = req.files || []; // Attachments are in req.files from multer
    const attachmentDetails =
      attachments.length > 0
        ? attachments.map((file) => ({
            type: file.mimetype.includes("image") ? "image" : "file",
            url: file.path,
            name: file.originalname,
          }))
        : [];

    // Create the message with content and attachments
    const newMessage = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content,
      attachments: attachmentDetails,
    });

    // Update the sender's and receiver's messages array
    await User.findByIdAndUpdate(senderId, {
      $push: { messages: newMessage._id },
    });
    await User.findByIdAndUpdate(receiverId, {
      $push: { messages: newMessage._id },
    });

    // Create a notification for the receiver
    const notification = await Notification.create({
      userId: receiverId,
      message: `You have received a new message from ${sender.username}`,
      type: "Message",
      recipientRole: receiver.role,
    });

    // Respond with the message and notification data
    res.status(201).json({
      success: true,
      message: newMessage,
      notification: notification,
    });
  } catch (error) {
    console.error("Error sending message:", error.message);
    console.error("Error stack trace:", error.stack); // Include stack trace for better debugging
    res.status(500).json({
      success: false,
      message: "Server error. Could not send the message.",
      error: error.message, // Optionally include the error message for more context
    });
  }
};

// Fetch messages between two users
const fetchMessages = async (req, res) => {
  try {
    const userId = req.user._id; // Current logged-in user
    const { otherUserId } = req.params; // The other user to fetch messages with

    // Validate that otherUserId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    // Ensure the other user is either Admin or Employee
    const otherUser = await User.findById(otherUserId);
    if (
      !otherUser ||
      (otherUser.role !== "Admin" && otherUser.role !== "Employee")
    ) {
      return res.status(403).json({
        success: false,
        message: "User must be an Admin or Employee.",
      });
    }

    // Fetch messages between the two users
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId },
      ],
    })
      .populate("sender", "username role profile_picture")
      .populate("receiver", "username role profile_picture")
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Could not fetch messages.",
    });
  }
};

// Mark messages as read
const markMessagesAsRead = async (req, res) => {
  try {
    const { otherUserId } = req.body; // otherUserId should come from the request body
    const userId = req.user._id; // Current logged-in user

    // console.log('Received otherUserId:', otherUserId) // Log request for debugging

    // Check if the otherUserId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID. Please provide a valid ObjectId.",
      });
    }

    // Update all messages sent to the current user by the other user to "read"
    await Message.updateMany(
      { sender: otherUserId, receiver: userId, isRead: false },
      { $set: { isRead: true } }
    );

    res
      .status(200)
      .json({ success: true, message: "Messages marked as read." });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Could not mark messages.",
    });
  }
};

module.exports = {
  sendMessage,
  fetchMessages,
  markMessagesAsRead,
};
