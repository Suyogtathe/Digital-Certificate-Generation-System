const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Template = require('../models/Template');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// ---------------------------------------------------------
// CONFIGURATION
// ---------------------------------------------------------
const SOURCE_DIR = 'C:/Users/suyog/.gemini/antigravity/brain/62ba4a99-6c26-4142-a56f-2615cd36aad8';
const DEST_DIR = path.join(__dirname, '../../uploads/backgrounds');

// The 5 new images provided by user
const NEW_IMAGES = [
    'uploaded_image_0_1769009761098.png',
    'uploaded_image_1_1769009761098.png',
    'uploaded_image_2_1769009761098.png',
    'uploaded_image_3_1769009761098.png',
    'uploaded_image_4_1769009761098.png'
];

const TEMPLATE_NAMES = [
    "Professional Gold Edge",
    "Classic Ornamental",
    "Modern Blue Geometric",
    "Luxury Dark Gold",
    "Minimalist Waves"
];

// ---------------------------------------------------------
// MAIN
// ---------------------------------------------------------
const resetTemplates = async () => {
    try {
        console.log("Connecting to Database...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        // 1. CLEAR DATABASE
        console.log("Deleting all existing templates...");
        await Template.deleteMany({});
        console.log("Templates collection cleared.");

        // 2. CLEAR FILESYSTEM
        if (!fs.existsSync(DEST_DIR)) {
            fs.mkdirSync(DEST_DIR, { recursive: true });
        }

        console.log("Cleaning background directory...");
        const files = fs.readdirSync(DEST_DIR);
        for (const file of files) {
            if (file !== '.gitkeep') {
                fs.unlinkSync(path.join(DEST_DIR, file));
            }
        }

        // 3. INGEST NEW IMAGES & CREATE DOCS
        console.log("Ingesting 5 new templates...");

        for (let i = 0; i < 5; i++) {
            const srcFilename = NEW_IMAGES[i];
            const srcPath = path.join(SOURCE_DIR, srcFilename);
            const ext = path.extname(srcFilename) || '.png';
            const destFilename = `t${i + 1}${ext}`;
            const destPath = path.join(DEST_DIR, destFilename);

            if (fs.existsSync(srcPath)) {
                // Copy file
                fs.copyFileSync(srcPath, destPath);
                console.log(`Copied ${srcFilename} -> ${destFilename}`);

                // Create DB Entry
                await Template.create({
                    name: TEMPLATE_NAMES[i],
                    description: "Professional Standard Template",
                    bgImageUrl: `/uploads/backgrounds/${destFilename}`, // CORRECT FIELD NAME
                    // Minimal config, real logic will be in PDF service
                    layout: {
                        orientation: "landscape",
                        textItems: []
                    },
                    price: 50, // Standard price
                    isActive: true
                });
            } else {
                console.error(`⚠️ MISSING SOURCE FILE: ${srcPath}`);
            }
        }

        console.log("✅ SUCCESS: 5 New Templates Registered.");
        process.exit(0);

    } catch (err) {
        console.error("❌ ERROR:", err);
        process.exit(1);
    }
};

resetTemplates();
