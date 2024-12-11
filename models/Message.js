const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      // required: true,
    },
    attachments: [
      {
        type: {
          type: String,
          enum: ["image", "file"],
        },
        url: {
          type: String,
        },
        name: {
          type: String,
        },
      },
    ],
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Automatically includes createdAt and updatedAt
  }
);

module.exports = mongoose.model("Message", messageSchema);