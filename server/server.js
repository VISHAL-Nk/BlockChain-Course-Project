require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const QRCode = require('qrcode');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve Frontend as static files
app.use(express.static(path.join(__dirname, '..', 'Frontend')));

// Helper: check if Pinata keys are configured
function hasPinataKeys() {
  return (
    process.env.PINATA_API_KEY &&
    process.env.PINATA_API_KEY !== 'your_pinata_api_key' &&
    process.env.PINATA_SECRET_API_KEY &&
    process.env.PINATA_SECRET_API_KEY !== 'your_pinata_secret_key'
  );
}

// Helper: generate a fake CID for demo mode
function generateFakeCID() {
  const randomHex = crypto.randomBytes(22).toString('hex');
  return 'Qm' + randomHex;
}

// ─── POST /api/upload-to-ipfs ───────────────────────────────────────────────
// Receives JSON metadata, pins to Pinata, returns { cid }
app.post('/api/upload-to-ipfs', async (req, res) => {
  try {
    const metadata = req.body;

    if (!metadata || Object.keys(metadata).length === 0) {
      return res.status(400).json({ error: 'No metadata provided' });
    }

    // If Pinata keys are available, pin to Pinata
    if (hasPinataKeys()) {
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        metadata,
        {
          headers: {
            'Content-Type': 'application/json',
            pinata_api_key: process.env.PINATA_API_KEY,
            pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
          },
        }
      );

      return res.json({ cid: response.data.IpfsHash });
    }

    // Demo mode: return a fake CID
    console.log('[Demo Mode] Generating fake CID for metadata upload');
    const fakeCID = generateFakeCID();
    return res.json({ cid: fakeCID });
  } catch (error) {
    console.error('Error uploading to IPFS:', error.message);
    return res.status(500).json({
      error: 'Failed to upload metadata to IPFS',
      details: error.message,
    });
  }
});

// ─── POST /api/generate-qr ─────────────────────────────────────────────────
// Receives { data: string }, generates QR code as base64 PNG
// If Pinata keys are set, also uploads the QR PNG to Pinata
app.post('/api/generate-qr', async (req, res) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ error: 'No data provided for QR generation' });
    }

    // Generate QR code as base64 PNG
    const qrBase64 = await QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    // If Pinata keys are available, upload the QR PNG to Pinata
    if (hasPinataKeys()) {
      // Convert base64 to buffer
      const base64Data = qrBase64.replace(/^data:image\/png;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // Build form data for file upload
      const formData = new FormData();
      formData.append('file', buffer, {
        filename: 'qrcode.png',
        contentType: 'image/png',
      });

      const pinataResponse = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          maxBodyLength: Infinity,
          headers: {
            ...formData.getHeaders(),
            pinata_api_key: process.env.PINATA_API_KEY,
            pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
          },
        }
      );

      return res.json({
        qrBase64,
        cid: pinataResponse.data.IpfsHash,
      });
    }

    // Demo mode: return QR without CID
    return res.json({ qrBase64 });
  } catch (error) {
    console.error('Error generating QR code:', error.message);
    return res.status(500).json({
      error: 'Failed to generate QR code',
      details: error.message,
    });
  }
});

// ─── Fallback: serve index.html for SPA-style routing ───────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Frontend', 'index.html'));
});

// ─── Start server ───────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎫 TicketNFT Server running on http://localhost:${PORT}`);
  console.log(`📂 Serving Frontend from: ${path.join(__dirname, '..', 'Frontend')}`);
  if (hasPinataKeys()) {
    console.log('📌 Pinata integration: ENABLED');
  } else {
    console.log('⚠️  Pinata integration: DISABLED (demo mode — using fake CIDs)');
  }
  console.log('');
});
