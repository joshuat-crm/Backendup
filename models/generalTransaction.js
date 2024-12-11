// const mongoose = require('mongoose');

// const transactionSchema = new mongoose.Schema({
//   type: {
//     type: String,
//     enum: ['income', 'expense'],
//     required: true
//   },
//   description: {
//     type: String,
//     required: true
//   },
//   amount: {
//     type: Number,
//     required: true
//   },
//   date: {
//     type: Date,
//     default: Date.now
//   },
//   category: {
//     type: String,
//     required: true
//   },
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User'
//   },
//   username: {
//     type: String,  
//     required: true
//   }
// });

// const Transaction = mongoose.model('Transaction', transactionSchema);
// module.exports = Transaction;
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["income", "expense"],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  category: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  username: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["Admin", "Employee"],
    required: true, // Make this required
  },
  designation: {
    type: String,
    required: function () {
      return this.role === "Employee"; // Only required if role is "Employee"
    },
  },
});

const Transaction = mongoose.model("Transaction", transactionSchema);
module.exports = Transaction;