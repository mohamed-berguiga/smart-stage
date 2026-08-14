jest.mock('../utils/askAI', () => ({
  askAI: jest.fn().mockResolvedValue("Réponse simulée de l'IA"),
}));

const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Department = require('../models/Department');
const Stage = require('../models/Stage');
const Task = require('../models/Task');
const { connect, clearDatabase, closeDatabase } = require('./testDb');
const { askAI } = require('../utils/askAI');

async function loginAs(email) {
  const res = await request(app).post('/api/auth/login').send({ email, password: 'password123' });
  return res.body.token;
}

beforeAll(async () => {
  process.env.JWT_SECRET = 'test_secret_for_jest';
  await connect();
});
afterEach(async () => {
  await clearDatabase();
  jest.clearAllMocks();
});
afterAll(async () => {
  await closeDatabase();
});

describe('POST /api/ai/ask-data', () => {
  it('refuse un encadrant (RH uniquement)', async () => {
    const dept = await Department.create({ name: 'Informatique' });
    await User.create({
      firstName: 'Admin', lastName: 'RH', email: 'rh@test.com', password: 'password123', role: 'RH',
    });
    await User.create({
      firstName: 'Ahmed', lastName: 'Ben Ali', email: 'ahmed@test.com',
      password: 'password123', role: 'ENCADRANT', department: dept._id,
    });

    const token = await loginAs('ahmed@test.com');
    const res = await request(app)
      .post('/api/ai/ask-data')
      .set('Authorization', `Bearer ${token}`)
      .send({ question: 'Combien de stagiaires ?' });

    expect(res.status).toBe(403);
    expect(askAI).not.toHaveBeenCalled();
  });

  it('refuse une question vide', async () => {
    await User.create({
      firstName: 'Admin', lastName: 'RH', email: 'rh@test.com', password: 'password123', role: 'RH',
    });
    const token = await loginAs('rh@test.com');
    const res = await request(app)
      .post('/api/ai/ask-data')
      .set('Authorization', `Bearer ${token}`)
      .send({ question: '' });

    expect(res.status).toBe(400);
  });

  it('le RH obtient une réponse construite à partir des vraies données de la base', async () => {
    const dept = await Department.create({ name: 'Informatique' });
    await User.create({
      firstName: 'Admin', lastName: 'RH', email: 'rh@test.com', password: 'password123', role: 'RH',
    });
    const enc = await User.create({
      firstName: 'Ahmed', lastName: 'Ben Ali', email: 'ahmed@test.com',
      password: 'password123', role: 'ENCADRANT', department: dept._id,
    });
    const stg = await User.create({
      firstName: 'Mohamed', lastName: 'Berguiga', email: 'mohamed@test.com',
      password: 'password123', role: 'STAGIAIRE', department: dept._id,
    });
    await Stage.create({
      stagiaire: stg._id, encadrant: enc._id, department: dept._id,
      startDate: '2026-01-01', endDate: '2026-12-31',
    });
    await Task.create({
      title: 'T1', type: 'Test', status: 'Terminée',
      assignedTo: stg._id, creator: enc._id, isPersonal: false,
    });

    const token = await loginAs('rh@test.com');
    const res = await request(app)
      .post('/api/ai/ask-data')
      .set('Authorization', `Bearer ${token}`)
      .send({ question: 'Combien de stagiaires ?' });

    expect(res.status).toBe(200);
    expect(res.body.answer).toBe("Réponse simulée de l'IA");
    expect(res.body.dataPointCount).toBe(1);

    // Vérifie que le PROMPT envoyé à l'IA contient bien les vraies données —
    // c'est la garantie que l'IA répond à partir de faits réels, pas d'invention.
    expect(askAI).toHaveBeenCalledTimes(1);
    const promptSent = askAI.mock.calls[0][0];
    expect(promptSent).toContain('Mohamed Berguiga');
    expect(promptSent).toContain('Informatique');
    expect(promptSent).toContain('Ahmed Ben Ali');
  });
});