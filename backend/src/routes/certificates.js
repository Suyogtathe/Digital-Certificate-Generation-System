// backend/src/routes/certificates.js

const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const Template = require('../models/Template');
const Certificate = require('../models/Certificate');
const Purchase = require('../models/Purchase');
const { generateCertificatePdf } = require('../services/pdfService');
const path = require('path');
const fs = require('fs');
const { sendCertificateEmail } = require('../services/emailService');
const multer = require('multer');

// -----------------------------
// Directories
// -----------------------------
const UPLOADS_ROOT = path.join(__dirname, '..', '..', process.env.FILE_STORAGE_PATH || 'uploads');
const CERT_DIR = path.join(UPLOADS_ROOT, 'certificates');

if (!fs.existsSync(CERT_DIR)) fs.mkdirSync(CERT_DIR, { recursive: true });

// -----------------------------
// ORIGINAL GENERATE (UNCHANGED)
// -----------------------------
router.post('/generate', auth, async (req, res) => {
  try {
    const { templateId, studentData } = req.body;

    const template = await Template.findById(templateId);
    if (!template) return res.status(404).json({ message: 'Template not found' });

    const certId = 'CERT-' + Date.now().toString(36);
    const filename = `${certId}.pdf`;
    const outPath = path.join(CERT_DIR, filename);
    const qrUrl = `${process.env.FRONTEND_URL}/verify/${certId}`;

    await generateCertificatePdf(template, studentData, outPath, certId, qrUrl);

    const cert = await Certificate.create({
      certificateId: certId,
      userId: req.user.id,
      templateId,
      pdfUrl: `${process.env.FILE_STORAGE_PATH || 'uploads'}/certificates/${filename}`,
      qrCodeData: qrUrl,
      generatedAt: new Date()
    });

    if (studentData?.email) {
      try {
        await sendCertificateEmail(
          studentData.email,
          'Your Certificate',
          'Please find attached',
          [{ filename, path: outPath }]
        );
      } catch (e) {
        console.warn('Email failed:', e.message);
      }
    }

    res.json({ success: true, certificate: cert });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* ======================================================================
   🔥🔥🔥 ONLY FIXED ROUTE BELOW 🔥🔥🔥
   NOTHING ELSE IS TOUCHED
   ====================================================================== */

router.post('/generate-by-purchase', async (req, res) => {
  try {
    const { purchaseId, studentDataOverride } = req.body;
    if (!purchaseId) {
      return res.status(400).json({ success: false, error: 'purchaseId required' });
    }

    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) {
      return res.status(404).json({ success: false, error: 'Purchase not found' });
    }

    // 🔴 ADD THESE 2 LINES HERE (EXACT PLACE)
    console.log("PURCHASE STATUS:", purchase.status);
    console.log("PURCHASE USED:", purchase.used);


    // 🔧 FIX 1: Must be successful
    if (purchase.status !== 'success') {
      return res.status(400).json({ success: false, error: 'Payment not completed' });
    }

    // 🔧 FIX 2: One-time usage enforcement
    if (purchase.used === true) {
      return res.status(400).json({ success: false, error: 'Purchase already used' });
    }

    console.log("Looking for Template ID:", purchase.templateId);
    const template = await Template.findById(purchase.templateId);
    if (!template) {
      console.error("Template lookup failed for ID:", purchase.templateId);
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    // 🔧 FIX 3: Safe metadata handling
    let studentData = purchase.metadata || {};
    if (typeof studentData === 'string') {
      try { studentData = JSON.parse(studentData); } catch { }
    }

    if (studentDataOverride && typeof studentDataOverride === 'object') {
      studentData = { ...studentData, ...studentDataOverride };
    }

    // ENRICH DATA FOR LAYOUT ENGINE
    // We need to fetch the Organization User to get the Signature and Name
    const orgUser = await require('../models/User').findById(purchase.userId);

    // Construct the standardized PDF data object
    const pdfData = {
      certificateTitle: studentData.certificateTitle || null, // Fix: Pass Dynamic Title
      recipientName: studentData.recipientName || "Student Name",
      courseName: studentData.courseName || "Course Name",
      description: studentData.description || "",
      issueDate: studentData.date || new Date().toISOString().split('T')[0],
      organizationName: orgUser ? orgUser.organizationName : "Organization",
      signatureUrl: orgUser ? orgUser.signatureUrl : null,
      // Optional fields if standard layout supports them
      presentedTo: "This certificate is proudly presented to",
      forCompletion: "For successfully completing the course"
    };

    const certId = 'CERT-' + Date.now().toString(36);
    const filename = `${certId}.pdf`;
    const outPath = path.join(CERT_DIR, filename);
    const qrUrl = `${process.env.FRONTEND_URL}/verify/${certId}`;

    await generateCertificatePdf(template, pdfData, outPath, certId, qrUrl);

    const cert = await Certificate.create({
      certificateId: certId,
      userId: purchase.userId || null,
      templateId: purchase.templateId,
      pdfUrl: `${process.env.FILE_STORAGE_PATH || 'uploads'}/certificates/${filename}`,
      qrCodeData: qrUrl,
      paymentId: purchase.paymentId || null,
      generatedAt: new Date(),
      studentName: pdfData.recipientName,
      courseName: pdfData.courseName,
      issueDate: pdfData.issueDate
    });

    // 🔧 FIX 4: Mark purchase as used (CRITICAL)
    purchase.used = true;
    await purchase.save();

    // 🔧 FIX 5: Email must NOT crash flow
    if (studentData?.email) {
      try {
        await sendCertificateEmail(
          studentData.email,
          'Your Certificate',
          'Please find attached',
          [{ filename, path: outPath }]
        );
      } catch (e) {
        console.warn('Email failed:', e.message);
      }
    }

    return res.json({
      success: true,
      certificate: cert
    });

  } catch (err) {
    console.error('generate-by-purchase error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/* ======================================================================
   🔥🔥🔥 END OF FIX 🔥🔥🔥
   ====================================================================== */

// -----------------------------
// VERIFY CERTIFICATE
// -----------------------------
router.get('/verify/:certificateId', async (req, res) => {
  try {
    const cert = await Certificate.findOne({ certificateId: req.params.certificateId })
      .populate('userId', 'organizationName issuerCode verified') // Get Org details
      .lean();

    if (!cert) return res.status(404).json({ valid: false, message: "Certificate Not Found" });

    // Construct public data
    const publicData = {
      certificateId: cert.certificateId,
      studentName: cert.studentName,
      courseName: cert.courseName,
      issueDate: cert.issueDate || cert.generatedAt,
      organization: cert.userId, // Contains name, code, verified
      valid: true
    };

    res.json({ valid: true, cert: publicData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ valid: false, error: err.message });
  }
});

// -----------------------------
// MY CERTIFICATES
// -----------------------------
router.get('/my', auth, async (req, res) => {
  const list = await Certificate.find({ userId: req.user.id }).sort({ generatedAt: -1 });
  res.json({ success: true, list });
});

// -----------------------------
// DOWNLOAD CERTIFICATE
// -----------------------------
router.get('/download/:certificateId', auth, async (req, res) => {
  const cert = await Certificate.findOne({ certificateId: req.params.certificateId });
  if (!cert) return res.status(404).send('Not found');

  const filePath = path.join(__dirname, '..', '..', cert.pdfUrl);
  if (!fs.existsSync(filePath)) return res.status(404).send('Missing');

  res.download(filePath);
});

module.exports = router;
