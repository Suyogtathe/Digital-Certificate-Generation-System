const mongoose = require('mongoose');
const Template = require('../models/Template');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const templates = await Template.find({});
        console.log(`Found ${templates.length} templates.`);
        templates.forEach(t => {
            console.log(`- ID: ${t._id}, Name: ${t.name}, BG: ${t.backgroundImage || t.bgImageUrl}, Active: ${t.isActive}`);
        });
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
check();
