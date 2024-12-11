const mongoose = require("mongoose");

// Helper function to get the next booking number
const getNextBookingNumber = async () => {
    const latestBooking = await Booking.findOne().sort({ booking_number: -1 });
    return latestBooking ? latestBooking.booking_number + 1 : 1; // Start from 1 if no bookings exist
};

const bookingSchema = new mongoose.Schema({
    plot_id: { type: mongoose.Schema.Types.ObjectId, ref: "Plot", required: true },
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    booking_date: { type: Date, default: Date.now },
    total_amount: { type: Number, required: true }, // Total cost of the plot
    initial_payment: { type: Number, default: 0 }, // Upfront payment at booking
    remaining_balance: { type: Number }, // Calculated as booking_amount - initial_payment
    installment_years: { type: Number, default: 0 }, // Years for installment plan
    payment_mode: { type: String, enum: ["Full", "Installment"], required: true },
    booking_status: { type: String, enum: ["Pending", "Confirmed", "Completed","Booked", "Sold","Transfer"], default: "Pending" },
    booking_number: { type: Number, unique: true}, // Add booking_number field
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

// Pre-save hook to calculate remaining balance
bookingSchema.pre("save", async function (next) {
    if (this.isNew) {
        this.booking_number = await getNextBookingNumber(); // Generate booking number
    }

    if (this.payment_mode === "Full") {
        this.remaining_balance = 0; // No remaining balance for full payment
    } else {
        this.remaining_balance = this.total_amount - this.initial_payment; // Calculate remaining balance
    }

    next();
});

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
