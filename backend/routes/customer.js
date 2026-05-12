const express  = require('express');
const router   = express.Router();
const { Op }   = require('sequelize');
const { db }   = require('../models/index');
const { protect, authorize } = require('../middleware/auth');
const { matchWorkersForJob } = require('../services/workerMatchingAI');
const { estimatePrice }      = require('../services/priceEstimationAI');
const { saveMultipleBase64Images } = require('../services/uploadService');
const { sendMessage }          = require('../services/sqsService');
const { v4: uuidv4 }           = require('uuid');

// SQS Queue URL from environment
const DB_WRITE_QUEUE_URL = process.env.DB_WRITE_QUEUE_URL || 'https://sqs.us-east-1.amazonaws.com/123456789012/ServiConnect-DB-Writes-Queue';

router.use(protect, authorize('customer'));

// ── GET /api/customer/me ──────────────────────────────────────
router.get('/me', async (req, res, next) => {
  try {
    const customer = await db.Customer.findByPk(req.user.id, {
      attributes: { exclude: ['passwordHash'] },
      include: [{ model: db.Booking, as: 'bookings', include: [{ model: db.Worker, as: 'worker', attributes: ['id', 'firstName', 'lastName', 'rating', 'skills', 'phone', 'profilePhotoUrl', 'liveSelfieImageUrl', 'verificationStatus', 'isVerified', 'vehicleInfo', 'experience', 'avatar'] }] }],
    });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });

    const bookings  = customer.bookings || [];

    // stats calculation based on the raw instances
    const stats = {
      totalBookings: bookings.length,
      completed: bookings.filter(b => b.status === 'completed').length,
      accepted:  bookings.filter(b => b.status === 'accepted').length,
      in_progress: bookings.filter(b => b.status === 'in_progress').length,
      pending:   bookings.filter(b => b.status === 'pending' || b.status === 'open').length,
      totalSpent: bookings.reduce((sum, b) => sum + (b.price || 0), 0)
    };

    res.json({
      success: true,
      data: {
        ...customer.toJSON(),
        stats,
        recentBookings: [...bookings]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)
          .map(b => {
            const json = typeof b.toJSON === 'function' ? b.toJSON() : b;
            if (json.worker) {
              json.workerName = `${json.worker.firstName} ${json.worker.lastName}`;
              json.workerPhone = json.worker.phone;
              json.workerRating = json.worker.rating;
              json.workerPhoto = json.worker.profilePhotoUrl || json.worker.liveSelfieImageUrl;
              json.workerVerified = json.worker.isVerified;
              json.workerVerificationStatus = json.worker.verificationStatus;
              json.workerVehicle = json.worker.vehicleInfo;
              json.workerExperience = json.worker.experience;
              json.workerAvatar = json.worker.avatar;
            }
            return json;
          })
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

    const workers = await db.Worker.findAll({ where, attributes: { exclude: ['passwordHash', 'cognitoSub', 'aadhaarNumber', 'aadhaarFrontImageUrl', 'aadhaarBackImageUrl'] } });

    const { calculateWorkerScore } = require('../services/workerMatchingAI');
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
      
      const score = calculateWorkerScore(json, distance);
      return { ...json, distance, score };
    });

    // Sort by AI score instead of just distance
    data.sort((a, b) => b.score - a.score);
    
    res.json({ success: true, count: data.length, data });
  } catch (err) { next(err); }
});

// ── POST /api/customer/bookings ───────────────────────────────
router.post('/bookings', async (req, res, next) => {
  try {
    const { service, description, address, workerId, lat, lng, issuePhotos } = req.body;
    if (!service || !address) return res.status(400).json({ success: false, message: 'Service and address are required.' });

    // Require at least one issue photo
    if (!issuePhotos || !Array.isArray(issuePhotos) || issuePhotos.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one issue photo is required. Please upload a photo of the problem.' });
    }

    if (issuePhotos.length > 3) {
      return res.status(400).json({ success: false, message: 'Maximum 3 issue photos allowed.' });
    }

    // Save issue photos
    const issuePhotoUrls = saveMultipleBase64Images(issuePhotos, 'issues', req.user.id.substring(0, 8));

    // Get AI suggestions in parallel
    const customer = await db.Customer.findByPk(req.user.id, { attributes: ['city'] });
    const [priceEst, availableWorkers] = await Promise.all([
      estimatePrice(service, description, customer?.city),
      db.Worker.findAll({ where: { isAvailable: true, isVerified: true }, attributes: { exclude: ['passwordHash'] } }),
    ]);

    const matchedIds = await matchWorkersForJob(description || service, service, availableWorkers);

    const bookingId = uuidv4();
    const payload = {
      customerId: req.user.id,
      workerId:   workerId || null,
      service, description, address,
      lat, lng,
      status: workerId ? 'pending' : 'open',
      aiSuggestedPrice:   priceEst.suggested,
      aiMatchedWorkerIds: matchedIds.slice(0, 5),
      issuePhotoUrls,
    };

    // Send asynchronously to SQS queue
    await sendMessage(DB_WRITE_QUEUE_URL, {
      type: 'CREATE_BOOKING',
      bookingId,
      payload,
      customerData: {
        firstName: req.user.firstName,
        lastName: req.user.lastName,
      }
    });

    res.status(202).json({ 
      success: true, 
      message: 'Booking request accepted and is being processed.',
      data: { id: bookingId, ...payload, aiPriceEstimate: priceEst } 
    });
  } catch (err) { next(err); }
});

