const mongoose = require('mongoose');
const ValidOrganization = require('../models/ValidOrganization');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const ORGS = [
    { organizationName: "Sunbeam Pune", issuerCode: "SUN-PUNE" },
    { organizationName: "CDAC Mumbai", issuerCode: "CDAC-MUM" },
    { organizationName: "IIT Bombay", issuerCode: "IIT-B" },
    { organizationName: "Tech Mahindra", issuerCode: "TECH-M" },
    { organizationName: "Infosys Training", issuerCode: "INF-TR" },
    { organizationName: "Grand Valley University", issuerCode: "GVU-USA" } // For fun/completeness
];

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB.");

        await ValidOrganization.deleteMany({});
        console.log("Cleared existing whitelist.");

        await ValidOrganization.insertMany(ORGS);
        console.log("Seeded Valid Organizations:");
        ORGS.forEach(o => console.log(` - ${o.organizationName} (${o.issuerCode})`));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

seed();
