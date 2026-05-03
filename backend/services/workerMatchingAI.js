/**
 * AI Worker Matching Service
 * Uses AWS Bedrock Claude to rank available workers for a given job.
 */
const { invokeClaudeModel } = require('./bedrockService');

/**
 * Given a job description and a list of available workers,
 * returns a ranked list of worker IDs with reasoning.
 */
async function matchWorkersForJob(jobDescription, service, workers) {
  if (!workers || workers.length === 0) return [];

  const workerList = workers.map((w, i) =>
    `Worker ${i + 1}: ID=${w.id}, Name=${w.firstName} ${w.lastName}, ` +
    `Skills=[${w.skills.join(', ')}], Rating=${w.rating}, ` +
    `City=${w.city || 'Unknown'}, Experience=${w.experience || 'Not specified'}`
  ).join('\n');

  const prompt = `You are a smart worker matching system for ServiConnect, an on-demand home services platform in India.

A customer needs help with: "${service}"
Job description: "${jobDescription}"

Available workers:
${workerList}

Rank these workers from best to worst match for this job. 
Consider: skill match, rating, and experience.
Respond ONLY with a JSON array of worker IDs in ranked order, like:
["worker-id-1", "worker-id-2"]
No explanation, just the JSON array.`;

  try {
    const response = await invokeClaudeModel(prompt, { maxTokens: 512, temperature: 0.1 });
    const ids = JSON.parse(response.trim());
    return Array.isArray(ids) ? ids : [];
  } catch (err) {
    console.error('[AI] Worker matching failed:', err.message);
    // Fallback: sort by rating
    return workers.sort((a, b) => b.rating - a.rating).map(w => w.id);
  }
}

module.exports = { matchWorkersForJob };
