const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');
const { body, validationResult } = require('express-validator');
const { db }   = require('../models/index');
const { signToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { saveBase64Image } = require('../services/uploadService');
const { compareFaces } = require('../services/faceMatchService');

// Apply strict rate limit to all auth routes
router.use(authLimiter);

const registerValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('phone').trim().isMobilePhone().withMessage('Valid phone number required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

// ── POST /api/auth/customer/register ─────────────────────────
router.post('/customer/register', registerValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { firstName, lastName, email, phone, city, password } = req.body;
    const exists = await db.Customer.findOne({ where: { phone } });
    if (exists) return res.status(409).json({ success: false, message: 'Account already exists with this phone.' });

    const passwordHash = await bcrypt.hash(password, 12);
    const customer = await db.Customer.create({ firstName, lastName, email, phone, city, passwordHash });
    const token = signToken(customer.id, 'customer');
    const { passwordHash: _, ...safe } = customer.toJSON();
    res.status(201).json({ success: true, token, user: safe, role: 'customer' });
  } catch (err) { next(err); }
});

// ── POST /api/auth/customer/login ─────────────────────────────
router.post('/customer/login', async (req, res, next) => {
  try {
    const { phone, email, password } = req.body;
    const customer = await db.Customer.findOne({
      where: phone ? { phone } : { email },
    });
    if (!customer) return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    const match = await bcrypt.compare(password, customer.passwordHash);
    if (!match)  return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    const token = signToken(customer.id, 'customer');
    const { passwordHash: _, ...safe } = customer.toJSON();
    res.json({ success: true, token, user: safe, role: 'customer' });
  } catch (err) { next(err); }
});

// ── POST /api/auth/worker/register (with verification) ──────
router.post('/worker/register', registerValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { firstName, lastName, email, phone, city, skills, experience, password,
            liveSelfie, aadhaarFront, aadhaarBack, aadhaarNumber } = req.body;

    const exists = await db.Worker.findOne({ where: { phone } });
    if (exists) return res.status(409).json({ success: false, message: 'Worker account already exists.' });

    const passwordHash = await bcrypt.hash(password, 12);
    const skillsArr = Array.isArray(skills) ? skills : (skills ? [skills] : []);

    // Save verification images if provided
    let liveSelfieImageUrl = null;
    let aadhaarFrontImageUrl = null;
    let aadhaarBackImageUrl = null;
    let profilePhotoUrl = null;
    let verificationStatus = 'pending';
    let faceMatchConfidence = null;

    if (liveSelfie) {
      liveSelfieImageUrl = saveBase64Image(liveSelfie, 'selfies', phone);
      profilePhotoUrl = liveSelfieImageUrl; // Use selfie as profile photo
    }
    if (aadhaarFront) {
      aadhaarFrontImageUrl = saveBase64Image(aadhaarFront, 'aadhaar', `${phone}_front`);
    }
    if (aadhaarBack) {
      aadhaarBackImageUrl = saveBase64Image(aadhaarBack, 'aadhaar', `${phone}_back`);
    }

    // Run face match if both selfie and aadhaar front are provided
    if (liveSelfieImageUrl && aadhaarFrontImageUrl) {
      try {
        const faceResult = await compareFaces(liveSelfieImageUrl, aadhaarFrontImageUrl);
        faceMatchConfidence = faceResult.confidence;
        if (faceResult.match) {
          verificationStatus = 'verified';
        } else {
          verificationStatus = 'pending'; // Admin will review
        }
      } catch (faceErr) {
        console.error('[FaceMatch] Error:', faceErr.message);
        verificationStatus = 'pending';
      }
    }

    const isVerified = verificationStatus === 'verified';

    const worker = await db.Worker.create({
      firstName, lastName, email, phone, city,
      skills: skillsArr, experience, passwordHash,
      aadhaarNumber: aadhaarNumber || null,
      aadhaarFrontImageUrl, aadhaarBackImageUrl,
      liveSelfieImageUrl, profilePhotoUrl,
      verificationStatus, faceMatchConfidence,
      isVerified,
    });

    const token = signToken(worker.id, 'worker');
    const { passwordHash: _, aadhaarNumber: __, aadhaarFrontImageUrl: _a, aadhaarBackImageUrl: _b, ...safe } = worker.toJSON();
    res.status(201).json({ success: true, token, user: safe, role: 'worker' });
  } catch (err) { next(err); }
});

// ── POST /api/auth/worker/login ───────────────────────────────
router.post('/worker/login', async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    const worker = await db.Worker.findOne({ where: { phone } });
    if (!worker) return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    const match = await bcrypt.compare(password, worker.passwordHash);
    if (!match)  return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    const token = signToken(worker.id, 'worker');
    const { passwordHash: _, aadhaarNumber: __, aadhaarFrontImageUrl: _a, aadhaarBackImageUrl: _b, ...safe } = worker.toJSON();
    res.json({ success: true, token, user: safe, role: 'worker' });
  } catch (err) { next(err); }
});

