/**
 * Review Sentiment Analysis Service
 * Uses Amazon Comprehend to analyze sentiment of customer reviews.
 */
const { ComprehendClient, DetectSentimentCommand } = require('@aws-sdk/client-comprehend');

function getComprehendClient() {
  const region = global.appConfig?.awsRegion || process.env.AWS_REGION || 'us-east-1';
  return new ComprehendClient({ region });
}

/**
 * Analyze sentiment of a review comment.
 * @param {string} text - Review text
 * @returns {{ sentiment: string, scores: object }}
 */
async function analyzeSentiment(text) {
  if (!text || text.trim().length < 5) {
    return { sentiment: 'NEUTRAL', scores: {} };
  }

  try {
    const client = getComprehendClient();
    const command = new DetectSentimentCommand({ Text: text, LanguageCode: 'en' });
    const response = await client.send(command);

    return {
      sentiment: response.Sentiment,
      scores: {
        positive: Math.round((response.SentimentScore?.Positive || 0) * 100) / 100,
        negative: Math.round((response.SentimentScore?.Negative || 0) * 100) / 100,
        neutral:  Math.round((response.SentimentScore?.Neutral  || 0) * 100) / 100,
        mixed:    Math.round((response.SentimentScore?.Mixed    || 0) * 100) / 100,
      },
    };
  } catch (err) {
    console.error('[AI] Sentiment analysis failed:', err.message);
    return { sentiment: 'NEUTRAL', scores: {} };
  }
}

module.exports = { analyzeSentiment };
