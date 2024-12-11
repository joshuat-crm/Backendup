const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema({
_id:{type: mongoose.Schema.Types.ObjectId, ref: "User",required: true},
 
  name: { type: String, required: true },
  contactInfo: {
    phone: { type: String, required: true },
    email: { type: String, required: true },
    cnic: { type: String, required: true, unique: true  },
    address: String,
  },
});

const Admin = mongoose.model("Admin", AdminSchema);
module.exports = Admin;
