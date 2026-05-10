/**
 * Face Match Service — Simulated for Local Development
 * In production, replace with AWS Rekognition CompareFaces API.
 *
 * Usage:
 *   const { compareFaces } = require('./faceMatchService');
 *   const result = await compareFaces(selfieUrl, aadhaarFrontUrl);
 *   // result: { match: true, confidence: 95.2, message: '...' }
 */

// Configurable threshold (can be set via env)
const FACE_MATCH_THRESHOLD = parseFloat(process.env.FACE_MATCH_THRESHOLD || '80');

/**
 * Compare two face images.
 * @param {string} selfieImagePath  - Path/URL of the live selfie
 * @param {string} aadhaarImagePath - Path/URL of the Aadhaar photo
 * @returns {Object} { match: boolean, confidence: number, message: string }
 */
async function compareFaces(selfieImagePath, aadhaarImagePath) {
  // In production, this would call AWS Rekognition:
  // const { RekognitionClient, CompareFacesCommand } = require('@aws-sdk/client-rekognition');
  // const client = new RekognitionClient({ region: process.env.AWS_REGION });
  // ...

  // ── SIMULATED RESPONSE ──
  // For local development, simulate a successful face match.
  // Returns a random confidence between 85-99% to simulate realistic behavior.
  const simulatedConfidence = 85 + Math.random() * 14; // 85-99%
  const confidence = Math.round(simulatedConfidence * 10) / 10;
  const match = confidence >= FACE_MATCH_THRESHOLD;

  console.log(`[FaceMatch] Simulated comparison:`);
  console.log(`  Selfie:   ${selfieImagePath}`);
  console.log(`  Aadhaar:  ${aadhaarImagePath}`);
  console.log(`  Result:   ${match ? 'MATCH' : 'NO MATCH'} (${confidence}% confidence, threshold: ${FACE_MATCH_THRESHOLD}%)`);

  return {
    match,
    confidence,
    threshold: FACE_MATCH_THRESHOLD,
    message: match
      ? `Face match successful (${confidence}% confidence)`
      : `Face match failed (${confidence}% confidence, minimum ${FACE_MATCH_THRESHOLD}% required)`,
  };
}

module.exports = { compareFaces, FACE_MATCH_THRESHOLD };
