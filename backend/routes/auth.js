const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { db }   = require('../models/index');
const { signToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

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

// ── POST /api/auth/worker/register ───────────────────────────
router.post('/worker/register', registerValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { firstName, lastName, email, phone, city, skills, experience, password } = req.body;
    const exists = await db.Worker.findOne({ where: { phone } });
    if (exists) return res.status(409).json({ success: false, message: 'Worker account already exists.' });

    const passwordHash = await bcrypt.hash(password, 12);
    const skillsArr = Array.isArray(skills) ? skills : [skills];
    const worker = await db.Worker.create({ firstName, lastName, email, phone, city, skills: skillsArr, experience, passwordHash });
    const token = signToken(worker.id, 'worker');
    const { passwordHash: _, ...safe } = worker.toJSON();
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
    const { passwordHash: _, ...safe } = worker.toJSON();
    res.json({ success: true, token, user: safe, role: 'worker' });
  } catch (err) { next(err); }
});

module.exports = router;
