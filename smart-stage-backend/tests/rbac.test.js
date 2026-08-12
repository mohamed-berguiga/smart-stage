const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Department = require('../models/Department');
const Stage = require('../models/Stage');
const { connect, clearDatabase, closeDatabase } = require('./testDb');

let dept;
let rh, encadrant1, encadrant2, stagiaire1, stagiaire2;
let tokenRh, tokenEnc1, tokenEnc2, tokenStg1, tokenStg2;

async function loginAs(email) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'password123' });
  return res.body.token;
}

beforeAll(async () => {
  process.env.JWT_SECRET = 'test_secret_for_jest';
  await connect();
});

afterAll(async () => {
  await closeDatabase();
});

// Rejoue le même scénario avant CHAQUE test : deux encadrants, chacun avec
// un stagiaire affecté, pour vérifier qu'ils ne voient jamais les données
// l'un de l'autre.
beforeEach(async () => {
  await clearDatabase();

  dept = await Department.create({ name: 'Informatique' });

  rh = await User.create({
    firstName: 'Admin', lastName: 'RH', email: 'rh@test.com',
    password: 'password123', role: 'RH',
  });
  encadrant1 = await User.create({
    firstName: 'Ahmed', lastName: 'Ben Ali', email: 'ahmed@test.com',
    password: 'password123', role: 'ENCADRANT', department: dept._id,
  });
  encadrant2 = await User.create({
    firstName: 'Sami', lastName: 'Karray', email: 'sami@test.com',
    password: 'password123', role: 'ENCADRANT', department: dept._id,
  });
  stagiaire1 = await User.create({
    firstName: 'Mohamed', lastName: 'Berguiga', email: 'mohamed@test.com',
    password: 'password123', role: 'STAGIAIRE', department: dept._id,
  });
  stagiaire2 = await User.create({
    firstName: 'Ali', lastName: 'Trabelsi', email: 'ali@test.com',
    password: 'password123', role: 'STAGIAIRE', department: dept._id,
  });

  await Stage.create({
    stagiaire: stagiaire1._id, encadrant: encadrant1._id, department: dept._id,
    startDate: '2026-01-01', endDate: '2026-12-31',
  });
  await Stage.create({
    stagiaire: stagiaire2._id, encadrant: encadrant2._id, department: dept._id,
    startDate: '2026-01-01', endDate: '2026-12-31',
  });

  tokenRh = await loginAs('rh@test.com');
  tokenEnc1 = await loginAs('ahmed@test.com');
  tokenEnc2 = await loginAs('sami@test.com');
  tokenStg1 = await loginAs('mohamed@test.com');
  tokenStg2 = await loginAs('ali@test.com');
});

describe('Cloisonnement des stagiaires par encadrant', () => {
  it("un encadrant ne voit QUE ses propres stagiaires via /users/my-stagiaires", async () => {
    const res = await request(app)
      .get('/api/users/my-stagiaires')
      .set('Authorization', `Bearer ${tokenEnc1}`);

    expect(res.status).toBe(200);
    const emails = res.body.map((s) => s.email);
    expect(emails).toContain('mohamed@test.com');
    expect(emails).not.toContain('ali@test.com');
  });
});

describe('Cloisonnement des tâches', () => {
  it("un stagiaire ne voit jamais les tâches d'un autre stagiaire", async () => {
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenEnc1}`)
      .send({ title: 'Tâche pour Mohamed', type: 'Développement', assignedTo: stagiaire1._id.toString() });
    expect(createRes.status).toBe(201);

    const res1 = await request(app).get('/api/tasks').set('Authorization', `Bearer ${tokenStg1}`);
    expect(res1.body.some((t) => t.title === 'Tâche pour Mohamed')).toBe(true);

    const res2 = await request(app).get('/api/tasks').set('Authorization', `Bearer ${tokenStg2}`);
    expect(res2.body.some((t) => t.title === 'Tâche pour Mohamed')).toBe(false);
  });

  it("un encadrant ne peut pas créer de tâche pour le stagiaire d'un autre encadrant", async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenEnc1}`)
      .send({ title: 'Intrusion', type: 'Test', assignedTo: stagiaire2._id.toString() });

    expect(res.status).toBe(403);
  });

  it('le RH voit toutes les tâches professionnelles, tous encadrants confondus', async () => {
    await request(app).post('/api/tasks').set('Authorization', `Bearer ${tokenEnc1}`)
      .send({ title: 'T1', type: 'Test', assignedTo: stagiaire1._id.toString() });
    await request(app).post('/api/tasks').set('Authorization', `Bearer ${tokenEnc2}`)
      .send({ title: 'T2', type: 'Test', assignedTo: stagiaire2._id.toString() });

    const res = await request(app).get('/api/tasks').set('Authorization', `Bearer ${tokenRh}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  it('un stagiaire ne peut pas créer de tâche professionnelle', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenStg1}`)
      .send({ title: 'Tentative', type: 'Test', assignedTo: stagiaire1._id.toString(), isPersonal: false });

    expect(res.status).toBe(403);
  });

  it('un stagiaire peut créer une tâche personnelle', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenStg1}`)
      .send({
        title: 'Réviser MongoDB', type: 'Personnel',
        isPersonal: true, assignedTo: stagiaire1._id.toString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.isPersonal).toBe(true);
  });
});

describe('Accès réservé au RH', () => {
  it('un encadrant ne peut pas créer de compte utilisateur', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${tokenEnc1}`)
      .send({ firstName: 'X', lastName: 'Y', email: 'x@test.com', password: 'password123', role: 'STAGIAIRE' });

    expect(res.status).toBe(403);
  });

  it('un RH peut créer un compte', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${tokenRh}`)
      .send({ firstName: 'X', lastName: 'Y', email: 'x@test.com', password: 'password123', role: 'STAGIAIRE' });

    expect(res.status).toBe(201);
  });
});