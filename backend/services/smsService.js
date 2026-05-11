/**
 * SMS Service — Sends OTP via AWS SNS
 * In development: falls back to console.log
 * In production: sends real SMS via AWS SNS
 */
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const SMS_ENABLED = process.env.SMS_ENABLED === 'true';
const AWS_REGION = process.env.AWS_REGION || 'ap-south-1';

let snsClient = null;
try {
  snsClient = new SNSClient({ region: AWS_REGION });
} catch (err) {
  console.error('[SMS] Failed to create SNS client:', err.message);
}

/**
 * Format phone number to E.164 format (+91XXXXXXXXXX)
 */
function formatPhone(phone) {
  if (!phone) return '';
  let cleaned = phone.toString().replace(/[\s\-\(\)\.]/g, '');
  // Already E.164
  if (cleaned.startsWith('+91') && cleaned.length === 13) return cleaned;
  if (cleaned.startsWith('+')) return cleaned;
  // Remove leading 0
  if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
  // Has country code without +
  if (cleaned.startsWith('91') && cleaned.length === 12) return '+' + cleaned;
  // 10-digit Indian number
  if (cleaned.length === 10) return '+91' + cleaned;
  // Fallback: assume Indian
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
  if (SMS_ENABLED && snsClient) {
    try {
      const params = {
        PhoneNumber: formattedPhone,
        Message: message,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: 'Transactional',
          },
        },
      };

      const result = await snsClient.send(new PublishCommand(params));
      console.log(`[SMS] ✅ Sent to ${formattedPhone} — MessageId: ${result.MessageId}`);
      return { success: true, messageId: result.MessageId };
    } catch (err) {
      console.error(`[SMS] ❌ Failed to send to ${formattedPhone}:`, err.message);
      console.error(`[SMS] Error Code: ${err.name}, Region: ${AWS_REGION}`);
      // Don't throw — OTP is already saved in DB, user can still check console in dev
      return { success: false, error: err.message };
    }
  }

  return { success: true, method: 'console' };
}

module.exports = { sendOTP, formatPhone };
