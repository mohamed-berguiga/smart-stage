const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const { connect, clearDatabase, closeDatabase } = require('./testDb');

beforeAll(async () => {
  process.env.JWT_SECRET = 'test_secret_for_jest';
  await connect();
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await User.create({
      firstName: 'Admin',
      lastName: 'RH',
      email: 'rh@test.com',
      password: 'password123',
      role: 'RH',
    });
  });

  it('refuse un mauvais mot de passe', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'rh@test.com', password: 'mauvais_mdp' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Identifiants incorrects');
  });

  it('refuse un email inconnu', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'inconnu@test.com', password: 'password123' });

    expect(res.status).toBe(401);
  });

  it('accepte les bons identifiants et renvoie un token + le bon rôle', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'rh@test.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('RH');
    // Le mot de passe ne doit JAMAIS être renvoyé, même haché.
    expect(res.body.user.password).toBeUndefined();
  });

  it('refuse la connexion sur un compte désactivé', async () => {
    await User.findOneAndUpdate({ email: 'rh@test.com' }, { status: false });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'rh@test.com', password: 'password123' });

    expect(res.status).toBe(403);
  });
});

describe('POST /api/auth/forgot-password', () => {
  it('renvoie toujours le même message générique, que le compte existe ou non', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'inconnu@test.com' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/Si ce compte existe/);
  });
});

describe('Accès sans authentification', () => {
  it('refuse une route protégée sans token', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
  });

  it('refuse un token invalide', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', 'Bearer token_invalide');
    expect(res.status).toBe(401);
  });
});