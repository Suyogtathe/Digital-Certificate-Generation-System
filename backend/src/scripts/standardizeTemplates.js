require("dotenv").config();
const mongoose = require("mongoose");
const Template = require("../models/Template");

// ----------------------------------------------------
// STANDARD LAYOUT DEFINITION (Safest "Modern" Layout)
// ----------------------------------------------------
const STANDARD_LAYOUT = {
    canvas: { w: 1600, h: 1100 },

    // 1. Title (Certificate of Completion) 
    // Positioned high up. User said some backgrounds have it. 
    // We'll set it but allow it to be empty if needed.
    title: {
        x: 800, y: 150,
        fontFamily: "Playfair Display",
        fontSize: 60,
        fontWeight: "700",
        align: "center",
        color: "#333333" // Default Dark
    },

    // 2. Subtitle (This certifies that)
    subtitle: {
        x: 800, y: 250,
        fontFamily: "Montserrat",
        fontSize: 24,
        fontWeight: "400",
        align: "center",
        color: "#555555"
    },

    // 3. Recipient Name (The most important part)
    recipientName: {
        x: 800, y: 380, // Center verticalish
        fontFamily: "Great Vibes", // Cursive look
        fontSize: 90,
        fontWeight: "400",
        align: "center",
        color: "#1F2937" // Dark Gray
    },

    // 4. Description / Course Name
    // "Has successfully completed the course..."
    description: {
        x: 800, y: 560,
        fontFamily: "Poppins",
        fontSize: 22,
        fontWeight: "400",
        align: "center",
        color: "#4B5563",
        maxWidth: 1000 // Prevent edge touching
    },

    // 5. Date (Bottom Left)
    date: {
        x: 200, y: 850,
        fontFamily: "Montserrat",
        fontSize: 18,
        fontWeight: "600",
        align: "left",
        color: "#333333"
    },

    // 6. Signature (Bottom Right)
    // Logic: This is the CONTAINER for the dynamic Organization Signature
    signatures: [
        {
            x: 1100, y: 820,
            width: 250, height: 80,
            label: "Authorized Signatory" // Label below sig
        }
    ],

    // 7. QR Code (Bottom Center)
    qr: {
        x: 750, y: 880, // Bottom center
        size: 100
    }
};

// ----------------------------------------------------
// MAIN SCRIPT
// ----------------------------------------------------
async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const templates = await Template.find({});
        console.log(`Found ${templates.length} templates.`);

        for (const t of templates) {
            console.log(`Processing: ${t.name}`);

            // Determine if Dark Mode is needed (Heuristic: "black", "dark" in name)
            const isDark = t.name.toLowerCase().includes("black") || t.name.toLowerCase().includes("dark");
            const textColor = isDark ? "#FFFFFF" : "#333333";
            const secondaryColor = isDark ? "#CCCCCC" : "#555555";

            // Clone Layout
            const layout = JSON.parse(JSON.stringify(STANDARD_LAYOUT));

            // Apply Colors
            layout.title.color = textColor;
            layout.subtitle.color = secondaryColor;
            layout.recipientName.color = isDark ? "#D0A84F" : "#111827"; // Gold for dark, Black for light
            layout.description.color = secondaryColor;
            layout.date.color = textColor;

            // Special Case: If name has 'no_title' (heuristic), we might imply title provided by bg
            // But for now, we'll just apply standard.

            // Update Template
            t.fields = [layout]; // Wrap in array as per schema
            await t.save();
            console.log(`  -> Updated layout (Dark Mode: ${isDark})`);
        }

        console.log("✅ All templates standardized.");
        process.exit(0);

    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

run();
