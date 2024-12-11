const mongoose = require("mongoose");

// Society Schema
const societySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  location: { type: String, required: true }, // Made location required
  society_image: { type: String },
  plots: [{ type: mongoose.Schema.Types.ObjectId, ref: "Plot" }], // Store Plot references
  // employees: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
  FinancialTransaction: [
    { type: mongoose.Schema.Types.ObjectId, ref: "FinancialTransaction" },
  ], // Financial records for salary and other expenses
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }, // Track who created the society
  created_at: { type: Date, default: Date.now },
  deleted_at: { type: Date, default: null }, // For soft delete
});

// Index for better query performance
societySchema.index({ name: 1, location: 1 });

const Society = mongoose.model("Society", societySchema);
module.exports = Society;
