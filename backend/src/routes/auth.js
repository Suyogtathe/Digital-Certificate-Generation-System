//E:\DigitalCertificateSystem\backend\src\routes\auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require("../middlewares/auth");
const multer = require('multer');
const fs = require('fs');
const path = require('path');


const ValidOrganization = require('../models/ValidOrganization');

// ----------------------------
// REGISTER (ORGANIZATION ONLY)
// ----------------------------
router.post('/register', async (req, res) => {
  let { organizationName, issuerCode, email, password } = req.body;

  try {
    // 0. Sanitize
    issuerCode = issuerCode ? issuerCode.trim() : "";

    console.log(`[Register Attempt] Code: '${issuerCode}', Email: '${email}'`);

    // 1. WHITELIST CHECK 🔐 (Case Insensitive)
    // RegExp with 'i' flag ensures "sun-pune" matches "SUN-PUNE"
    const isValidOrg = await ValidOrganization.findOne({
      issuerCode: { $regex: new RegExp(`^${issuerCode}$`, 'i') }
    });

    if (!isValidOrg) {
      console.warn(`[Register Failed] Invalid Code: ${issuerCode}`);
      return res.status(403).json({ message: "Invalid Issuer Code. Please contact admin to whitelist your organization." });
    }
    // Optional: strictly match name too? For now, code is enough key.

    const existing = await User.findOne({
      $or: [{ email }, { issuerCode }]
    });

    if (existing) {
      if (existing.email === email) return res.status(400).json({ message: 'Email already exists' });
      if (existing.issuerCode === issuerCode) return res.status(400).json({ message: 'Issuer Code already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const u = await User.create({
      organizationName,
      issuerCode,
      email,
      passwordHash,
      role: 'organization',
      verified: false // Require admin approval or email verification implementation later? For now default false or true depending on reqs. User said "Verified flag". let's keep false.
    });

    res.json({
      message: 'Organization registered successfully',
      user: { id: u._id, email: u.email, organizationName: u.organizationName, issuerCode: u.issuerCode }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// ----------------------------
// LOGIN
// ----------------------------
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // get user
  const u = await User.findOne({ email });
  if (!u) return res.status(400).json({ message: 'Invalid Credentials' });

  // STRICTLY ENFORCE ROLE
  if (u.role !== 'organization' && u.role !== 'admin') {
    return res.status(403).json({ message: 'Access Denied: Not an Organization account' });
  }

  // SUPPORT BOTH passwordHash AND password (old DB compatibility if needed, but we are shifting)
  const hashedPassword = u.passwordHash || u.password;

  if (!hashedPassword) {
    return res.status(500).json({ error: "Account error. Please contact support." });
  }

  const ok = await bcrypt.compare(password, hashedPassword);
  if (!ok) return res.status(400).json({ message: 'Invalid Credentials' });

  // JWT
  const token = jwt.sign(
    { id: u._id, role: u.role, organizationName: u.organizationName },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.json({
    token,
    user: {
      _id: u._id,
      email: u.email,
      organizationName: u.organizationName,
      issuerCode: u.issuerCode,
      role: u.role,
      verified: u.verified
    }
  });
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
    //.lean();

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

// ----------------------------
// SIGNATURE UPLOAD
// ----------------------------
const signatureStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/signatures');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.id}_${Date.now()}${ext}`);
  }
});

const uploadSig = multer({
  storage: signatureStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  }
});

router.post('/upload-signature', authMiddleware, (req, res) => {
  uploadSig.single('signature')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: "File too large. Max 2MB." });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    try {
      const signatureUrl = `/uploads/signatures/${req.file.filename}`;
      await User.findByIdAndUpdate(req.user.id, { signatureUrl });
      res.json({ success: true, signatureUrl });
    } catch (dbErr) {
      res.status(500).json({ message: "Database error" });
    }
  });
});


module.exports = router;
