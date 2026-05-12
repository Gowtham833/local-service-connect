const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { protect } = require('../middleware/auth');

// All location routes are protected by JWT
router.use(protect);

// Update user location
router.post('/update', locationController.updateLocation);

// Get specific user location
router.get('/:userId', locationController.getUserLocation);

// Get live locations for a specific booking
router.get('/booking/:bookingId', locationController.getBookingLocations);

module.exports = router;
