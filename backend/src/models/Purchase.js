const mongoose = require("mongoose");

const PurchaseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Template"
    },

    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan"
    },

    razorpayOrderId: {
      type: String,
      required: true
    },

    paymentId: {
      type: String
    },

    amount: {
      type: Number,
      required: true
    },

    purchaseType: {
      type: String,
      enum: ["template", "certificate", "subscription", "bulk_certificate"],
      required: true
    },

    status: {
      type: String,
      enum: ["created", "success", "failed"],
      default: "created"
    },

    // 🔐 CRITICAL: one payment = one usage
    used: {
      type: Boolean,
      default: false
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Purchase", PurchaseSchema);
