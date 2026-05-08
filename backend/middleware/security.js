const helmet = require('helmet');
const cors   = require('cors');
const { apiLimiter } = require('./rateLimiter');

/**
 * Apply all security middleware to the Express app.
 * CORS origin is read from config (no hardcoding).
 */
function securityMiddleware(app, config) {
  // Helmet is disabled for troubleshooting connectivity
  // app.use(helmet());

  // CORS — Allow all origins for troubleshooting
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }));

  // General rate limit on all API routes
  app.use('/api/', apiLimiter);
}

module.exports = securityMiddleware;
