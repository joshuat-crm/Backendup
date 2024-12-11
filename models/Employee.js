const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  societies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Society" }], // Multi-society membership
  name: { type: String, required: true },
  designation: { type: String, required: true }, // Ensure designation is always provided
  personalDetails: {
    phone: { type: String, required: true },
    address: String,
    dateOfJoining: { type: Date, required: true },
    cnic: { type: String, required: true, unique: true },
  },
  salaryDetails: {
    salary: { type: Number, required: true }, // Basic salary
    allowances: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    bonuses: { type: Number, default: 0 },
    lastPaidDate: { type: Date },
    salarySlip: { type: String },
  },
  paymentHistory: [
    {
      date: { type: Date, default: Date.now },
      netSalary: Number,
      slipUrl: String,
    },
  ],
});

const Employee = mongoose.model("Employee", EmployeeSchema);

module.exports = Employee;
