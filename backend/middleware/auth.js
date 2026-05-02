const jwt = require('jsonwebtoken');

// ── Sign Token ────────────────────────────────────────────────
const signToken = (id, role) => {
  const secret = global.appConfig?.jwtSecret || process.env.JWT_SECRET;
  const expire = global.appConfig?.jwtExpire  || process.env.JWT_EXPIRE || '7d';
  if (!secret) throw new Error('JWT_SECRET not configured');
  return jwt.sign({ id, role }, secret, { expiresIn: expire });
};

// ── Protect: Verify JWT ───────────────────────────────────────
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authorized. Please login.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const secret = global.appConfig?.jwtSecret || process.env.JWT_SECRET;
    req.user = jwt.verify(token, secret);
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

// ── Authorize: Role-based access ─────────────────────────────
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: `Role '${req.user.role}' is not permitted.` });
  }
  next();
};

module.exports = { protect, authorize, signToken };
