const express = require('express');
const router  = express.Router();
const { Op }  = require('sequelize');
const { db }  = require('../models/index');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

// ── GET /api/admin/stats ─────────────────────────────────────
router.get('/stats', async (req, res, next) => {
  try {
    const totalWorkers   = await db.Worker.count();
    const totalCustomers = await db.Customer.count();
    const totalBookings  = await db.Booking.count();
    const pendingWorkers = await db.Worker.count({ where: { verificationStatus: 'pending' } });
    const verifiedWorkers = await db.Worker.count({ where: { verificationStatus: 'verified' } });
    const rejectedWorkers = await db.Worker.count({ where: { verificationStatus: 'rejected' } });
    const completedBookings = await db.Booking.count({ where: { status: 'completed' } });
    const activeBookings = await db.Booking.count({ where: { status: { [Op.in]: ['accepted', 'in_progress'] } } });

    // Total revenue
    const bookings = await db.Booking.findAll({ where: { status: 'completed' }, attributes: ['price'] });
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.price || 0), 0);

    res.json({
      success: true,
      data: {
        totalWorkers, totalCustomers, totalBookings,
        pendingWorkers, verifiedWorkers, rejectedWorkers,
        completedBookings, activeBookings, totalRevenue,
      }
    });
  } catch (err) { next(err); }
});

// ── GET /api/admin/workers ───────────────────────────────────
router.get('/workers', async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const where = {};
    if (status) where.verificationStatus = status;
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
      ];
    }

    const workers = await db.Worker.findAll({
      where,
      attributes: { exclude: ['passwordHash', 'cognitoSub'] },
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, count: workers.length, data: workers });
  } catch (err) { next(err); }
});

// ── GET /api/admin/workers/:id ──────────────────────────────
router.get('/workers/:id', async (req, res, next) => {
  try {
    const worker = await db.Worker.findByPk(req.params.id, {
      attributes: { exclude: ['passwordHash', 'cognitoSub'] },
      include: [
        { model: db.Booking, as: 'jobs', limit: 20, order: [['createdAt', 'DESC']] },
        { model: db.Review, as: 'reviews', limit: 10, order: [['createdAt', 'DESC']] },
      ],
    });
    if (!worker) return res.status(404).json({ success: false, message: 'Worker not found.' });

    res.json({ success: true, data: worker });
  } catch (err) { next(err); }
});

// ── PATCH /api/admin/workers/:id/verify ─────────────────────
router.patch('/workers/:id/verify', async (req, res, next) => {
  try {
    const { action, notes } = req.body; // action: 'approve' or 'reject'
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be "approve" or "reject".' });
    }

    const worker = await db.Worker.findByPk(req.params.id);
    if (!worker) return res.status(404).json({ success: false, message: 'Worker not found.' });

    const verificationStatus = action === 'approve' ? 'verified' : 'rejected';
    const isVerified = action === 'approve';

    await worker.update({
      verificationStatus,
      isVerified,
      verificationNotes: notes || null,
    });

    res.json({
      success: true,
      message: `Worker ${action === 'approve' ? 'approved' : 'rejected'} successfully.`,
      data: { verificationStatus, isVerified },
    });
  } catch (err) { next(err); }
});

// ── GET /api/admin/bookings ─────────────────────────────────
router.get('/bookings', async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const where = {};
    if (status) where.status = status;

    const bookings = await db.Booking.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: 50,
      include: [
        { model: db.Customer, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'phone'] },
        { model: db.Worker, as: 'worker', attributes: ['id', 'firstName', 'lastName', 'phone', 'profilePhotoUrl'] },
        { model: db.Review, as: 'review', attributes: ['id', 'rating', 'comment', 'sentiment'] },
      ],
    });

    const data = bookings.map(b => {
      const json = b.toJSON();
      json.customerName = json.customer ? `${json.customer.firstName} ${json.customer.lastName}` : 'N/A';
      json.workerName = json.worker ? `${json.worker.firstName} ${json.worker.lastName}` : 'Unassigned';
      return json;
    });

    res.json({ success: true, count: data.length, data });
  } catch (err) { next(err); }
});

// ── GET /api/admin/bookings/:id ─────────────────────────────
router.get('/bookings/:id', async (req, res, next) => {
  try {
    const booking = await db.Booking.findByPk(req.params.id, {
      include: [
        { model: db.Customer, as: 'customer', attributes: { exclude: ['passwordHash'] } },
        { model: db.Worker, as: 'worker', attributes: { exclude: ['passwordHash', 'cognitoSub'] } },
        { model: db.Review, as: 'review' },
      ],
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    res.json({ success: true, data: booking });
  } catch (err) { next(err); }
});

module.exports = router;
