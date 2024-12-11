const mongoose = require("mongoose");

const investorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    name: { type: String, required: true },
    investmentAmount: { type: Number, required: true }, // Total amount invested
    profitPercentage: { type: Number, required: true, min: 0 }, // Percentage of profit as decided by admin
    societies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Society" }], // Multi-society investments
    investmentDate: { type: Date, default: Date.now }, // Date of investment
    contactInfo: {
      phone: { type: String, required: true },
      email: { type: String, required: true },
      cnic: { type: String, required: true, unique: true },
      address: String,
    },
    unpaidProfit: { type: Number, default: 0 }, // Unpaid profit carried over to next period
    lastSlipGenerated: { type: Date }, // Last date when the profit slip was generated
    created_at: { type: Date, default: Date.now }, // Created date
    updated_at: { type: Date, default: Date.now }, // Updated date
  },
  {
    timestamps: true, // Automatically manage created_at and updated_at fields
  }
);

// Create indexes
investorSchema.index({ user: 1 }, { unique: true }); // Ensure unique user reference

const Investor = mongoose.model("Investor", investorSchema);

module.exports = Investor;
