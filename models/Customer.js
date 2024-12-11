const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema({
  // user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
_id:{type: mongoose.Schema.Types.ObjectId, ref: "User",required: true},
  societies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Society" }], // Multi-society membership
  name: { type: String, required: true },
  contactInfo: {
    phone: { type: String, required: true },
    email: { type: String, required: true },
    cnic: { type: String, required: true , unique: true },
    address: String,
  },
  plots: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Plot' }], // Plots customer has purchased/booked
  payments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Installment" }], // All payments made (installments)
 
});

const customer = mongoose.model("Customer", CustomerSchema);
module.exports = customer;
