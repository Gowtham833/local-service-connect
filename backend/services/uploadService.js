/**
 * Upload Service — Local File Storage
 * Saves files to backend/uploads/ directory, structured for easy S3 migration.
 * Sub-folders: aadhaar/, selfies/, issues/, completions/
 */
const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// Ensure sub-directories exist
const SUB_DIRS = ['aadhaar', 'selfies', 'issues', 'completions', 'profiles'];
function ensureDirs() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  SUB_DIRS.forEach(d => {
    const dir = path.join(UPLOAD_DIR, d);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
}
ensureDirs();

/**
 * Save a base64-encoded image to disk.
 * @param {string} base64Data - The base64 string (with or without data URI prefix)
 * @param {string} subDir     - Sub-directory name (aadhaar, selfies, issues, completions)
 * @param {string} prefix     - Optional filename prefix (e.g., user ID)
 * @returns {string} The URL path to the saved file (e.g., /uploads/selfies/abc123.jpg)
 */
function saveBase64Image(base64Data, subDir, prefix = '') {
  ensureDirs();

  // Strip data URI prefix if present
  let data = base64Data;
  let ext = 'jpg';
  const match = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
  if (match) {
    ext = match[1] === 'jpeg' ? 'jpg' : match[1];
    data = match[2];
  }

  const filename = `${prefix}${prefix ? '_' : ''}${crypto.randomBytes(8).toString('hex')}_${Date.now()}.${ext}`;
  const filePath = path.join(UPLOAD_DIR, subDir, filename);

  fs.writeFileSync(filePath, Buffer.from(data, 'base64'));

  return `/uploads/${subDir}/${filename}`;
}

/**
 * Save a multer-uploaded file to the correct sub-directory.
 * @param {Object} file   - Multer file object
 * @param {string} subDir - Sub-directory name
 * @param {string} prefix - Optional filename prefix
 * @returns {string} The URL path to the saved file
 */
function saveUploadedFile(file, subDir, prefix = '') {
  ensureDirs();

  const ext = path.extname(file.originalname) || '.jpg';
  const filename = `${prefix}${prefix ? '_' : ''}${crypto.randomBytes(8).toString('hex')}_${Date.now()}${ext}`;
  const filePath = path.join(UPLOAD_DIR, subDir, filename);

  fs.renameSync(file.path, filePath);

  return `/uploads/${subDir}/${filename}`;
}

/**
 * Save multiple base64 images.
 * @param {string[]} base64Array - Array of base64 image strings
 * @param {string}   subDir      - Sub-directory name
 * @param {string}   prefix      - Optional filename prefix
 * @returns {string[]} Array of URL paths
 */
function saveMultipleBase64Images(base64Array, subDir, prefix = '') {
  if (!Array.isArray(base64Array)) return [];
  return base64Array.map(img => saveBase64Image(img, subDir, prefix));
}

/**
 * Mask an Aadhaar number: 1234-5678-9012 → XXXX-XXXX-9012
 */
function maskAadhaar(number) {
  if (!number) return '';
  const clean = number.replace(/\D/g, '');
  if (clean.length < 4) return 'XXXX-XXXX-XXXX';
  const last4 = clean.slice(-4);
  return `XXXX-XXXX-${last4}`;
}

module.exports = {
  saveBase64Image,
  saveUploadedFile,
  saveMultipleBase64Images,
  maskAadhaar,
  UPLOAD_DIR,
};
