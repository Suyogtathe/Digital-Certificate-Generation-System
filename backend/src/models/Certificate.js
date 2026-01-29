const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema({
  certificateId: { type: String, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Template' },
  pdfUrl: String,
  qrCodeData: String,
  paymentId: String,
  generatedAt: Date,

  // Student Details (Stored for Verification)
  studentName: { type: String, required: true },
  courseName: { type: String, required: true },
  issueDate: { type: String }, // Can be Date or String depending on CSV format
}, { timestamps: true });

module.exports = mongoose.model('Certificate', CertificateSchema);
