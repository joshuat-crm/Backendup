const mongoose = require('mongoose');

const scholarshipSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    cnic: { type: String, required: true, unique: true }, // Ensure CNIC is unique
    address: { type: String, required: true },
    amount: { type: Number, default: 0 },
    status: { 
        type: String, 
        enum: ["Pending", "Shortlisted", "Approved", "Rejected"], 
        default: "Pending" 
    },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Scholarship', scholarshipSchema);
