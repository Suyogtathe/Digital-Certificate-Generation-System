const mongoose = require('mongoose');
const Template = require('../models/Template');
require('dotenv').config(); // Defaults to .env in CWD (backend/)

async function cleanupTemplates() {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        const templates = await Template.find();
        console.log(`Found ${templates.length} templates.`);

        for (const tpl of templates) {
            console.log(`Checking Template: ${tpl.name} (${tpl._id}) - BG: ${tpl.bgImageUrl}`);

            // Logic to find the "bad" one. 
            // The user mentioned "6th one is invisible". 
            // It likely has missing bgImageUrl or some other data issue.
            // Or we just delete the one that looks empty.

            if (!tpl.bgImageUrl || tpl.bgImageUrl.trim() === "" || tpl.name === "undefined" || !tpl.name) {
                console.log(`!!! Found potential INVALID template: ${tpl._id}`);
                // Uncomment to actual delete
                await Template.deleteOne({ _id: tpl._id });
                console.log(`Deleted invalid template: ${tpl._id}`);
            }
        }

        // Explicitly delete if there are more than 5, delete the latest one?
        // The user said "originally we have only 5... but (now) 6".
        // Let's re-fetch and see count
        const finalTemplates = await Template.find().sort({ createdAt: 1 });
        if (finalTemplates.length > 5) {
            console.log(`Still have ${finalTemplates.length} templates. Deleting the last one (assumed extra).`);
            const lastOne = finalTemplates[finalTemplates.length - 1];
            await Template.deleteOne({ _id: lastOne._id });
            console.log(`Deleted extra template: ${lastOne.name} (${lastOne._id})`);
        }

        console.log("Cleanup complete.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

cleanupTemplates();
