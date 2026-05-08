/**
 * Socket.io Service
 * Handles real-time events for job broadcasts, acceptance, and location tracking.
 */
let io;

function init(server) {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Join room for a specific booking (for customer-worker updates)
    socket.on('join_booking', (bookingId) => {
      socket.join(`booking_${bookingId}`);
      console.log(`[Socket] ${socket.id} joined booking_${bookingId}`);
    });

    // Join room for workers (to receive new job broadcasts)
    socket.on('join_workers', () => {
      socket.join('workers');
      console.log(`[Socket] ${socket.id} joined workers room`);
    });

    // Handle location updates from worker
    socket.on('update_location', (data) => {
      // data: { bookingId, lat, lng, workerId }
      io.to(`booking_${data.bookingId}`).emit('location_update', data);
    });

    // Handle real-time chat messages
    socket.on('send_message', (data) => {
      // data: { bookingId, sender, text, timestamp }
      io.to(`booking_${data.bookingId}`).emit('new_message', data);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
}

// Broadcast new job to all available workers
function broadcastNewJob(job) {
  if (io) {
    io.to('workers').emit('new_job', job);
  }
}

// Notify customer that worker accepted the job
function notifyJobAccepted(bookingId, workerDetails) {
  if (io) {
    io.to(`booking_${bookingId}`).emit('worker_accepted', workerDetails);
  }
}

// Notify customer of status changes (IN_PROGRESS, COMPLETED, etc.)
function notifyStatusUpdate(bookingId, status, extraData = {}) {
  if (io) {
    io.to(`booking_${bookingId}`).emit('status_update', { status, ...extraData });
  }
}

module.exports = { init, getIO, broadcastNewJob, notifyJobAccepted, notifyStatusUpdate };
