const mongoose = require("mongoose");

const plotSchema = new mongoose.Schema(
  {
    society_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Society",
      required: true,
    },
    plot_number: {
      type: String,
      required: true,
    },
    plot_type: {
      type: String,
      enum: ["Residential", "Commercial"],
      required: true,
    },
    block: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      enum: ["General", "Park Face", "Corner", "Boulevard"],
      required: true,
    },
    booking_status: {
      type: String,
      enum: ["Available", "Booked", "Hold", "Transfer"],
      default: "Available",
    },
    // payment_mode: {
    //   type: String,
    //   enum: ["Full", "Installment"],
    //   default: "Full"
    // },
    installments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Installment",
      },
    ],
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    price: {
      type: Number,
    },
    sale_history: [
      {
        booking_id: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
        customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
        sale_date: { type: Date },
        sale_amount: { type: Number },
      },
    ],
    available_from: { type: Date },
    status: {
      type: String,
      enum: ["Available", "Reserved", "Sold", "Transfer"],
      default: "Available",
    },
    deleted_at: { type: Date, default: null }, // Soft delete field
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Compound unique index to ensure plot_number is unique within each society
plotSchema.index({ society_id: 1, plot_number: 1 }, { unique: true });

const Plot = mongoose.model("Plot", plotSchema);
module.exports = Plot;
