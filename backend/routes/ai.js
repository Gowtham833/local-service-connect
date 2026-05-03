/**
 * AI Routes — Powered by AWS Bedrock + Amazon Comprehend
 * GET /api/ai/price-estimate  — AI price estimation for a service
 * POST /api/ai/match-workers  — AI worker matching for a job
 * POST /api/ai/chat           — ServiBot customer support chatbot
 */
const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { estimatePrice }      = require('../services/priceEstimationAI');
const { matchWorkersForJob } = require('../services/workerMatchingAI');
const { getChatbotResponse } = require('../services/chatbotService');
const { db } = require('../models/index');

// ── GET /api/ai/price-estimate ────────────────────────────────
// Query params: service, description, city
router.get('/price-estimate', protect, async (req, res, next) => {
  try {
    const { service, description, city } = req.query;
    if (!service) return res.status(400).json({ success: false, message: 'service query param required' });
    const estimate = await estimatePrice(service, description, city);
    res.json({ success: true, data: estimate });
  } catch (err) { next(err); }
});

// ── POST /api/ai/match-workers ────────────────────────────────
// Body: { service, description, city }
router.post('/match-workers', protect, async (req, res, next) => {
  try {
    const { service, description, city } = req.body;
    if (!service) return res.status(400).json({ success: false, message: 'service is required' });

    const where = { isAvailable: true, isVerified: true };
    if (city) where.city = city;
    const workers = await db.Worker.findAll({ where, attributes: { exclude: ['passwordHash'] } });

    const rankedIds = await matchWorkersForJob(description || service, service, workers);
    const rankedWorkers = rankedIds.map(id => workers.find(w => w.id === id)).filter(Boolean);

    res.json({ success: true, count: rankedWorkers.length, data: rankedWorkers });
  } catch (err) { next(err); }
});

// ── POST /api/ai/chat ─────────────────────────────────────────
// Body: { message, history: [{role, content}] }
// Public endpoint (no auth required — pre-login chatbot support)
router.post('/chat', async (req, res, next) => {
  try {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'message is required' });
    const reply = await getChatbotResponse(message, history || []);
    res.json({ success: true, reply });
  } catch (err) { next(err); }
});

module.exports = router;
