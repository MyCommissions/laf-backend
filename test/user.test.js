// __tests__/auth.test.js
jest.setTimeout(30000); // <-- Increase timeout

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/user');

let mongoServer;
let adminToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    instance: { port: 0 },
    binary: { version: '6.0.6' }
  });

  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Create admin
  await User.create({
    firstname: 'Admin',
    lastname: 'User',
    email: 'admin@test.com',
    password: 'Admin123',
    roleId: 1
  });

  // Login admin
  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@test.com', password: 'Admin123' });

  adminToken = loginRes.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

afterEach(async () => {
  await User.deleteMany();
});

describe('Auth API', () => {
  describe('POST /api/v1/auth/admin/create-account', () => {
    it('should create an admin account', async () => {
      const res = await request(app)
        .post('/api/v1/auth/admin/create-account')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstname: 'test55',
          lastname: 'test55',
          email: 'test55@example.com',
          roleId: 2,
          password: 'adasdsasdasd'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should log in a user', async () => {
      const user = await User.create({
        firstname: 'User',
        lastname: 'Test',
        email: '12345@test.com',
        password: 'password123',
        roleId: 2
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: 'password123' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          firstname: 'test',
          lastname: 'test',
          email: 'test@gmail.com',
          password: 'Test123'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
    });
  });
});
