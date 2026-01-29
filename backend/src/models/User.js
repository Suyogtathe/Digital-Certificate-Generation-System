const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // Core Organization Details
  organizationName: { type: String, required: true },
  email: { type: String, unique: true, required: true, index: true }, // Login Email
  passwordHash: { type: String, required: true },

  // Organization Specifics
  issuerCode: { type: String, unique: true, required: true, uppercase: true }, // Unique ID like 'CDAC', 'IITB'
  verified: { type: Boolean, default: false }, // Only verified orgs can issue
  contactPhone: String,
  signatureUrl: { type: String, default: "" }, // Organization Signature

  // System Role
  role: { type: String, enum: ['organization', 'admin'], default: 'organization' },

  // Logic
  credits: { type: Number, default: 0 }, // For pre-paid bundles if needed later

  // Subscription / Plan (kept for compatibility or future use, but primary model is now pay-per-cert)
  subscription: {
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan' },
    startDate: Date,
    endDate: Date,
    paymentId: String
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
