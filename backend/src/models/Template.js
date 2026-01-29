const mongoose = require("mongoose");

const TemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    description: { type: String, default: "" },

    // Image that user sees when browsing templates
    previewUrl: { type: String, default: "" },

    // Background image used to generate certificate
    bgImageUrl: { type: String, required: true },

    /**
     * Template type:
     * - free     → user can use without paying
     * - premium  → user must pay to unlock
     */
    type: {
      type: String,
      enum: ["free", "premium"],
      default: "free",
    },

    // Price applicable only when type = premium
    price: { type: Number, default: 0 },

    /**
     * fields = array of:
     * { key, x, y, fontSize }
     * Example:
     * [
     *   { key: "name", x: 200, y: 400, fontSize: 24 }
     * ]
     */
    fields: {
      type: Array,
      default: [],
    },

    // QR positioning (optional)
    qr: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      size: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Template", TemplateSchema);
