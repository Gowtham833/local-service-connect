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
        const customer = await db.Customer.findByPk(j.customerId, { attributes: ['firstName', 'lastName', 'phone', 'lat', 'lng'] });
        return { 
          ...j.toJSON(), 
          customerName: customer ? `${customer.firstName} ${customer.lastName}` : 'N/A', 
          customerPhone: customer?.phone,
          customerLat: customer?.lat,
          customerLng: customer?.lng
        };
      })
    );

    res.json({
      success: true,
      data: {
        ...worker.toJSON(),
        stats: {
          totalJobs: completed.length,
          activeJobs: active.length,
          totalEarnings: completed.reduce((s, j) => s + (j.price || 0), 0),
          earningsThisMonth: thisMonth.reduce((s, j) => s + (j.price || 0), 0),
          jobsThisMonth: thisMonth.length,
          avgRating: worker.rating,
        },
        recentJobs: [...recent]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .map(b => typeof b.toJSON === 'function' ? b.toJSON() : b)
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
  const transaction = await db.sequelize.transaction();
  try {
    const booking = await db.Booking.findOne({ 
      where: { id: req.params.id, status: 'open' },
      lock: true,
      transaction 
    });

    if (!booking) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Job not found or already taken.' });
    }

    await booking.update({ 
      workerId: req.user.id, 
      status: 'accepted', 
      acceptedAt: new Date() 
    }, { transaction });

    await transaction.commit();

    const worker = await db.Worker.findByPk(req.user.id, { attributes: ['firstName', 'lastName', 'phone', 'rating', 'avatar', 'experience'] });
    const { notifyJobAccepted } = require('../services/socketService');
    notifyJobAccepted(booking.id, {
      workerId: worker.id,
      workerName: `${worker.firstName} ${worker.lastName}`,
      workerPhone: worker.phone,
      workerRating: worker.rating,
      workerAvatar: worker.avatar,
      workerExp: worker.experience
    });

    res.json({ success: true, data: booking });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
});

// ── PATCH /api/worker/jobs/:id/start ─────────────────────────
router.patch('/jobs/:id/start', async (req, res, next) => {
  try {
    const booking = await db.Booking.findOne({ where: { id: req.params.id, workerId: req.user.id } });
    if (!booking) return res.status(404).json({ success: false, message: 'Job not found.' });
    
    await booking.update({ status: 'in_progress' });
    
    const { notifyStatusUpdate } = require('../services/socketService');
    notifyStatusUpdate(booking.id, 'in_progress');

    res.json({ success: true, data: booking });
  } catch (err) { next(err); }
});

// ── PATCH /api/worker/jobs/:id/complete ──────────────────────
router.patch('/jobs/:id/complete', async (req, res, next) => {
  try {
    const booking = await db.Booking.findOne({ where: { id: req.params.id, workerId: req.user.id } });
    if (!booking) return res.status(404).json({ success: false, message: 'Job not found.' });
    
    const price = parseFloat(req.body.price) || 0;
    await booking.update({ status: 'completed', completedAt: new Date(), price });
    
    const { notifyStatusUpdate } = require('../services/socketService');
    notifyStatusUpdate(booking.id, 'completed', { price });

    res.json({ success: true, data: booking });
  } catch (err) { next(err); }
});

module.exports = router;
