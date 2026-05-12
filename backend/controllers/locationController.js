const { db } = require('../models');
const { getIO } = require('../services/socketService');

exports.updateLocation = async (req, res) => {
  try {
    const { userId, role, latitude, longitude, accuracy } = req.body;

    // Validate inputs
    if (!userId || !role || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ success: false, message: 'Invalid coordinates' });
    }

    // Ensure users can only update their own location
    if (req.user.id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized location update' });
    }

    // Upsert into user_locations table
    await db.UserLocation.upsert({
      userId,
      role,
      latitude,
      longitude,
      accuracy: accuracy || null,
      updated_at: new Date()
    });

    // Broadcast using Socket.IO if available
    try {
      const io = getIO();
      // Broadcast to a specific room if we knew the active booking, but for now we emit globally or let the client handle it
      // The frontend can listen to 'location:update'
      io.emit('location:update', { userId, role, latitude, longitude, accuracy });
    } catch (err) {
      // socket.io might not be initialized in some test contexts
      console.warn('Socket not available for broadcast', err.message);
    }

    res.json({ success: true, message: 'Location updated successfully' });
  } catch (error) {
    console.error('Location update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update location' });
  }
};

exports.getUserLocation = async (req, res) => {
  try {
    const { userId } = req.params;
    const location = await db.UserLocation.findByPk(userId);
    
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    res.json({ success: true, data: location });
  } catch (error) {
    console.error('Get user location error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch location' });
  }
};

exports.getBookingLocations = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    // Find the booking
    const booking = await db.Booking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Ensure the requester is either the customer or the worker of this booking
    if (req.user.role === 'customer' && req.user.id !== booking.customerId) {
       return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    if (req.user.role === 'worker' && req.user.id !== booking.workerId) {
       return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Get locations
    const customerLocation = await db.UserLocation.findByPk(booking.customerId);
    const workerLocation = booking.workerId ? await db.UserLocation.findByPk(booking.workerId) : null;

    res.json({
      success: true,
      data: {
        customer: customerLocation,
        worker: workerLocation
      }
    });

  } catch (error) {
    console.error('Get booking locations error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch booking locations' });
  }
};
