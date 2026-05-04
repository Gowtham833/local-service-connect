/**
 * AI Chatbot Service — Customer Support
 * Uses AWS Bedrock Claude to answer customer queries.
 */
const { invokeClaudeModel } = require('./bedrockService');

const SYSTEM_CONTEXT = `You are ServiBot, a friendly customer support assistant for ServiConnect — an on-demand home services platform in India.
You help customers with:
- Booking services (plumbing, electrical, cleaning, AC repair, carpentry, painting)
- Checking booking status
- Understanding pricing (₹300–₹1500 typical range)
- Cancellation and rescheduling policies
- How to rate workers
- General platform questions

Keep responses concise, helpful, and in a friendly tone.
If asked something outside your scope, say: "Please contact our support team at support@serviconnect.in"`;

/**
 * Get a chatbot response for a customer message.
 * @param {string} message - Customer's message
 * @param {Array}  history - Previous messages [{role, content}]
 */
async function getChatbotResponse(message, history = []) {
  const conversationHistory = history.slice(-6); // Last 6 messages for context
  const prompt = `${SYSTEM_CONTEXT}

Conversation so far:
${conversationHistory.map(m => `${m.role === 'user' ? 'Customer' : 'ServiBot'}: ${m.content}`).join('\n')}

Customer: ${message}
ServiBot:`;

  try {
    const response = await invokeClaudeModel(prompt, { maxTokens: 512, temperature: 0.5 });
    return response.trim();
  } catch (err) {
    console.error('[AI] Chatbot failed:', err.message);
    return 'Sorry, I am having trouble right now. Please try again or contact support@serviconnect.in';
  }
}

module.exports = { getChatbotResponse };
