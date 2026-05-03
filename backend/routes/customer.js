const express  = require('express');
const router   = express.Router();
const { Op }   = require('sequelize');
const { db }   = require('../models/index');
const { protect, authorize } = require('../middleware/auth');
const { matchWorkersForJob } = require('../services/workerMatchingAI');
const { estimatePrice }      = require('../services/priceEstimationAI');

router.use(protect, authorize('customer'));

// ── GET /api/customer/me ──────────────────────────────────────
router.get('/me', async (req, res, next) => {
  try {
    const customer = await db.Customer.findByPk(req.user.id, {
      attributes: { exclude: ['passwordHash'] },
      include: [{ model: db.Booking, as: 'bookings', include: [{ model: db.Worker, as: 'worker', attributes: ['id', 'firstName', 'lastName', 'rating', 'skills'] }] }],
    });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });

    const bookings  = customer.bookings || [];
    const completed = bookings.filter(b => b.status === 'completed');
    const totalSpent = completed.reduce((s, b) => s + (b.price || 0), 0);

    res.json({
      success: true, data: {
        ...customer.toJSON(),
        stats: { totalBookings: bookings.length, completed: completed.length, active: bookings.filter(b => b.status === 'active').length, totalSpent },
        recentBookings: [...bookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
      }
    });
  } catch (err) { next(err); }
});

// ── GET /api/customer/workers ─────────────────────────────────
router.get('/workers', async (req, res, next) => {
  try {
    const { service, city, lat, lng, radius = 50 } = req.query;
    const where = { isAvailable: true, isVerified: true };
    if (city) where.city = { [Op.iLike]: `%${city}%` };
    if (service) where.skills = { [Op.contains]: [service] };

    const workers = await db.Worker.findAll({ where, attributes: { exclude: ['passwordHash', 'cognitoSub'] } });

    let data = workers.map(w => {
      const json = w.toJSON();
      let distance = null;
      if (lat && lng && w.lat && w.lng) {
        const rad = Math.PI / 180;
        distance = 6371 * Math.acos(
          Math.sin(lat * rad) * Math.sin(w.lat * rad) +
          Math.cos(lat * rad) * Math.cos(w.lat * rad) * Math.cos((w.lng - lng) * rad)
        );
        distance = Math.round(distance * 10) / 10;
      }
      return { ...json, distance };
    });

    if (lat && lng) {
      data = data.filter(w => w.distance === null || w.distance <= parseFloat(radius));
      data.sort((a, b) => (a.distance || 999) - (b.distance || 999));
    }
    res.json({ success: true, count: data.length, data });
  } catch (err) { next(err); }
});

// ── POST /api/customer/bookings ───────────────────────────────
router.post('/bookings', async (req, res, next) => {
  try {
    const { service, description, address, workerId } = req.body;
    if (!service || !address) return res.status(400).json({ success: false, message: 'Service and address are required.' });

    // Get AI suggestions in parallel
    const customer = await db.Customer.findByPk(req.user.id, { attributes: ['city'] });
    const [priceEst, availableWorkers] = await Promise.all([
      estimatePrice(service, description, customer?.city),
      db.Worker.findAll({ where: { isAvailable: true, isVerified: true }, attributes: { exclude: ['passwordHash'] } }),
    ]);

    const matchedIds = await matchWorkersForJob(description || service, service, availableWorkers);

    const booking = await db.Booking.create({
      customerId: req.user.id,
      workerId:   workerId || null,
      service, description, address,
      status: workerId ? 'pending' : 'open',
      aiSuggestedPrice:   priceEst.suggested,
      aiMatchedWorkerIds: matchedIds.slice(0, 5),
    });

    res.status(201).json({ success: true, data: { ...booking.toJSON(), aiPriceEstimate: priceEst } });
  } catch (err) { next(err); }
});

// ── GET /api/customer/bookings ────────────────────────────────
router.get('/bookings', async (req, res, next) => {
  try {
    const bookings = await db.Booking.findAll({
      where: { customerId: req.user.id },
      order: [['createdAt', 'DESC']],
      include: [{ model: db.Worker, as: 'worker', attributes: ['id', 'firstName', 'lastName', 'phone', 'rating'] }],
    });
    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (err) { next(err); }
});

// ── PATCH /api/customer/bookings/:id/rate ─────────────────────
router.patch('/bookings/:id/rate', async (req, res, next) => {
  try {
    const booking = await db.Booking.findOne({ where: { id: req.params.id, customerId: req.user.id } });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (booking.status !== 'completed') return res.status(400).json({ success: false, message: 'Can only rate completed bookings.' });

    const { analyzeSentiment } = require('../services/reviewSentimentService');
    const { rating, comment } = req.body;

    const sentimentResult = await analyzeSentiment(comment || '');
    await db.Review.create({
      bookingId: booking.id, customerId: req.user.id, workerId: booking.workerId,
      rating, comment: comment || '',
      sentiment: sentimentResult.sentiment, sentimentScore: sentimentResult.scores,
    });

    // Recalculate worker average rating
    const allReviews = await db.Review.findAll({ where: { workerId: booking.workerId } });
    const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
    await db.Worker.update({ rating: Math.round(avg * 10) / 10 }, { where: { id: booking.workerId } });

    res.json({ success: true, message: 'Review submitted', sentiment: sentimentResult.sentiment });
  } catch (err) { next(err); }
});

module.exports = router;
