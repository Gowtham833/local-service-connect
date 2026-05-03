/**
 * AI Price Estimation Service
 * Uses AWS Bedrock Claude to suggest a fair price for a service job.
 */
const { invokeClaudeModel } = require('./bedrockService');

/**
 * Estimate fair price range for a service request.
 * Returns { min, max, suggested, reasoning }
 */
async function estimatePrice(service, description, city) {
  const prompt = `You are a pricing expert for ServiConnect, an on-demand home services platform in India (cities like Hyderabad, Chennai, Bangalore, Mumbai).

Service Type: ${service}
Job Description: ${description || 'Not provided'}
City: ${city || 'Hyderabad'}

Based on typical rates in Indian metro cities, provide a fair price estimate in Indian Rupees (₹).
Respond ONLY with a JSON object like:
{"min": 400, "max": 900, "suggested": 650, "reasoning": "Brief one-line reason"}
No extra text, just the JSON.`;

  try {
    const response = await invokeClaudeModel(prompt, { maxTokens: 256, temperature: 0.2 });
    const result = JSON.parse(response.trim());
    return {
      min:       result.min       || 300,
      max:       result.max       || 1500,
      suggested: result.suggested || 700,
      reasoning: result.reasoning || 'Based on standard rates',
    };
  } catch (err) {
    console.error('[AI] Price estimation failed:', err.message);
    return { min: 300, max: 1500, suggested: 700, reasoning: 'Standard estimate' };
  }
}

module.exports = { estimatePrice };
