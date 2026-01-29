const crypto = require("crypto");
const Purchase = require("../models/Purchase");
const User = require("../models/User");
const Template = require("../models/Template");
const Certificate = require("../models/Certificate");
const SubscriptionPlan = require("../models/SubscriptionPlan");

const { generateCertificatePdf } = require("../services/pdfService");
const { sendCertificateEmail } = require("../services/emailService");
const path = require("path");
const fs = require("fs");

exports.handler = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    const expected = crypto
      .createHmac("sha256", secret)
      .update(req.rawBody)
      .digest("hex");

    if (expected !== signature) {
      return res.status(400).send("invalid signature");
    }

    const payload = req.body;
    const event = payload.event;

    if (
      event !== "payment.captured" &&
      event !== "order.paid" &&
      event !== "payment.authorized"
    ) {
      return res.status(200).send("ignored");
    }

    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;

    const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
    const razorpayPaymentId = paymentEntity?.id;

    if (!razorpayOrderId) {
      return res.status(400).send("no order id");
    }

    // --------------------------------------------------
    // FETCH PURCHASE (KEEP EARLIER PLACEMENT ✅)
    // --------------------------------------------------
    const purchase = await Purchase.findOne({ razorpayOrderId });
    if (!purchase) {
      return res.status(200).send("ok");
    }

    if (purchase.used === true) {
      console.warn("Payment already consumed:", purchase._id);
      return res.status(200).send("already used");
    }

    // Mark payment success
    purchase.paymentId = razorpayPaymentId;
    purchase.status = "success";
    await purchase.save();

    // --------------------------------------------------
    // SUBSCRIPTION PURCHASE (eligibility only)
    // --------------------------------------------------
    if (purchase.purchaseType === "subscription") {
      const user = await User.findById(purchase.userId);
      const plan = await SubscriptionPlan.findById(purchase.planId);

      if (user && plan) {
        const now = new Date();
        user.subscription = {
          planId: plan._id,
          startDate: now,
          endDate: new Date(now.getTime() + plan.durationDays * 86400000),
          paymentId: purchase.paymentId
        };
        user.role = "admin";
        await user.save();
      }

      return res.status(200).send("ok");
    }

    // --------------------------------------------------
    // TEMPLATE / CERTIFICATE PURCHASE (ONE PAY = ONE USE)
    // --------------------------------------------------
    if (
      purchase.purchaseType === "certificate" ||
      purchase.purchaseType === "template"
    ) {
      let meta = {};
      try {
        meta = typeof purchase.metadata === "string"
          ? JSON.parse(purchase.metadata)
          : purchase.metadata || {};
      } catch {}

      const studentData = meta.studentData || meta;
      // Just mark payment as successful
purchase.status = "success";
await purchase.save();

      return res.status(200).send("ok");
    }

    return res.status(200).send("ok");
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).send("server error");
  }
};
