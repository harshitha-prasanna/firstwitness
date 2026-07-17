require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');

const upload = multer();
const app = express();
app.use(cors());

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL || SMTP_USER;

if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
  console.warn('SMTP credentials are not fully configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env');
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: Number(SMTP_PORT) === 465, // true for 465, false for other ports
  auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});

app.get('/health', (req, res) => res.json({ ok: true }));

// Accept multipart/form-data: file + fields
app.post('/api/send-email', upload.fields([{ name: 'file', maxCount: 1 }, { name: 'audio', maxCount: 1 }]), async (req, res) => {
  try {
    const to = req.body.to || 'police@ksp.gov.in';
    const cc = req.body.cc || 'compolbcp@ksp.gov.in';
    const subject = req.body.subject || 'Evidence Report Submission';
    const body = req.body.body || 'Please find attached the evidence report generated through FirstWitness.';

    const attachments = [];
    if (req.files && req.files.file && req.files.file[0]) {
      const f = req.files.file[0];
      attachments.push({ filename: f.originalname || 'evidence.pdf', content: f.buffer, contentType: f.mimetype || 'application/pdf' });
    }
    if (req.files && req.files.audio && req.files.audio[0]) {
      const a = req.files.audio[0];
      attachments.push({ filename: a.originalname || 'recording.webm', content: a.buffer, contentType: a.mimetype || 'audio/webm' });
    }

    const mailOptions = {
      from: FROM_EMAIL,
      to,
      cc,
      subject,
      text: body,
      attachments,
    };

    await transporter.sendMail(mailOptions);
    return res.json({ ok: true });
  } catch (err) {
    console.error('send-email error', err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`FirstWitness mailer listening on port ${PORT}`);
});
