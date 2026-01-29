const mongoose = require('mongoose');
const ValidOrganization = require('../models/ValidOrganization');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const debug = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB.");

        const all = await ValidOrganization.find({});
        console.log(`Total Valid Orgs in DB: ${all.length}`);

        console.log("--- LIST ---");
        all.forEach(o => {
            console.log(`Name: '${o.organizationName}', Code: '${o.issuerCode}'`);
        });

        // Simulation
        const testCode = "SUN-PUNE";
        const found = await ValidOrganization.findOne({ issuerCode: testCode });
        console.log(`\nSimulation check for '${testCode}':`, found ? "FOUND" : "NOT FOUND");

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

debug();
