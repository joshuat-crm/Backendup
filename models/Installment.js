const mongoose = require('mongoose');

const installmentSchema = new mongoose.Schema({
    booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    plot_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Plot', required: true },
    due_date: { type: Date, required: true },
    amount: { type: Number, required: true },
    receipt_no: { type: String},
    installment_number: { type: Number, required: true },
    status: { type: String, enum: ['Pending', 'Completed', 'Partially Paid' ,'Overdue'], default: 'Pending' },
    paid_amount: { type: Number, default: 0 },
    remaining_amount: { type: Number, default: 0 },
    payment_date: { type: Date },
});

const Installment = mongoose.model('Installment', installmentSchema);

module.exports = Installment;
