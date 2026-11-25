jest.mock('../utils/askAI', () => ({
  askAI: jest.fn().mockResolvedValue("Réponse simulée de l'IA"),
}));

const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Department = require('../models/Department');
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

describe('POST /api/ai/faq-chat', () => {
  it("transmet le rôle de l'utilisateur et la base de connaissance au modèle", async () => {
    await User.create({
      firstName: 'Sami', lastName: 'Trabelsi', email: 'sami@test.com',
      password: 'password123', role: 'STAGIAIRE',
    });
    const token = await loginAs('sami@test.com');

    const res = await request(app)
      .post('/api/ai/faq-chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Comment ajouter une entrée de journal ?' });

    expect(res.status).toBe(200);
    expect(res.body.answer).toBe("Réponse simulée de l'IA");

    // Le chatbot ne doit répondre qu'à partir de la base de connaissance de l'application,
    // en sachant quel rôle lui parle.
    const [message, systemInstruction] = askAI.mock.calls[0];
    expect(message).toBe('Comment ajouter une entrée de journal ?');
    expect(systemInstruction).toContain('STAGIAIRE');
    expect(systemInstruction).toContain('JOURNAL DE STAGE');
  });
});

describe('POST /api/ai/generate-task-description', () => {
  it("refuse un titre vide sans appeler l'IA", async () => {
    const dept = await Department.create({ name: 'Informatique' });
    await User.create({
      firstName: 'Ahmed', lastName: 'Ben Ali', email: 'ahmed@test.com',
      password: 'password123', role: 'ENCADRANT', department: dept._id,
    });
    const token = await loginAs('ahmed@test.com');

    const res = await request(app)
      .post('/api/ai/generate-task-description')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '   ' });

    expect(res.status).toBe(400);
    expect(askAI).not.toHaveBeenCalled();
  });
});

describe('POST /api/ai/summarize-week/:stagiaireId', () => {
  it("un stagiaire ne peut pas générer le résumé d'un autre stagiaire", async () => {
    const moi = await User.create({
      firstName: 'Sami', lastName: 'Trabelsi', email: 'sami@test.com',
      password: 'password123', role: 'STAGIAIRE',
    });
    const autre = await User.create({
      firstName: 'Ines', lastName: 'Karray', email: 'ines@test.com',
      password: 'password123', role: 'STAGIAIRE',
    });
    const token = await loginAs('sami@test.com');

    const res = await request(app)
      .post(`/api/ai/summarize-week/${autre._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(askAI).not.toHaveBeenCalled();
    expect(moi._id.toString()).not.toBe(autre._id.toString());
  });
});
