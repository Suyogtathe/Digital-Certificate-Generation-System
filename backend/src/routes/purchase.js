const express = require("express");
const router = express.Router();
const Purchase = require("../models/Purchase");

/**
 * GET /api/purchase/history/:userId
 * Returns all purchases of a user
 */
router.get("/history/:userId", async (req, res) => {
  try {
    let { userId } = req.params;

    // 🔥 FIX: remove newlines, spaces, tabs (your main issue)
    userId = userId.trim();

    // 🔥 Validate ObjectId format (prevents CastError)
    if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
      return res.status(400).json({
        error: "Invalid userId format",
        details: "Expected a 24-character MongoDB ObjectId."
      });
    }

    // Fetch purchase history
    const history = await Purchase.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, history });
  } catch (err) {
    console.error("purchase history error", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/purchase/details/:purchaseId
 * Fetch individual purchase details
 */
router.get("/details/:purchaseId", async (req, res) => {
  try {
    let { purchaseId } = req.params;
    purchaseId = purchaseId.trim();

    if (!/^[0-9a-fA-F]{24}$/.test(purchaseId)) {
      return res.status(400).json({
        error: "Invalid purchaseId format"
      });
    }

    const purchase = await Purchase.findById(purchaseId).lean();

    if (!purchase) {
      return res.status(404).json({ error: "Purchase not found" });
    }

    return res.json({ success: true, purchase });
  } catch (err) {
    console.error("purchase details error", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
