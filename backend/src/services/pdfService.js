// backend/src/services/pdfService.js
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const sizeOf = require('image-size'); // Need to add this package or use simple heuristic

// -------------------------------------------------------------
// STANDARD PROFESSIONAL LAYOUT (Percentage Based)
// -------------------------------------------------------------
// Y positions are % of height. Font sizes are % of height.
const STANDARD_LAYOUT = {
  // Title: "CERTIFICATE OF ACHIEVEMENT"
  title: { y: 0.15, fontSize: 0.05, font: 'Times-Bold', color: '#111' },

  // Org Name: "Issued by Acme Corp"
  organization: { y: 0.22, fontSize: 0.025, font: 'Helvetica-Bold', color: '#444' },

  // Presentation Line: "This certificate is proudly presented to"
  presentedTo: { y: 0.35, fontSize: 0.02, font: 'Helvetica', color: '#555', text: "This certificate is proudly presented to" },

  // Recipient Name: "JOHN DOE" (The Hero Element)
  recipient: { y: 0.42, fontSize: 0.06, font: 'Great Vibes', color: '#d4af37' }, // Gold-isher color by default

  // Course Line: "For successfully completing the course"
  forCompletion: { y: 0.52, fontSize: 0.02, font: 'Helvetica', color: '#555', text: "For successfully completing the course" },

  // Course Name: "Advanced Web Development"
  courseName: { y: 0.56, fontSize: 0.035, font: 'Helvetica-Bold', color: '#222' },

  // Description / Details
  description: { y: 0.65, fontSize: 0.018, font: 'Helvetica', color: '#666', maxWidth: 0.7 },

  // Issue Date (Bottom Leftish)
  dateLabel: { y: 0.78, x: 0.20, fontSize: 0.015, font: 'Helvetica-Bold', text: "Date of Issue" },
  dateValue: { y: 0.81, x: 0.20, fontSize: 0.015, font: 'Helvetica' },

  // Signature (Bottom Rightish)
  signatureImg: { y: 0.75, x: 0.65, h: 0.08, w: 0.20 }, // h/w as % of page dims
  signatoryLine: { y: 0.83, x: 0.65, fontSize: 0.015, font: 'Helvetica-Bold', text: "Authorized Signatory" },

  // QR Code (Bottom Center or Corner)
  qr: { y: 0.82, x: 0.45, size: 0.10 }, // Size as % of min(w,h)

  // Cert ID (Very Bottom Center)
  certId: { y: 0.94, fontSize: 0.012, font: 'Courier', color: '#999' }
};

// Map friendly font names to PDFKit standard fonts or loading logic
function getFont(doc, name) {
  // Simple mapping to standard PDF fonts for reliability
  const map = {
    'Times-Bold': 'Times-Bold',
    'Helvetica': 'Helvetica',
    'Helvetica-Bold': 'Helvetica-Bold',
    'Courier': 'Courier',
    'Great Vibes': 'Times-Italic' // Fallback if custom font load fails
  };
  return map[name] || 'Helvetica';
}

function resolvePath(relPath) {
  if (!relPath) return null;

  console.log(`[pdfService] Resolving path: ${relPath}`);

  // Base directory (Root of backend)
  const baseDir = path.resolve(__dirname, '..', '..');

  // 1. Clean the input (remove query strings, etc)
  const stripped = relPath.split('?')[0];

  // 2. Try absolute path
  if (path.isAbsolute(stripped) && fs.existsSync(stripped)) {
    return stripped;
  }

  // 3. Try relative to CWD (Project Root)
  // Ensure we strip leading slash so path.join works correctly
  const cleanRel = stripped.replace(/^[\/\\]/, '');

  const attempt1 = path.join(baseDir, cleanRel);
  if (fs.existsSync(attempt1)) {
    console.log(`[pdfService] Found at: ${attempt1}`);
    return attempt1;
  }

  // 4. Try removing 'uploads' from start if doubled, or adding it
  // Case: DB has "uploads/t1.png", Folder is "uploads/t1.png" -> Matches above
  // Case: DB has "t1.png", Folder is "uploads/t1.png"
  const attempt2 = path.join(baseDir, 'uploads', cleanRel);
  if (fs.existsSync(attempt2)) {
    console.log(`[pdfService] Found at (with uploads prefix): ${attempt2}`);
    return attempt2;
  }

  // Case: DB has "/uploads/..." but maybe actual folder is slightly different?
  // Let's rely on standard 'uploads' folder relative to backend root.

  console.warn(`[pdfService] Failed to resolve: ${relPath}. Tried: ${attempt1}, ${attempt2}`);
  return attempt1; // Return the most likely one even if not found, to let fs fail later gracefully
}

/**
 * GENERATE CERTIFICATE PDF
 */
