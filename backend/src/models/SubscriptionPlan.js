const mongoose = require("mongoose");

const SubscriptionPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // ex: 1 Month, 3 Months
    durationDays: { type: Number, required: true }, // ex: 30, 90, 180, 365
    price: { type: Number, required: true }, // Razorpay amount (₹)
  },
  { timestamps: true }
);

module.exports = mongoose.model("SubscriptionPlan", SubscriptionPlanSchema);
