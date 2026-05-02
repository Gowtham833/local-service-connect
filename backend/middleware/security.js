const helmet = require('helmet');
const cors   = require('cors');
const { apiLimiter } = require('./rateLimiter');

/**
 * Apply all security middleware to the Express app.
 * CORS origin is read from config (no hardcoding).
 */
function securityMiddleware(app, config) {
  // Helmet sets secure HTTP headers
  app.use(helmet());

  // CORS — only allow configured frontend URL
  const allowedOrigins = [
    config.frontendUrl,
    'http://localhost:5000',
    'http://localhost:3000',
  ].filter(Boolean);

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy: origin ${origin} not allowed`));
      }
    },
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }));

  // General rate limit on all API routes
  app.use('/api/', apiLimiter);
}

module.exports = securityMiddleware;
