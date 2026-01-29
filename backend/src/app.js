require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const bodyParser = require('body-parser');   // REQUIRED for webhook raw body

const app = express();

// CORS + Cookies
app.use(cors());
app.use(cookieParser());

// Static uploads
app.use(
  '/uploads',
  express.static(path.join(__dirname, '..', process.env.FILE_STORAGE_PATH || 'uploads'))
);

// ⭐ Razorpay Webhook Route — RAW BODY REQUIRED ⭐
// (MUST come BEFORE express.json)
app.post(
  "/api/webhooks/razorpay",
  bodyParser.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;   // Store buffer for Razorpay HMAC validation
    }
  }),
  require("./routes/webhook").handler
);

// Now safe JSON parser
app.use(express.json());

// Purchase route (correct)
app.use('/api/purchase', require('./routes/purchase'));

// Templates route (KEEP only one)
app.use('/api/templates', require('./routes/templates'));

// Connect to DB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}
connectDB();

// API routes (no duplicates)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/certificates', require('./routes/certificates'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use("/api/bulk-certificates", require("./routes/bulkCertificates"));


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
