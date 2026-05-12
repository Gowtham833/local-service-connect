const { db } = require('../models/index');
const { receiveMessages, deleteMessage } = require('../services/sqsService');
const { broadcastNewJob } = require('../services/socketService');
const { sendJobNotificationSMS } = require('../services/smsService');

// SQS Queue URL from environment (can be dummy if USE_LOCAL_SQS=true)
const DB_WRITE_QUEUE_URL = process.env.DB_WRITE_QUEUE_URL || 'https://sqs.us-east-1.amazonaws.com/123456789012/ServiConnect-DB-Writes-Queue';

let isPolling = false;
let pollingInterval = null;

async function processMessage(message) {
  try {
    const body = JSON.parse(message.Body);

    if (body.type === 'CREATE_BOOKING') {
      const { bookingId, payload, customerData } = body;

      // Ensure the booking isn't already created (idempotency)
      const existing = await db.Booking.findByPk(bookingId);
      if (!existing) {
        // Save to Database
        const booking = await db.Booking.create({
          id: bookingId,
          ...payload
        });

        // Broadcast via WebSocket
        const bookingJson = booking.toJSON();
        broadcastNewJob({
          ...bookingJson,
          customerName: `${customerData.firstName} ${customerData.lastName}`,
        });

        console.log(`[DB Worker] Processed CREATE_BOOKING for booking ${bookingId}`);

        // ── Notify matched workers via SMS (async, non-blocking) ──
        if (payload.aiMatchedWorkerIds && payload.aiMatchedWorkerIds.length > 0) {
          const workerIdsToNotify = payload.aiMatchedWorkerIds.slice(0, 5);
          (async () => {
            try {
              const workers = await db.Worker.findAll({
                where: { id: workerIdsToNotify },
                attributes: ['id', 'phone', 'firstName'],
              });
              for (const w of workers) {
                if (w.phone) {
                  await sendJobNotificationSMS(w.phone, payload.service, payload.address || '');
                }
              }
              console.log(`[DB Worker] SMS alerts sent to ${workers.length} matched workers.`);
            } catch (smsErr) {
              console.error('[DB Worker] SMS notification error:', smsErr.message);
            }
          })();
        }
      } else {
        console.log(`[DB Worker] Booking ${bookingId} already exists. Skipping.`);
      }
    } else {
      console.warn(`[DB Worker] Unknown message type: ${body.type}`);
    }

    // Always delete the message after successful processing
    await deleteMessage(DB_WRITE_QUEUE_URL, message.ReceiptHandle);

  } catch (error) {
    console.error(`[DB Worker] Error processing message ${message.MessageId}:`, error);
    // Do not delete message so it returns to queue (DLQ logic can handle retries later)
  }
}

async function pollQueue() {
  if (!isPolling) return;
  try {
    const messages = await receiveMessages(DB_WRITE_QUEUE_URL);
    for (const msg of messages) {
      await processMessage(msg);
    }
  } catch (error) {
    console.error('[DB Worker] Error polling queue:', error);
  } finally {
    // Poll again after a short delay to avoid tight loop
    pollingInterval = setTimeout(pollQueue, 2000);
  }
}

function startDbWorker() {
  if (isPolling) return;
  console.log('[DB Worker] Starting SQS Consumer...');
  isPolling = true;
  pollQueue();
}

function stopDbWorker() {
  console.log('[DB Worker] Stopping SQS Consumer...');
  isPolling = false;
  if (pollingInterval) clearTimeout(pollingInterval);
}

module.exports = {
  startDbWorker,
  stopDbWorker,
};
