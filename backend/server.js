/**
 * ServiConnect Backend — Entry Point
 * All config loaded from AWS Secrets Manager / Parameter Store (production)
 * or .env file (development). Zero hardcoded values.
 */
require('dotenv').config();

const express  = require('express');
const path     = require('path');
const morgan   = require('morgan');

const { loadConfig }   = require('./config/aws');
const { getSequelize } = require('./config/database');
const initModels       = require('./models/index');
const securityMiddleware = require('./middleware/security');
const errorHandler     = require('./middleware/errorHandler');

const authRoutes     = require('./routes/auth');
const customerRoutes = require('./routes/customer');
const workerRoutes   = require('./routes/worker');
const aiRoutes       = require('./routes/ai');
const adminRoutes    = require('./routes/admin');

async function startServer() {
  // ── Load all config (env vars or AWS) ────────────────────────
  const config = await loadConfig();
  // Attach config globally so routes can access it
  global.appConfig = config;

  // ── Init Sequelize + Sync Models ─────────────────────────────
  const sequelize = getSequelize(config);
  initModels(sequelize);

  try {
    await sequelize.authenticate();
    console.log('[DB] PostgreSQL connection established');
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('[DB] Models synced (development mode)');
    }
  } catch (err) {
    console.error('[DB] ❌ Connection failed!');
    console.error(err);
    process.exit(1);
  }

  const app = express();

  // ── Trust Nginx Reverse Proxy ─────────────────────────────────
  app.set('trust proxy', 1);

  // ── Security + Logging Middleware ─────────────────────────────
  securityMiddleware(app, config);
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use(express.json({ limit: '15mb' }));  // Increased for base64 image uploads
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // ── Serve Frontend Static Files ───────────────────────────────
  app.use(express.static(path.join(__dirname, '../frontend/public')));

  // ── Serve Uploaded Files (local dev — replace with S3 in prod)
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // ── API Routes ────────────────────────────────────────────────
  app.use('/api/auth',     authRoutes);
  app.use('/api/customer', customerRoutes);
  app.use('/api/worker',   workerRoutes);
  app.use('/api/ai',       aiRoutes);
  app.use('/api/admin',    adminRoutes);

  // ── Health Check ──────────────────────────────────────────────
  app.get('/api/health', async (req, res) => {
    try {
      await sequelize.authenticate();
      res.json({ success: true, message: 'ServiConnect API running', db: 'connected', time: new Date() });
    } catch {
      res.status(503).json({ success: false, message: 'DB not connected' });
    }
  });

  // ── Frontend catch-all ────────────────────────────────────────
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
  });

  // ── Global Error Handler ──────────────────────────────────────
  app.use(errorHandler);

  const PORT = config.port;
  const http = require('http');
  const server = http.createServer(app);

  // ── Init Socket.io ───────────────────────────────────────────
  const { init: initSocket } = require('./services/socketService');
  initSocket(server);

  server.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════╗
║      ServiConnect API Server v2.0        ║
║      Running on http://localhost:${PORT}    ║
║      Environment: ${(process.env.NODE_ENV || 'development').padEnd(13)}     ║
╚══════════════════════════════════════════╝
    `);
    
    // Start the SQS consumer worker
    const { startDbWorker } = require('./workers/dbWorker');
    startDbWorker();
  });

  return server;
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
