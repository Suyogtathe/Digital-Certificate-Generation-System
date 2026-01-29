require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Organization = require("../models/Organization");
const User = require("../models/User");

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  let org = await Organization.findOne({ issuerCode: "CDAC-INDIA" });
  if (!org) {
    org = await Organization.create({
      name: "CDAC India",
      issuerCode: "CDAC-INDIA",
      type: "Institute",
      verified: true,
      contactEmail: "admin@cdac.in"
    });
  }

  let admin = await User.findOne({ email: "admin@cdac.in" });
  if (!admin) {
    admin = await User.create({
      name: "CDAC Admin",
      email: "admin@cdac.in",
      passwordHash: await bcrypt.hash("cdac@123", 10),
      role: "org_admin",
      organizationId: org._id
    });
  }

  console.log("✅ Demo organization & admin ready");
  process.exit(0);
}

seed();
