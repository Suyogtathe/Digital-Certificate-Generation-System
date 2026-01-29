// fixTemplatePaths.js
require("dotenv").config();
const mongoose = require("mongoose");
const Template = require("./src/models/Template");

// your MongoDB URL from .env
const MONGO_URL = process.env.MONGO_URI;

async function start() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("Connected to MongoDB");

    const templates = await Template.find({});
    console.log("Total templates found:", templates.length);

    for (const t of templates) {
      if (!t.bgImageUrl) continue;

      // Already correct? Skip.
      if (t.bgImageUrl.includes("/templates/")) {
        console.log(`Skipping ${t.name} (already correct)`);
        continue;
      }

      // Extract filename
      const filename = t.bgImageUrl.split("/").pop();

      // New correct path
      t.bgImageUrl = `./uploads/templates/${filename}`;

      await t.save();
      console.log(`Updated: ${t.name} -> ${t.bgImageUrl}`);
    }

    console.log("🎉 Done! All paths updated.");
    process.exit();
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

start();
