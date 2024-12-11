const mongoose = require("mongoose");

const agreementSchema = new mongoose.Schema(
  {
    plotNumber: { type: String, required: true },
    date: { type: Date, required: true },
    buyer: {
      name: { type: String, required: true },
      fatherName: { type: String, required: true },
      mobileNumber: { type: String, required: true },
      permanentAddress: { type: String, required: true },
      cnicNumber: { type: String, required: true },
    },
    nominee: {
      name: { type: String, required: true },
      relation: { type: String, required: true },
    },
    plot: { type: mongoose.Schema.Types.ObjectId, ref: "Plot", required: true },
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Society",
      required: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    termsAccepted: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

const Agreement = mongoose.model("Agreement", agreementSchema);
module.exports = Agreement;
