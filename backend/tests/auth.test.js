const request  = require('supertest');
const bcrypt   = require('bcryptjs');

// Mock AWS config loader to avoid AWS calls in tests
jest.mock('../config/aws', () => ({
  loadConfig: async () => ({
    port: 5001, jwtSecret: 'test_jwt_secret_for_unit_tests_only',
    jwtExpire: '1h', dbHost: 'localhost', dbPort: 5432,
    dbName: 'serviconnect_test', dbUser: 'postgres', dbPass: 'testpassword',
    frontendUrl: 'http://localhost:5001', awsRegion: 'us-east-1',
    bedrockRegion: 'us-east-1', bedrockModelId: 'test-model',
  }),
  getSecret: jest.fn(), getParameter: jest.fn(),
}));

// Mock Bedrock + Comprehend services (no real AWS calls)
jest.mock('../services/bedrockService',      () => ({ invokeClaudeModel: async () => '["worker-id-1"]' }));
jest.mock('../services/workerMatchingAI',    () => ({ matchWorkersForJob: async () => [] }));
jest.mock('../services/priceEstimationAI',   () => ({ estimatePrice: async () => ({ min: 300, max: 1000, suggested: 650, reasoning: 'test' }) }));
jest.mock('../services/chatbotService',      () => ({ getChatbotResponse: async () => 'Hello! How can I help?' }));
jest.mock('../services/reviewSentimentService', () => ({ analyzeSentiment: async () => ({ sentiment: 'POSITIVE', scores: {} }) }));

const { Sequelize } = require('sequelize');
const initModels   = require('../models/index');

let app, sequelize;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_jwt_secret_for_unit_tests_only';

  sequelize = new Sequelize({
    dialect: 'sqlite', storage: ':memory:', logging: false,
  });
  initModels(sequelize);
  global.appConfig = { jwtSecret: 'test_jwt_secret_for_unit_tests_only', jwtExpire: '1h', frontendUrl: '*' };
  await sequelize.sync({ force: true });

  const express      = require('express');
  const authRoutes   = require('../routes/auth');
  app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
});

afterAll(async () => { await sequelize.close(); });

describe('POST /api/auth/customer/register', () => {
  it('registers a new customer', async () => {
    const res = await request(app).post('/api/auth/customer/register').send({
      firstName: 'Test', lastName: 'User', phone: '9000000001',
      email: 'test@example.com', password: 'password123',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.role).toBe('customer');
  });

  it('rejects duplicate phone', async () => {
    await request(app).post('/api/auth/customer/register').send({
      firstName: 'Dup', phone: '9000000002', password: 'password123',
    });
    const res = await request(app).post('/api/auth/customer/register').send({
      firstName: 'Dup', phone: '9000000002', password: 'password123',
    });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('rejects missing required fields', async () => {
    const res = await request(app).post('/api/auth/customer/register').send({ firstName: 'No' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/customer/login', () => {
  beforeAll(async () => {
    const { db } = require('../models/index');
    await db.Customer.create({
      firstName: 'Login', phone: '9111111111',
      passwordHash: await bcrypt.hash('mypassword', 12),
    });
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/customer/login').send({
      phone: '9111111111', password: 'mypassword',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it('rejects wrong password', async () => {
    const res = await request(app).post('/api/auth/customer/login').send({
      phone: '9111111111', password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });

  it('rejects unknown phone', async () => {
    const res = await request(app).post('/api/auth/customer/login').send({
      phone: '0000000000', password: 'anything',
    });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/worker/register', () => {
  it('registers a new worker', async () => {
    const res = await request(app).post('/api/auth/worker/register').send({
      firstName: 'Worker', phone: '9222222222',
      skills: ['Plumbing'], password: 'workerpass123',
    });
    expect(res.status).toBe(201);
    expect(res.body.role).toBe('worker');
    expect(res.body.user.skills).toContain('Plumbing');
  });
});
