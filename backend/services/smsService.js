/**
 * SMS Service — Sends OTP via AWS SNS
 * In development: falls back to console.log
 * In production: sends real SMS via AWS SNS
 */
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const IS_PROD = process.env.NODE_ENV === 'production';
const SMS_ENABLED = process.env.SMS_ENABLED === 'true';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

const snsClient = new SNSClient({ region: AWS_REGION });

/**
 * Format phone number to E.164 format (+91XXXXXXXXXX)
 */
function formatPhone(phone) {
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('91') && cleaned.length === 12) return '+' + cleaned;
  if (cleaned.length === 10) return '+91' + cleaned;
  return '+91' + cleaned;
}

/**
 * Send OTP SMS to a phone number
 * @param {string} phone - Phone number (any Indian format)
 * @param {string} otp - 6-digit OTP code
 * @param {string} purpose - 'login' | 'registration' | 'reset'
 */
async function sendOTP(phone, otp, purpose = 'verification') {
  const formattedPhone = formatPhone(phone);
  const message = `[ServiConnect] Your ${purpose} OTP is: ${otp}. Valid for 5 minutes. Do not share this code.`;

  // Always log in development
  console.log(`\n===========================================`);
  console.log(`[OTP] Code for ${formattedPhone}: ${otp} (${purpose})`);
  console.log(`===========================================\n`);

  // Send real SMS only if enabled
  if (SMS_ENABLED) {
    try {
      const result = await snsClient.send(new PublishCommand({
        PhoneNumber: formattedPhone,
        Message: message,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: 'Transactional', // High-priority delivery
          },
          'AWS.SNS.SMS.SenderID': {
            DataType: 'String',
            StringValue: 'ServiCon', // Max 11 chars for sender ID
          },
        },
      }));
      console.log(`[SMS] ✅ Sent to ${formattedPhone} — MessageId: ${result.MessageId}`);
      return { success: true, messageId: result.MessageId };
    } catch (err) {
      console.error(`[SMS] ❌ Failed to send to ${formattedPhone}:`, err.message);
      // Don't throw — OTP is already saved in DB, user can still check console in dev
      return { success: false, error: err.message };
    }
  }

  return { success: true, method: 'console' };
}

module.exports = { sendOTP, formatPhone };