// ── GET /api/customer/bookings ────────────────────────────────
router.get('/bookings', async (req, res, next) => {
  try {
    const bookings = await db.Booking.findAll({
      where: { customerId: req.user.id },
      order: [['createdAt', 'DESC']],
      include: [
        { model: db.Worker, as: 'worker', attributes: ['id', 'firstName', 'lastName', 'phone', 'rating', 'profilePhotoUrl', 'liveSelfieImageUrl', 'isVerified', 'verificationStatus', 'vehicleInfo', 'experience', 'avatar'] },
        { model: db.Review, as: 'review', attributes: ['id', 'rating', 'comment'] }
      ],
    });
    const data = bookings.map(b => {
      const json = b.toJSON();
      if (json.worker) {
        json.workerName = `${json.worker.firstName} ${json.worker.lastName}`;
        json.workerPhone = json.worker.phone;
        json.workerRating = json.worker.rating;
        json.workerPhoto = json.worker.profilePhotoUrl || json.worker.liveSelfieImageUrl;
        json.workerVerified = json.worker.isVerified;
        json.workerVehicle = json.worker.vehicleInfo;
        json.workerAvatar = json.worker.avatar;
      }
      // Determine if review is enabled
      json.reviewEnabled = json.status === 'completed' 
        && json.beforeWorkPhotoUrls && json.beforeWorkPhotoUrls.length > 0
        && json.afterWorkPhotoUrls && json.afterWorkPhotoUrls.length > 0
        && json.issuePhotoUrls && json.issuePhotoUrls.length > 0
        && !json.review;
      return json;
    });

    res.json({ success: true, count: data.length, data });
  } catch (err) { next(err); }
});

// ── PATCH /api/customer/bookings/:id/rate ─────────────────────
router.patch('/bookings/:id/rate', async (req, res, next) => {
  try {
    const booking = await db.Booking.findOne({ where: { id: req.params.id, customerId: req.user.id } });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (booking.status !== 'completed') return res.status(400).json({ success: false, message: 'Can only rate completed bookings.' });

    // Enforce proof-based rating: must have both issue and completion photos
    if (!booking.issuePhotoUrls || booking.issuePhotoUrls.length === 0) {
      return res.status(400).json({ success: false, message: 'Issue photos are required before rating.' });
    }
    if (!booking.beforeWorkPhotoUrls || booking.beforeWorkPhotoUrls.length === 0) {
      return res.status(400).json({ success: false, message: 'Worker has not uploaded "Before Work" photos. Rating is not available.' });
    }
    if (!booking.afterWorkPhotoUrls || booking.afterWorkPhotoUrls.length === 0) {
      return res.status(400).json({ success: false, message: 'Worker has not uploaded "After Work" photos. Rating is not available.' });
    }

    // Check if already reviewed
    const existingReview = await db.Review.findOne({ where: { bookingId: booking.id } });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already rated this booking.' });
    }

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

// ── GET /api/customer/bookings/:id/tracking ───────────────────
router.get('/bookings/:id/tracking', async (req, res, next) => {
  try {
    const booking = await db.Booking.findOne({
      where: { id: req.params.id, customerId: req.user.id },
      include: [{ model: db.Worker, as: 'worker', attributes: ['id', 'firstName', 'lastName', 'phone', 'lat', 'lng', 'rating', 'experience', 'avatar', 'vehicleInfo', 'profilePhotoUrl', 'liveSelfieImageUrl', 'isVerified', 'verificationStatus'] }]
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (!booking.worker) return res.status(400).json({ success: false, message: 'No worker assigned to this booking.' });
    
    const w = booking.worker;
    res.json({
      success: true,
      status: booking.status,
      lat: w.lat, lng: w.lng,
      workerName: `${w.firstName} ${w.lastName}`,
      workerPhone: w.phone,
      workerAvatar: w.avatar,
      workerRating: w.rating,
      workerExp: w.experience,
      workerPhoto: w.profilePhotoUrl || w.liveSelfieImageUrl,
      workerVerified: w.isVerified,
      workerVerificationStatus: w.verificationStatus,
      vehicleInfo: w.vehicleInfo,
    });
  } catch (err) { next(err); }
});

// ── PATCH /api/customer/location ─────────────────────────────
router.patch('/location', async (req, res, next) => {
  try {
    const { lat, lng } = req.body;
    await db.Customer.update({ lat, lng }, { where: { id: req.user.id } });
    res.json({ success: true, lat, lng });
  } catch (err) { next(err); }
});

// ── PATCH /api/customer/profile ─────────────────────────────
router.patch('/profile', async (req, res, next) => {
  try {
    const { firstName, lastName, profilePhoto } = req.body;
    
    let updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    
    if (profilePhoto) {
      const { saveBase64Image } = require('../services/uploadService');
      updateData.profilePhotoUrl = saveBase64Image(profilePhoto, 'profiles', req.user.id.substring(0, 8));
    }
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'No data provided to update.' });
    }
    
    await db.Customer.update(updateData, { where: { id: req.user.id } });
    
    // Fetch updated customer to return new photo URL
    const updatedCustomer = await db.Customer.findByPk(req.user.id, { attributes: ['firstName', 'lastName', 'profilePhotoUrl'] });
    
    res.json({ success: true, message: 'Profile updated successfully', data: updatedCustomer });
  } catch (err) { next(err); }
});

module.exports = router;
