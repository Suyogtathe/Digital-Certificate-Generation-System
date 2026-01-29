const express = require("express");
const router = express.Router();

const SubscriptionPlan = require("../models/SubscriptionPlan");

// ----------------------------
// CREATE SUBSCRIPTION PLAN
// ----------------------------
router.post("/create-plan", async (req, res) => {
  try {
    const { name, durationDays, price } = req.body;

    if (!name || !durationDays || !price) {
      return res.status(400).json({ success: false, error: "All fields required" });
    }

    const plan = await SubscriptionPlan.create({
      name,
      durationDays,
      price,
    });

    res.json({ success: true, plan });
  } catch (err) {
    console.error("CREATE PLAN ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------
// GET ALL PLANS
// ----------------------------
router.get("/plans", async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find().sort({ price: 1 });
    res.json({ success: true, plans });
  } catch (err) {
    console.error("GET PLANS ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
