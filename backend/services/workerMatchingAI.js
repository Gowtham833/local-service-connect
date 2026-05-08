/**
 * AI Worker Matching Service
 * Uses AWS Bedrock Claude to rank available workers for a given job.
 */
const { invokeClaudeModel } = require('./bedrockService');

/**
 * Given a job description and a list of available workers,
 * returns a ranked list of worker IDs with reasoning.
 */
function calculateWorkerScore(w, distance = 0) {
  let score = 0;
  
  // 1. Rating (0-5) -> normalized to 1.0 (40%)
  score += (w.rating / 5) * 0.4;

  // 2. Completion Rate (0-1) (25%)
  score += (w.completionRate || 1.0) * 0.25;

  // 3. Response Time (lower is better, 0-60 mins range) (15%)
  const respScore = Math.max(0, (60 - (w.responseTime || 5)) / 60);
  score += respScore * 0.15;

  // 4. Distance (inverse relationship, max 50km) (10%)
  const distScore = Math.max(0, (50 - (distance || 0)) / 50);
  score += distScore * 0.1;

  // 5. Baseline for sentiment/experience (10%)
  score += 0.1; 

  return score;
}

/**
 * Given a job description and a list of available workers,
 * returns a ranked list of worker IDs with reasoning.
 */
async function matchWorkersForJob(jobDescription, service, workers) {
  if (!workers || workers.length === 0) return [];

  try {
    // Scoring and Ranking
    const scored = workers.map(w => ({
      id: w.id,
      score: calculateWorkerScore(w)
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.map(s => s.id);
  } catch (err) {
    console.error('[AI] Worker matching failed:', err.message);
    return workers.sort((a, b) => b.rating - a.rating).map(w => w.id);
  }
}

module.exports = { matchWorkersForJob, calculateWorkerScore };
