const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middlewares/auth');
const Certificate = require('../models/Certificate');
const Template = require('../models/Template'); // Import Template
const User = require('../models/User');
const { generateCertificatePdf } = require('../services/pdfService');
const { sendCertificateEmail } = require('../services/emailService');

// Multer setup (Memory storage for quick parsing)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Directories
const UPLOADS_ROOT = path.join(__dirname, '..', '..', process.env.FILE_STORAGE_PATH || 'uploads');
const CERT_DIR = path.join(UPLOADS_ROOT, 'certificates');
if (!fs.existsSync(CERT_DIR)) fs.mkdirSync(CERT_DIR, { recursive: true });

// ---------------------------------------------------------------------
// 1. UPLOAD & PREVIEW
// ---------------------------------------------------------------------
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    try {
        const fileContent = req.file.buffer.toString('utf8');
        const lines = fileContent.split(/\r?\n/).filter(line => line.trim() !== '');

        if (lines.length < 2) return res.status(400).json({ message: "CSV file is empty or missing headers" });

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        // Expected headers validation (loose check)
        const required = ['name', 'course', 'issuedate', 'email'];
        // Optional: 'title' or 'certificate_title'
        const missing = required.filter(r => !headers.includes(r));

        if (missing.length > 0) {
            return res.status(400).json({ message: `Missing columns: ${missing.join(', ')}` });
        }

        const validRows = [];
        const invalidRows = [];

        // Parse rows
        for (let i = 1; i < lines.length; i++) {
            const cells = lines[i].split(',').map(c => c.trim());
            const rowData = {};
            headers.forEach((h, index) => {
                // Normalize title header
                if (h === 'certificate_title' || h === 'certificatetitle') {
                    rowData['title'] = cells[index] || '';
                } else {
                    rowData[h] = cells[index] || '';
                }
            });

            // Validation logic
            const errors = [];
            if (!rowData.name) errors.push("Missing Name");
            if (!rowData.course) errors.push("Missing Course");
            if (!rowData.issuedate) errors.push("Missing Date");
            // Email is optional or required? Let's make it optional for now but recommended
            // if (!rowData.email) errors.push("Missing Email"); 

            if (errors.length === 0) {
                validRows.push({ ...rowData, id: i });
            } else {
                invalidRows.push({ row: i + 1, data: rowData, errors });
            }
        }

        res.json({
            totalParsed: lines.length - 1,
            validCount: validRows.length,
            invalidCount: invalidRows.length,
            validRows,
            invalidRows,
            preview: validRows.slice(0, 5)
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to process CSV" });
    }
});


// ---------------------------------------------------------------------
// 2. COMMIT / GENERATE (After Payment)
// ---------------------------------------------------------------------
router.post('/commit', authMiddleware, async (req, res) => {
    const { rows, templateId, paymentId } = req.body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ message: "No data to process" });
    }

    try {
        const user = req.user; // from auth middleware
        // Fetch Template (Use a default if not provided or handle error)
        let template = null;
        if (templateId) {
            template = await Template.findById(templateId);
        } else {
            // Fallback: Pick latest template or specific default
            template = await Template.findOne().sort({ createdAt: -1 });
        }

        if (!template) {
            return res.status(400).json({ message: "No template available. Please contact admin." });
        }

        const generatedCertificates = [];

        for (const row of rows) {
            const uniqueId = uuidv4().slice(0, 8).toUpperCase();
            const certificateId = `${user.issuerCode}-${uniqueId}`; // ORG-UNIQUE

            // Prepare PDF Data
            const filename = `${certificateId}.pdf`;
            const outPath = path.join(CERT_DIR, filename);
            const qrUrl = `${process.env.FRONTEND_URL}/verify/${certificateId}`;

            // Data for PDF
            const pdfData = {
                certificateTitle: row.title || null, // Dynamic Title
                recipientName: row.name,
                courseName: row.course,
                description: "", // Description is often optional or standard text
                issueDate: row.issuedate,
                organizationName: user.organizationName,
                signatureUrl: user.signatureUrl, // Pass the URL directly
                presentedTo: "This certificate is proudly presented to",
                forCompletion: "For successfully completing the course"
            };

            // Generate PDF
            await generateCertificatePdf(template, pdfData, outPath, certificateId, qrUrl);

            // Create Certificate Entry
            const newCert = await Certificate.create({
                certificateId,
                userId: user.id,
                templateId: template._id,
                paymentId: paymentId || 'PENDING',
                generatedAt: new Date(),
                studentName: row.name,
                courseName: row.course,
                issueDate: row.issuedate,
                pdfUrl: `uploads/certificates/${filename}`,
                qrCodeData: qrUrl
            });

            // Send Email
            if (row.email) {
                try {
                    await sendCertificateEmail(
                        row.email,
                        `Certificate from ${user.organizationName}`,
                        `Dear ${row.name},\n\nCongratulations! Please find your certificate attached.\n\nBest Regards,\n${user.organizationName}`,
                        [{ filename, path: outPath }]
                    );
                } catch (emailErr) {
                    console.error(`Failed to send email to ${row.email}:`, emailErr.message);
                }
            }

            generatedCertificates.push(newCert);
        }

        res.json({
            success: true,
            count: generatedCertificates.length,
            message: `Successfully generated ${generatedCertificates.length} certificates.`
        });

    } catch (err) {
        console.error("Bulk Generation Error", err);
        res.status(500).json({ message: "Error generating certificates", details: err.message });
    }
});

module.exports = router;
