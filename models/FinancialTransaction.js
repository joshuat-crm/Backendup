const mongoose = require('mongoose');

const financialTransactionSchema = new mongoose.Schema({
    societies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Society" }], // Multi-society membership
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    plot_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Plot' },
    booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    transaction_date: { type: Date, default: Date.now },
    amount: { type: Number, required: true },
    transaction_type: {
        type: String,
        required: true,
        validate: {
            validator: function(value) {
                const predefinedTypes = [
                    'Full Payment',
                    'Partial Payment',
                    'Installment Payment',
                    'Salary Payment',
                    'Expense Payment',
                    'Resell Payment',
                    'Scholarship',
                    'other',
                ];
                // Allow predefined types or any custom string value
                return predefinedTypes.includes(value) || typeof value === 'string';
            },
            message: props => `${props.value} is not a valid transaction type.`,
        },
    },
    
    
    transaction_direction: { // New field to indicate income or expense
        type: String,
        enum: ['Income', 'Expense'], // Possible values
        required: true
    },
    payment_method: { type: String, default: 'Bank Transfer' },
    status: { type: String, default: 'Completed' },
    description: { type: String }, // Optional field for transaction description
});

module.exports = mongoose.model('FinancialTransaction', financialTransactionSchema);
