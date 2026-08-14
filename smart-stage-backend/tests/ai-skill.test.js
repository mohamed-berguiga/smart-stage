jest.mock('../utils/askAI', () => ({
  askAI: jest.fn(),
}));

const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Department = require('../models/Department');
const Stage = require('../models/Stage');
const Skill = require('../models/Skill');
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

describe('POST /api/ai/suggest-skill-level', () => {
  it('refuse un RH (Encadrant uniquement)', async () => {
    await User.create({
      firstName: 'Admin', lastName: 'RH', email: 'rh@test.com', password: 'password123', role: 'RH',
    });
    const token = await loginAs('rh@test.com');
    const res = await request(app)
      .post('/api/ai/suggest-skill-level')
      .set('Authorization', `Bearer ${token}`)
      .send({ stagiaireId: '507f1f77bcf86cd799439011', skillId: '507f1f77bcf86cd799439012' });

    expect(res.status).toBe(403);
    expect(askAI).not.toHaveBeenCalled();
  });

  it("un encadrant ne peut pas évaluer un stagiaire qui n'est pas le sien", async () => {
    const dept = await Department.create({ name: 'Informatique' });
    const enc1 = await User.create({
      firstName: 'Ahmed', lastName: 'Ben Ali', email: 'ahmed@test.com',
      password: 'password123', role: 'ENCADRANT', department: dept._id,
    });
    const enc2 = await User.create({
      firstName: 'Sami', lastName: 'Karray', email: 'sami@test.com',
      password: 'password123', role: 'ENCADRANT', department: dept._id,
    });
    const stg2 = await User.create({
      firstName: 'Ali', lastName: 'Trabelsi', email: 'ali@test.com',
      password: 'password123', role: 'STAGIAIRE', department: dept._id,
    });
    await Stage.create({
      stagiaire: stg2._id, encadrant: enc2._id, department: dept._id,
      startDate: '2026-01-01', endDate: '2026-12-31',
    });
    const skill = await Skill.create({ name: 'React', department: dept._id });

    const token1 = await loginAs('ahmed@test.com');
    const res = await request(app)
      .post('/api/ai/suggest-skill-level')
      .set('Authorization', `Bearer ${token1}`)
      .send({ stagiaireId: stg2._id.toString(), skillId: skill._id.toString() });

    expect(res.status).toBe(403);
    expect(askAI).not.toHaveBeenCalled();
  });

  it("retourne la suggestion quand l'IA répond un JSON valide", async () => {
    askAI.mockResolvedValue('{"niveau": "Intermédiaire", "justification": "Bonne progression sur les tâches React."}');

    const dept = await Department.create({ name: 'Informatique' });
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
    const skill = await Skill.create({ name: 'React', department: dept._id });

    const token = await loginAs('ahmed@test.com');
    const res = await request(app)
      .post('/api/ai/suggest-skill-level')
      .set('Authorization', `Bearer ${token}`)
      .send({ stagiaireId: stg._id.toString(), skillId: skill._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.suggestedLevel).toBe('Intermédiaire');
    expect(res.body.reasoning).toMatch(/progression/);
  });

  it("renvoie une erreur propre si l'IA répond un niveau invalide", async () => {
    askAI.mockResolvedValue('{"niveau": "Expert", "justification": "..."}'); // "Expert" n'est pas une valeur autorisée

    const dept = await Department.create({ name: 'Informatique' });
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
    const skill = await Skill.create({ name: 'React', department: dept._id });

    const token = await loginAs('ahmed@test.com');
    const res = await request(app)
      .post('/api/ai/suggest-skill-level')
      .set('Authorization', `Bearer ${token}`)
      .send({ stagiaireId: stg._id.toString(), skillId: skill._id.toString() });

    expect(res.status).toBe(502);
  });
});