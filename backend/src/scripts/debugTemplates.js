const mongoose = require('mongoose');
const Template = require('../models/Template');
require('dotenv').config();

async function debugTemplates() {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(process.env.MONGO_URI);

        const templates = await Template.find();
        console.log(`\n--- TEMPLATE DEBUG REPORT (${templates.length}) ---`);

        templates.forEach(t => {
            console.log(`\nID: ${t._id}`);
            console.log(`Name: ${t.name}`);
            console.log(`BG Image URL: '${t.bgImageUrl}'`);
            console.log(`Type: ${t.type}`);
        });

        console.log("\n-------------------------------------------");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugTemplates();