async function generateCertificatePdf(template, data, outputPath, certId, qrUrl) {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. Resolve Background & Dimensions
      const bgPath = resolvePath(template.backgroundImage || template.bgImageUrl);
      let width = 842; // A4 Landscape default
      let height = 595;

      // Try to read image dimensions to prevent distortion
      // Note: 'image-size' might not be installed. We'll try to load it, else fallback.
      if (bgPath && fs.existsSync(bgPath)) {
        try {
          // If image-size is missing, we rely on standard A4 or try to detect from PDFKit image object (harder before doc creation)
          // For this environment, let's assume standard A4 landscape ratio if we can't detect
          const dimensions = sizeOf(bgPath);
          width = dimensions.width;
          height = dimensions.height;
        } catch (e) {
          // Fallback to A4 Landscape
          width = 842;
          height = 595;
        }
      }

      // Create Doc
      const doc = new PDFDocument({ size: [width, height], margin: 0 });
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // 2. Draw Background
      if (bgPath && fs.existsSync(bgPath)) {
        doc.image(bgPath, 0, 0, { width, height });
      }

      // 3. Render Elements
      const L = STANDARD_LAYOUT;

      // Helper to center text
      const drawCentered = (text, yPct, sizePct, font, color, maxWPct = 0.8) => {
        if (!text) return;
        doc.font(getFont(doc, font));
        doc.fontSize(height * sizePct);
        doc.fillColor(color || 'black');
        doc.text(text, width * (1 - maxWPct) / 2, height * yPct, {
          width: width * maxWPct,
          align: 'center'
        });
      };

      // Helper to draw at specific X/Y
      const drawAt = (text, xPct, yPct, sizePct, font, color) => {
        if (!text) return;
        doc.font(getFont(doc, font));
        doc.fontSize(height * sizePct);
        doc.fillColor(color || 'black');
        doc.text(text, width * xPct, height * yPct, { align: 'left' }); // Adjust input x to be center of text? No, left align usually better for specifics
      };

      // TITLE
      // Use dynamic title if provided, otherwise default. Apply Uppercase for style.
      const titleText = (data.certificateTitle || "CERTIFICATE OF APPRECIATION").toUpperCase();
      drawCentered(titleText, L.title.y, L.title.fontSize, L.title.font, L.title.color);

      // ORG
      // Use Organization Name from data or User
      const orgName = data.organizationName || (data.organization && data.organization.organizationName) || "Organization";
      drawCentered(orgName.toUpperCase(), L.organization.y, L.organization.fontSize, L.organization.font, L.organization.color);

      // PRESENTED TO
      drawCentered(L.presentedTo.text, L.presentedTo.y, L.presentedTo.fontSize, L.presentedTo.font, L.presentedTo.color);

      // RECIPIENT
      const recipient = data.recipientName || data.studentName || "Recipient Name";
      drawCentered(recipient, L.recipient.y, L.recipient.fontSize, L.recipient.font, L.recipient.color);

      // COMPLETION TEXT
      drawCentered(L.forCompletion.text, L.forCompletion.y, L.forCompletion.fontSize, L.forCompletion.font, L.forCompletion.color);

      // COURSE NAME
      const course = data.courseName || data.description || "Course Name";
      drawCentered(course, L.courseName.y, L.courseName.fontSize, L.courseName.font, L.courseName.color);

      // DESCRIPTION (Optional)
      if (data.description && data.description !== course) {
        drawCentered(data.description, L.description.y, L.description.fontSize, L.description.font, L.description.color);
      }

      // DATE
      drawAt(L.dateLabel.text, L.dateLabel.x, L.dateLabel.y, L.dateLabel.fontSize, L.dateLabel.font, '#333');
      const dateVal = data.issueDate ? new Date(data.issueDate).toLocaleDateString() : new Date().toLocaleDateString();
      drawAt(dateVal, L.dateValue.x, L.dateValue.y, L.dateValue.fontSize, L.dateValue.font, '#333');

      // SIGNATURE
      // data.signatureUrl might come in differently
      const sigUrl = data.signatureUrl || (data.organization && data.organization.signatureUrl);
      if (sigUrl) {
        const sigPath = resolvePath(sigUrl);
        if (fs.existsSync(sigPath)) {
          const sW = width * L.signatureImg.w;
          const sH = height * L.signatureImg.h;
          // Center the image over the line
          doc.image(sigPath, width * L.signatureImg.x, height * L.signatureImg.y, { width: sW, height: sH, fit: [sW, sH] });
        }
      }
      drawAt(L.signatoryLine.text, L.signatoryLine.x, L.signatoryLine.y, L.signatoryLine.fontSize, L.signatoryLine.font, '#333');


      // QR CODE
      if (qrUrl) {
        const qrSize = Math.min(width, height) * L.qr.size;
        const qrBuf = await QRCode.toBuffer(qrUrl);
        // Center QR
        const qX = (width * 0.5) - (qrSize / 2);
        // Put it lower down
        doc.image(qrBuf, qX, height * 0.82, { width: qrSize, height: qrSize });
      }

      // CERT ID
      drawCentered(`Certificate ID: ${certId}`, L.certId.y, L.certId.fontSize, L.certId.font, L.certId.color);

      doc.end();

      stream.on('finish', () => resolve(outputPath));
      stream.on('error', reject);

    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateCertificatePdf };
