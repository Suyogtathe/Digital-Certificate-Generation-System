// backend/updateTemplate_modern_black_gold.js
require("dotenv").config();
const mongoose = require("mongoose");
const Template = require("./src/models/Template");

const NEW_FIELDS = [
  {
    canvas: { w: 1600, h: 1100 },

    title: {
      x: 800, y: 150,
      fontFamily: "Montserrat",
      fontSize: 70,
      fontWeight: "700",
      align: "center",
      color: "#FFFFFF"
    },

    subtitle: {
      x: 800, y: 245,
      fontFamily: "Montserrat",
      fontSize: 40,
      fontWeight: "600",
      align: "center",
      color: "#FFFFFF"
    },

    presentedTo: {
      x: 800, y: 330,
      fontFamily: "Montserrat",
      fontSize: 22,
      fontWeight: "400",
      align: "center",
      color: "#D0A84F"
    },

    recipientName: {
      x: 800, y: 420,
      fontFamily: "Great Vibes",
      fontSize: 100,
      fontWeight: "400",
      align: "center",
      color: "#FFFFFF"
    },

    tagline: {
      x: 800, y: 510,
      fontFamily: "Montserrat",
      fontSize: 28,
      fontWeight: "600",
      align: "center",
      color: "#FFFFFF"
    },

    description: {
      x: 800, y: 580,
      fontFamily: "Poppins",
      fontSize: 20,
      fontWeight: "400",
      align: "center",
      color: "#CCCCCC",
      maxWidth: 1000
    },

    date: {
      x: 800, y: 840,
      fontFamily: "Montserrat",
      fontSize: 20,
      fontWeight: "600",
      align: "center",
      color: "#FFFFFF"
    },

    signatures: [
      {
        x: 350, y: 770,
        width: 240, height: 80,
        label: "HEAD OFFICE"
      },
      {
        x: 1050, y: 770,
        width: 240, height: 80,
        label: "PRODUCTION MANAGER"
      }
    ],

    maxSignatures: 2,

    qr: {
      x: 1400,
      y: 900,
      size: 140
    },

    editableFields: [
      "title",
      "subtitle",
      "presentedTo",
      "recipientName",
      "tagline",
      "description",
      "date"
    ]
  }
];

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const result = await Template.findOneAndUpdate(
      { name: "modern_black_gold" },  
      { $set: { fields: NEW_FIELDS } },
      { new: true, upsert: true }
    );

    console.log("Updated template:");
    console.log(result);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
