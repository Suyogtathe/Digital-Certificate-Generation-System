const mongoose = require('mongoose');

const ValidOrganizationSchema = new mongoose.Schema({
    organizationName: { type: String, required: true },
    issuerCode: { type: String, required: true, unique: true },
    emailDomain: { type: String }, // Optional: constrain by email domain? User asked for Unique Code check basically.
    preVerified: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('ValidOrganization', ValidOrganizationSchema);
