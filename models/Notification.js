const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false, // Optional for notifications not tied to a specific user
  },
  message: { type: String, required: true }, // Notification message
  type: {
    type: String, // Notification category
    enum: ["Booking", "Payment", "General" ,"Resell" , "Transfer" , "General Transaction" ,"Salary","Overdue","Scholarship","Society Creation" ,"Message"], // Add more categories as needed
    default: "General",
  },
  recipientRole: {
    type: String, // Defines who should see this notification
    enum: ["Admin", "Employee", "Customer", "Investor"], // User roles
    required: true,
  },
  isRead: { type: Boolean, default: false }, // Tracks if the notification has been read
  createdAt: { type: Date, default: Date.now }, // Timestamp
});

module.exports = mongoose.model("Notification", notificationSchema);