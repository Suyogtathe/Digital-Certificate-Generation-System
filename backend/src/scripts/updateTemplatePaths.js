/**
 * Database Migration Script: Update Template Image Paths
 * 
 * This script updates all template bgImageUrl paths from:
 *   /uploads/backgrounds/t1.png  →  /templates/t1.png
 * 
 * This is needed because template images are now served from
 * frontend/public/templates/ on Netlify instead of backend uploads.
 * 
 * Run this script ONCE after deploying the code changes:
 *   node src/scripts/updateTemplatePaths.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('ERROR: MONGO_URI not found in environment variables');
    process.exit(1);
}

// Template Schema (minimal for this migration)
const TemplateSchema = new mongoose.Schema({
    name: String,
    bgImageUrl: String,
    previewUrl: String
}, { strict: false });

const Template = mongoose.model('Template', TemplateSchema);

// Path mapping: old path → new path
const pathMappings = {
    '/uploads/backgrounds/t1.png': '/templates/t1.png',
    '/uploads/backgrounds/t2.png': '/templates/t2.png',
    '/uploads/backgrounds/t3.png': '/templates/t3.png',
    '/uploads/backgrounds/t4.png': '/templates/t4.png',
    '/uploads/backgrounds/t5.png': '/templates/t5.png',
    // Add more mappings if needed
};

async function updateTemplatePaths() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected successfully!\n');

        // Fetch all templates
        const templates = await Template.find({});
        console.log(`Found ${templates.length} templates\n`);

        let updatedCount = 0;

        for (const template of templates) {
            let needsUpdate = false;
            const updates = {};

            // Check bgImageUrl
            if (template.bgImageUrl) {
                // Check if it matches our mapping
                if (pathMappings[template.bgImageUrl]) {
                    updates.bgImageUrl = pathMappings[template.bgImageUrl];
                    needsUpdate = true;
                    console.log(`  [${template.name}] bgImageUrl: ${template.bgImageUrl} → ${updates.bgImageUrl}`);
                }
                // Also handle patterns like /uploads/backgrounds/* that aren't in exact mapping
                else if (template.bgImageUrl.startsWith('/uploads/backgrounds/')) {
                    const filename = template.bgImageUrl.split('/').pop();
                    updates.bgImageUrl = `/templates/${filename}`;
                    needsUpdate = true;
                    console.log(`  [${template.name}] bgImageUrl: ${template.bgImageUrl} → ${updates.bgImageUrl}`);
                }
            }

            // Check previewUrl if it exists
            if (template.previewUrl && template.previewUrl.startsWith('/uploads/backgrounds/')) {
                const filename = template.previewUrl.split('/').pop();
                updates.previewUrl = `/templates/${filename}`;
                needsUpdate = true;
                console.log(`  [${template.name}] previewUrl: ${template.previewUrl} → ${updates.previewUrl}`);
            }

            // Apply updates
            if (needsUpdate) {
                await Template.updateOne({ _id: template._id }, { $set: updates });
                updatedCount++;
            } else {
                console.log(`  [${template.name}] - No update needed (current path: ${template.bgImageUrl})`);
            }
        }

        console.log(`\n✅ Migration complete! Updated ${updatedCount} templates.`);

        // Verify changes
        console.log('\n--- Verification ---');
        const updatedTemplates = await Template.find({}, 'name bgImageUrl');
        for (const t of updatedTemplates) {
            console.log(`  ${t.name}: ${t.bgImageUrl}`);
        }

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

// Run the migration
updateTemplatePaths();
