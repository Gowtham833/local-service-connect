const { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } = require('@aws-sdk/client-sqs');

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const USE_LOCAL_SQS = process.env.USE_LOCAL_SQS === 'true' || process.env.NODE_ENV !== 'production';

let sqsClient = null;
if (!USE_LOCAL_SQS) {
  sqsClient = new SQSClient({ region: AWS_REGION });
}

// Local in-memory queue fallback for development
const localQueue = [];

/**
 * Sends a message to the SQS Queue.
 * @param {string} queueUrl - The SQS Queue URL
 * @param {object} messageBody - The JSON object to send
 */
async function sendMessage(queueUrl, messageBody) {
  if (USE_LOCAL_SQS) {
    const messageId = require('crypto').randomUUID();
    localQueue.push({
      MessageId: messageId,
      ReceiptHandle: `local-receipt-${messageId}`,
      Body: JSON.stringify(messageBody),
    });
    console.log(`[SQS:Local] Sent message ${messageId} to ${queueUrl}`);
    return messageId;
  }

  try {
    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(messageBody),
    });
    const result = await sqsClient.send(command);
    console.log(`[SQS] Sent message ${result.MessageId}`);
    return result.MessageId;
  } catch (error) {
    console.error('[SQS] Error sending message:', error);
    throw error;
  }
}

/**
 * Receives messages from the SQS Queue.
 * @param {string} queueUrl - The SQS Queue URL
 * @returns {Array} Array of message objects
 */
async function receiveMessages(queueUrl) {
  if (USE_LOCAL_SQS) {
    // In-memory queue logic: peek at first message
    if (localQueue.length > 0) {
      // Return a copy so we don't accidentally mutate the "in-flight" message
      return [Object.assign({}, localQueue[0])];
    }
    return [];
  }

  try {
    const command = new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 5, // Long polling
    });
    const result = await sqsClient.send(command);
    return result.Messages || [];
  } catch (error) {
    console.error('[SQS] Error receiving messages:', error);
    return [];
  }
}

/**
 * Deletes a message from the SQS Queue.
 * @param {string} queueUrl - The SQS Queue URL
 * @param {string} receiptHandle - The receipt handle from the received message
 */
async function deleteMessage(queueUrl, receiptHandle) {
  if (USE_LOCAL_SQS) {
    const idx = localQueue.findIndex((m) => m.ReceiptHandle === receiptHandle);
    if (idx !== -1) {
      localQueue.splice(idx, 1);
      console.log(`[SQS:Local] Deleted message ${receiptHandle}`);
    }
    return;
  }

  try {
    const command = new DeleteMessageCommand({
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle,
    });
    await sqsClient.send(command);
    console.log(`[SQS] Deleted message ${receiptHandle}`);
  } catch (error) {
    console.error('[SQS] Error deleting message:', error);
  }
}

module.exports = {
  sendMessage,
  receiveMessages,
  deleteMessage,
};
