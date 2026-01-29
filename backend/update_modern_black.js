require("dotenv").config();
const mongoose = require("mongoose");
const Template = require("./src/models/Template");

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const templateId = "69331c9ec05d1b8f5d8532a2";

    // your correct background image path
    const correctPath = "./uploads/templates/1765003242522-816568613.png";

    const result = await Template.findByIdAndUpdate(
      templateId,
      { $set: { bgImageUrl: correctPath } },
      { new: true }
    );

    console.log("Successfully updated template:");
    console.log(result);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
