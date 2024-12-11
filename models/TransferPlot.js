const mongoose = require("mongoose");

const transferPlotSchema = new mongoose.Schema({
  plot_id: { type: mongoose.Schema.Types.ObjectId, ref: "Plot", required: true },
  previous_owner: { type: String, default: "Admin", required: true }, // Always Admin initially
  new_owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  transfer_fee: { type: Number, required: true },
  transfer_date: { type: Date, default: Date.now },
});

transferPlotSchema.index({ plot_id: 1, new_owner_id: 1 }, { unique: true }); // Ensure unique transfer for a plot and new owner

const TransferPlot = mongoose.model("TransferPlot", transferPlotSchema);
module.exports = TransferPlot;