// ── POST /api/auth/admin/login ───────────────────────────────
router.post('/admin/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'admin123';

    if (username !== adminUser || password !== adminPass) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    const token = signToken('admin-001', 'admin');
    res.json({
      success: true, token,
      user: { id: 'admin-001', firstName: 'Admin', lastName: '', role: 'admin' },
      role: 'admin'
    });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════════════════════════
// OTP-BASED FORGOT PASSWORD
// ══════════════════════════════════════════════════════════════

// ── POST /api/auth/forgot-password ──────────────────────────
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { phone, role } = req.body;
    if (!phone || !role) {
      return res.status(400).json({ success: false, message: 'Phone and role are required.' });
    }

    // Check if user exists
    const Model = role === 'customer' ? db.Customer : db.Worker;
    const user = await Model.findOne({ where: { phone } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this phone number.' });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Invalidate any existing tokens for this phone
    await db.PasswordResetToken.update(
      { used: true },
      { where: { phone, role, used: false } }
    );

    // Store OTP
    await db.PasswordResetToken.create({ phone, role, otp, expiresAt });

    // In production: send via AWS SNS
    // For dev: log to console and return in response
    console.log(`\n╔══════════════════════════════════════╗`);
    console.log(`║  OTP for ${phone}: ${otp}             ║`);
    console.log(`║  Expires: ${expiresAt.toISOString()}  ║`);
    console.log(`╚══════════════════════════════════════╝\n`);

    res.json({
      success: true,
      message: 'OTP sent successfully to your registered phone.',
      // DEV ONLY — remove in production
      _devOtp: process.env.NODE_ENV === 'production' ? undefined : otp,
    });
  } catch (err) { next(err); }
});

// ── POST /api/auth/verify-otp ────────────────────────────────
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { phone, otp, role } = req.body;
    if (!phone || !otp || !role) {
      return res.status(400).json({ success: false, message: 'Phone, OTP, and role are required.' });
    }

    const token = await db.PasswordResetToken.findOne({
      where: { phone, role, used: false },
      order: [['createdAt', 'DESC']],
    });

    if (!token) {
      return res.status(400).json({ success: false, message: 'No OTP request found. Please request a new one.' });
    }

    // Check expiry
    if (new Date() > new Date(token.expiresAt)) {
      await token.update({ used: true });
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // Check attempts
    if (token.attempts >= 3) {
      await token.update({ used: true });
      return res.status(429).json({ success: false, message: 'Too many attempts. Please request a new OTP.' });
    }

    // Verify OTP
    if (token.otp !== otp) {
      await token.update({ attempts: token.attempts + 1 });
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
    }

    // OTP verified — generate a one-time reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    await token.update({ used: true });

    // Store the reset token temporarily (reuse the same table)
    await db.PasswordResetToken.create({
      phone, role,
      otp: resetToken, // reusing the otp field for the reset token
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      used: false,
    });

    res.json({ success: true, message: 'OTP verified successfully.', resetToken });
  } catch (err) { next(err); }
});

// ── POST /api/auth/reset-password ────────────────────────────
router.post('/reset-password', async (req, res, next) => {
  try {
    const { phone, newPassword, resetToken, role } = req.body;
    if (!phone || !newPassword || !resetToken || !role) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    // Verify reset token
    const token = await db.PasswordResetToken.findOne({
      where: { phone, role, otp: resetToken, used: false },
      order: [['createdAt', 'DESC']],
    });

    if (!token || new Date() > new Date(token.expiresAt)) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token. Please start over.' });
    }

    // Update password
    const Model = role === 'customer' ? db.Customer : db.Worker;
    const user = await Model.findOne({ where: { phone } });
    if (!user) return res.status(404).json({ success: false, message: 'Account not found.' });

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await user.update({ passwordHash });
    await token.update({ used: true });

    res.json({ success: true, message: 'Password reset successfully. You can now login with your new password.' });
  } catch (err) { next(err); }
});

// ── Legacy reset endpoints (backward compatible) ─────────────
router.post('/customer/reset-password', async (req, res, next) => {
  try {
    const { phone, newPassword } = req.body;
    if (!phone || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Invalid phone or password (min 6 chars).' });
    }
    const customer = await db.Customer.findOne({ where: { phone } });
    if (!customer) return res.status(404).json({ success: false, message: 'Account not found.' });

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await customer.update({ passwordHash });
    res.json({ success: true, message: 'Password reset successfully. You can now login.' });
  } catch (err) { next(err); }
});

router.post('/worker/reset-password', async (req, res, next) => {
  try {
    const { phone, newPassword } = req.body;
    if (!phone || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Invalid phone or password (min 6 chars).' });
    }
    const worker = await db.Worker.findOne({ where: { phone } });
    if (!worker) return res.status(404).json({ success: false, message: 'Worker account not found.' });

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await worker.update({ passwordHash });
    res.json({ success: true, message: 'Password reset successfully. You can now login.' });
  } catch (err) { next(err); }
});

module.exports = router;
