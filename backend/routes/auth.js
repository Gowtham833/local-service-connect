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
const { sendOTP } = require('../services/smsService');

// Apply strict rate limit to all auth routes
router.use(authLimiter);

const registerValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('phone').trim().isMobilePhone().withMessage('Valid phone number required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('6-digit OTP is required'),
];

// ── POST /api/auth/register/send-otp ──────────────────────────
router.post('/register/send-otp', async (req, res, next) => {
  try {
    const { phone, role } = req.body;
    if (!phone || !role) return res.status(400).json({ success: false, message: 'Phone and role required.' });

    // Check if account already exists
    const Model = role === 'customer' ? db.Customer : db.Worker;
    const exists = await Model.findOne({ where: { phone } });
    if (exists) return res.status(409).json({ success: false, message: 'Account already exists with this phone.' });

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    // Invalidate old ones
    await db.PasswordResetToken.update({ used: true }, { where: { phone, role, used: false } });
    await db.PasswordResetToken.create({ phone, role, otp, expiresAt });
    
    await sendOTP(phone, otp, 'registration');
    
    const response = { success: true, message: 'Verification code sent successfully.' };
    if (process.env.SMS_ENABLED !== 'true') {
      response._devOtp = otp;
    }

    res.json(response);
  } catch (err) { next(err); }
});

// ── POST /api/auth/customer/register ─────────────────────────
router.post('/customer/register', registerValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { firstName, lastName, email, phone, city, password, otp } = req.body;

    // Verify OTP
    const tokenRecord = await db.PasswordResetToken.findOne({
      where: { phone, role: 'customer', used: false },
      order: [['created_at', 'DESC']]
    });

    if (!tokenRecord || tokenRecord.otp !== otp || tokenRecord.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code.' });
    }

    const exists = await db.Customer.findOne({ where: { phone } });
    if (exists) return res.status(409).json({ success: false, message: 'Account already exists with this phone.' });

    await tokenRecord.update({ used: true });

    const passwordHash = await bcrypt.hash(password, 12);
    const customer = await db.Customer.create({ firstName, lastName, email, phone, city, passwordHash });
    const token = signToken(customer.id, 'customer');
    const { passwordHash: _, ...safe } = customer.toJSON();
    res.status(201).json({ success: true, token, user: safe, role: 'customer' });
  } catch (err) { next(err); }
});

// ── POST /api/auth/login/send-otp ─────────────────────────────
router.post('/login/send-otp', async (req, res, next) => {
  try {
    const { phone, role } = req.body;
    if (!phone || !role) return res.status(400).json({ success: false, message: 'Phone and role required.' });

    const Model = role === 'customer' ? db.Customer : db.Worker;
    const user = await Model.findOne({ where: { phone } });
    if (!user) return res.status(404).json({ success: false, message: 'Account not found with this phone number.' });

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    await db.PasswordResetToken.update(
      { used: true },
      { where: { phone, role, used: false } }
    );

    await db.PasswordResetToken.create({ phone, role, otp, expiresAt });
    
    await sendOTP(phone, otp, 'login');
    
    const response = { success: true, message: 'OTP sent successfully. Check console or phone.' };
    if (process.env.SMS_ENABLED !== 'true') {
      response._devOtp = otp;
    }

    res.json(response);
  } catch (err) { next(err); }
});

// ── POST /api/auth/customer/login ─────────────────────────────
router.post('/customer/login', async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    
    // Verify OTP
    const tokenRecord = await db.PasswordResetToken.findOne({
      where: { phone, role: 'customer', used: false },
      order: [['created_at', 'DESC']]
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP is invalid or expired.' });
    }
    if (tokenRecord.attempts >= 3) {
      return res.status(400).json({ success: false, message: 'Too many failed attempts. Request a new OTP.' });
    }

    if (tokenRecord.otp !== otp) {
      await tokenRecord.increment('attempts');
      return res.status(400).json({ success: false, message: 'Incorrect OTP.' });
    }

    await tokenRecord.update({ used: true });

    // Login successful
    const customer = await db.Customer.findOne({ where: { phone } });
    if (!customer) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

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
            aadhaarFront, aadhaarBack, aadhaarNumber, otp } = req.body;

    // Verify OTP
    const tokenRecord = await db.PasswordResetToken.findOne({
      where: { phone, role: 'worker', used: false },
      order: [['created_at', 'DESC']]
    });

    if (!tokenRecord || tokenRecord.otp !== otp || tokenRecord.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code.' });
    }

    const exists = await db.Worker.findOne({ where: { phone } });
    if (exists) return res.status(409).json({ success: false, message: 'Worker account already exists.' });

    await tokenRecord.update({ used: true });

    const passwordHash = await bcrypt.hash(password, 12);
    const skillsArr = Array.isArray(skills) ? skills : (skills ? [skills] : []);

    // Save verification images if provided
    let aadhaarFrontImageUrl = null;
    let aadhaarBackImageUrl = null;
    let verificationStatus = 'pending';

    try {
      if (aadhaarFront && aadhaarFront.length > 100) {
        aadhaarFrontImageUrl = saveBase64Image(aadhaarFront, 'aadhaar', `${phone}_front`);
      }
    } catch (uploadErr) {
      console.error('[Upload] Aadhaar front upload error:', uploadErr.message);
    }

    try {
      if (aadhaarBack && aadhaarBack.length > 100) {
        aadhaarBackImageUrl = saveBase64Image(aadhaarBack, 'aadhaar', `${phone}_back`);
      }
    } catch (uploadErr) {
      console.error('[Upload] Aadhaar back upload error:', uploadErr.message);
    }

    const worker = await db.Worker.create({
      firstName,
      lastName: lastName || null,
      email: email || null,
      phone,
      city: city || null,
      skills: skillsArr,
      experience: experience || null,
      passwordHash,
      aadhaarNumber: aadhaarNumber || null,
      aadhaarFrontImageUrl,
      aadhaarBackImageUrl,
      liveSelfieImageUrl: null,
      profilePhotoUrl: null,
      verificationStatus,
      faceMatchConfidence: null,
      isVerified: false,
    });

    const token = signToken(worker.id, 'worker');
    const { passwordHash: _, aadhaarNumber: __, aadhaarFrontImageUrl: _a, aadhaarBackImageUrl: _b, ...safe } = worker.toJSON();
    res.status(201).json({ success: true, token, user: safe, role: 'worker' });
  } catch (err) { next(err); }
});

// ── POST /api/auth/worker/login ───────────────────────────────
router.post('/worker/login', async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    
    // Verify OTP
    const tokenRecord = await db.PasswordResetToken.findOne({
      where: { phone, role: 'worker', used: false },
      order: [['created_at', 'DESC']]
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP is invalid or expired.' });
    }
    if (tokenRecord.attempts >= 3) {
      return res.status(400).json({ success: false, message: 'Too many failed attempts. Request a new OTP.' });
    }

    if (tokenRecord.otp !== otp) {
      await tokenRecord.increment('attempts');
      return res.status(400).json({ success: false, message: 'Incorrect OTP.' });
    }

    await tokenRecord.update({ used: true });

    // Login successful
    const worker = await db.Worker.findOne({ where: { phone } });
    if (!worker) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

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

    await sendOTP(phone, otp, 'reset');

    res.json({
      success: true,
      message: 'OTP sent successfully to your registered phone.',
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
