// backend/src/routes/templates.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Template = require("../models/Template");
const User = require("../models/User");

// -------------------------
// STORAGE FOLDER
// -------------------------
const uploadDir = path.join(
  __dirname,
  "..",
  "..",
  process.env.FILE_STORAGE_PATH || "uploads"
);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, name);
  },
});

const upload = multer({ storage });

// -------------------------
// GET ALL TEMPLATES (ADMIN / PUBLIC)
// -------------------------
router.get("/", async (req, res) => {
  try {
    const templates = await Template.find();
    res.json({ success: true, templates });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------
// CREATE TEMPLATE (ADMIN)
// -------------------------
router.post("/", upload.single("bgImage"), async (req, res) => {
  try {
    const { name, description, type, price, fields, qr } = req.body;

    const bgImageUrl = req.file
      ? `${process.env.FILE_STORAGE_PATH || "uploads"}/${req.file.filename}`
      : "";

    const template = await Template.create({
      name,
      description,
      type,
      price: Number(price) || 0,
      fields: fields ? JSON.parse(fields) : [],
      qr: qr ? JSON.parse(qr) : {},
      bgImageUrl,
    });

    res.json({ success: true, template });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------
// USER ACCESSIBLE TEMPLATES (IMPORTANT)
// -------------------------
router.get("/user/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    const templates = await Template.find();

    const purchasedTemplates =
      user?.purchasedTemplates?.map((id) => id.toString()) || [];

    const response = templates.map((tpl) => {
      const isPremium = tpl.type === "premium";
      const isPurchased = purchasedTemplates.includes(tpl._id.toString());

      return {
        ...tpl.toObject(),
        isPremium,
        isPurchased,
        isLocked: isPremium && !isPurchased,
      };
    });

    res.json({ success: true, templates: response });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
