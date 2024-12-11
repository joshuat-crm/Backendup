const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['Admin', 'Employee', 'Customer', 'Investor'],
      default: 'Customer'
    },
    societies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Society' }], // Can be empty for Admin
    messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
    profile_picture: { type: String }, // URL or base64 encoded image for user profile
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },
    customerData: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    employeeData: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    investorData: { type: mongoose.Schema.Types.ObjectId, ref: 'Investor' },
    adminData: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    created_at: { type: Date, default: Date.now }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
)

// Create indexes
userSchema.index({ username: 1 }, { unique: true }) // Ensure unique usernames
userSchema.index({ societies: 1 })

const User = mongoose.model('User', userSchema)

module.exports = User
