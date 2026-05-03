const express = require('express');
const router  = express.Router();
const { Op }  = require('sequelize');
const { db }  = require('../models/index');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('worker'));

// ── GET /api/worker/me ────────────────────────────────────────
router.get('/me', async (req, res, next) => {
  try {
    const worker = await db.Worker.findByPk(req.user.id, { attributes: { exclude: ['passwordHash', 'cognitoSub'] } });
    if (!worker) return res.status(404).json({ success: false, message: 'Worker not found.' });

    const jobs      = await db.Booking.findAll({ where: { workerId: req.user.id }, order: [['createdAt', 'DESC']] });
    const completed = jobs.filter(j => j.status === 'completed');
    const now = new Date();
    const thisMonth = completed.filter(j => {
      const d = new Date(j.completedAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const recentJobs = await Promise.all(
      jobs.slice(0, 10).map(async (j) => {
        const customer = await db.Customer.findByPk(j.customerId, { attributes: ['firstName', 'lastName', 'phone'] });
        return { ...j.toJSON(), customerName: customer ? `${customer.firstName} ${customer.lastName}` : 'N/A', customerPhone: customer?.phone };
      })
    );

    res.json({
      success: true, data: {
        ...worker.toJSON(),
        stats: {
          totalJobs: completed.length,
          activeJobs: jobs.filter(j => j.status === 'active').length,
          totalEarnings: completed.reduce((s, j) => s + (j.price || 0), 0),
          earningsThisMonth: thisMonth.reduce((s, j) => s + (j.price || 0), 0),
          jobsThisMonth: thisMonth.length,
          avgRating: worker.rating,
        },
        recentJobs,
      }
    });
  } catch (err) { next(err); }
});

// ── PATCH /api/worker/availability ────────────────────────────
router.patch('/availability', async (req, res, next) => {
  try {
    await db.Worker.update({ isAvailable: req.body.isAvailable }, { where: { id: req.user.id } });
    res.json({ success: true, isAvailable: req.body.isAvailable });
  } catch (err) { next(err); }
});

// ── PATCH /api/worker/location ────────────────────────────────
router.patch('/location', async (req, res, next) => {
  try {
    const { lat, lng } = req.body;
    await db.Worker.update({ lat, lng }, { where: { id: req.user.id } });
    res.json({ success: true, lat, lng });
  } catch (err) { next(err); }
});

// ── GET /api/worker/open-jobs ─────────────────────────────────
router.get('/open-jobs', async (req, res, next) => {
  try {
    const worker = await db.Worker.findByPk(req.user.id, { attributes: ['skills'] });
    if (!worker) return res.status(404).json({ success: false, message: 'Worker not found.' });

    const openJobs = await db.Booking.findAll({
      where: {
        status: 'open',
        service: { [Op.in]: worker.skills },
      },
      order: [['createdAt', 'DESC']],
      include: [{ model: db.Customer, as: 'customer', attributes: ['firstName', 'lastName', 'phone', 'city'] }],
    });
    res.json({ success: true, count: openJobs.length, data: openJobs });
  } catch (err) { next(err); }
});

// ── PATCH /api/worker/jobs/:id/accept ────────────────────────
router.patch('/jobs/:id/accept', async (req, res, next) => {
  try {
    const booking = await db.Booking.findOne({ where: { id: req.params.id, status: 'open' } });
    if (!booking) return res.status(404).json({ success: false, message: 'Job not found or already taken.' });
    await booking.update({ workerId: req.user.id, status: 'active', acceptedAt: new Date() });
    res.json({ success: true, data: booking });
  } catch (err) { next(err); }
});

// ── PATCH /api/worker/jobs/:id/complete ──────────────────────
router.patch('/jobs/:id/complete', async (req, res, next) => {
  try {
    const booking = await db.Booking.findOne({ where: { id: req.params.id, workerId: req.user.id } });
    if (!booking) return res.status(404).json({ success: false, message: 'Job not found.' });
    if (booking.status !== 'active') return res.status(400).json({ success: false, message: 'Job is not active.' });
    await booking.update({ status: 'completed', completedAt: new Date(), price: req.body.price || 0 });
    res.json({ success: true, data: booking });
  } catch (err) { next(err); }
});

module.exports = router;
