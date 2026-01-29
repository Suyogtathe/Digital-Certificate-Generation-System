// backend/src/routes/payments.js
const express = require("express");
const Razorpay = require("razorpay");
const router = express.Router();

const Purchase = require("../models/Purchase");

// Razorpay instance
const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ----------------------------
// MIDDLEWARE
// ----------------------------
const authMiddleware = require("../middlewares/auth");

// --------------------------------------------------
// CREATE ORDER (FREE + PAID CERTIFICATE)
// --------------------------------------------------
router.post("/create-order", authMiddleware, async (req, res) => {
  try {
    const { purchaseType, quantity = 1, templateId, studentData } = req.body;
    const user = req.user; // Auth middleware adds this

    if (!purchaseType) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let amount = 0;

    // 💰 PRICING LOGIC
    if (purchaseType === 'bulk_certificate') {
      const PRICE_PER_CERT = 50;
      amount = quantity * PRICE_PER_CERT; // e.g. 50 * 100 = 5000
    }
    else if (purchaseType === 'certificate') {
      amount = 50; // Single
    }
    else {
      return res.status(400).json({ message: "Invalid Purchase Type" });
    }

    // -------------------------
    // RAZORPAY ORDER
    // -------------------------
    const order = await instance.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: "INR",
      receipt: "rcpt_" + Date.now().toString().slice(-10),
      notes: {
        purchaseType,
        userId: user.id || "unknown", // Fallback if middleware fails but it shouldn't
        quantity: quantity
      },
    });

    const purchase = await Purchase.create({
      userId: user.id,
      amount,
      purchaseType,
      status: "created",
      razorpayOrderId: order.id,
      templateId: templateId || null, // SAVE TEMPLATE ID
      metadata: { quantity, ...studentData } // SAVE STUDENT DATA
    });

    res.json({
      success: true,
      order,
      purchaseId: purchase._id,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error("CREATE ORDER ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --------------------------------------------------
// CONFIRM TEMPLATE PAYMENT (CALLED AFTER RAZORPAY)
// --------------------------------------------------
router.post("/confirm-template", async (req, res) => {
  try {
    const { userId, templateId } = req.body;

    if (!userId || !templateId) {
      return res.status(400).json({ message: "Missing data" });
    }

    // add template to user
    await require("../models/User").findByIdAndUpdate(
      userId,
      { $addToSet: { purchasedTemplates: templateId } }
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("CONFIRM TEMPLATE ERROR:", err);
    res.status(500).json({ success: false });
  }
});
// 🔥 MARK PURCHASE SUCCESS
router.post("/mark-success", async (req, res) => {
  try {
    const { purchaseId, paymentId } = req.body;

    if (!purchaseId) {
      return res.status(400).json({ success: false, error: "purchaseId required" });
    }

    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) {
      return res.status(404).json({ success: false, error: "Purchase not found" });
    }

    purchase.status = "success";
    purchase.paymentId = paymentId || null;
    await purchase.save();

    return res.json({ success: true });
  } catch (err) {
    console.error("mark-success error", err);
    res.status(500).json({ success: false, error: err.message });
  }
});



module.exports = router;
