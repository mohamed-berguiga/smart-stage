/**
 * Script de seed : crée un jeu de données de test dans MongoDB.
 * Usage : node seed.js
 *
 * Crée :
 *  - 2 départements (Informatique, Marketing)
 *  - 1 compte RH, 2 encadrants, 3 stagiaires
 *  - 3 affectations (Stage)
 *  - quelques tâches et compétences
 *
 * ⚠️ Ce script vide les collections concernées avant de les repeupler.
 */
require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');
const Department = require('./models/Department');
const Stage = require('./models/Stage');
const Task = require('./models/Task');
const Skill = require('./models/Skill');

const run = async () => {
  await connectDB();

  console.log('Nettoyage des collections...');
  await Promise.all([
    User.deleteMany({}),
    Department.deleteMany({}),
    Stage.deleteMany({}),
    Task.deleteMany({}),
    Skill.deleteMany({}),
  ]);

  console.log('Création des départements...');
  const [deptInfo, deptMarketing] = await Department.create([
    { name: 'Informatique' },
    { name: 'Marketing' },
  ]);

  console.log('Création des utilisateurs...');
  const rh = await User.create({
    firstName: 'Admin', lastName: 'RH', email: 'rh@smartstage.com',
    password: 'password123', role: 'RH', phone: '+216 20 000 000',
  });

  const encadrant1 = await User.create({
    firstName: 'Ahmed', lastName: 'Ben Ali', email: 'ahmed@smartstage.com',
    password: 'password123', role: 'ENCADRANT', department: deptInfo._id,
  });

  const encadrant2 = await User.create({
    firstName: 'Sami', lastName: 'Karray', email: 'sami@smartstage.com',
    password: 'password123', role: 'ENCADRANT', department: deptMarketing._id,
  });

  const stagiaire1 = await User.create({
    firstName: 'Mohamed', lastName: 'Berguiga', email: 'mohamed@smartstage.com',
    password: 'password123', role: 'STAGIAIRE', department: deptInfo._id,
    startDate: '2026-07-01', endDate: '2026-09-30',
  });

  const stagiaire2 = await User.create({
    firstName: 'Ali', lastName: 'Trabelsi', email: 'ali@smartstage.com',
    password: 'password123', role: 'STAGIAIRE', department: deptInfo._id,
    startDate: '2026-07-01', endDate: '2026-09-30',
  });

  const stagiaire3 = await User.create({
    firstName: 'Sarah', lastName: 'Lahmar', email: 'sarah@smartstage.com',
    password: 'password123', role: 'STAGIAIRE', department: deptMarketing._id,
    startDate: '2026-07-01', endDate: '2026-09-30',
  });

  console.log('Création des affectations (Stage)...');
  await Stage.create([
    { stagiaire: stagiaire1._id, encadrant: encadrant1._id, department: deptInfo._id, startDate: '2026-07-01', endDate: '2026-09-30' },
    { stagiaire: stagiaire2._id, encadrant: encadrant1._id, department: deptInfo._id, startDate: '2026-07-01', endDate: '2026-09-30' },
    { stagiaire: stagiaire3._id, encadrant: encadrant2._id, department: deptMarketing._id, startDate: '2026-07-01', endDate: '2026-09-30' },
  ]);

  console.log('Création de quelques tâches...');
  await Task.create([
    {
      title: 'Développer la page Login', type: 'Développement', priority: 'Haute',
      status: 'Terminée', creator: encadrant1._id, assignedTo: stagiaire1._id,
      dueDate: '2026-08-05',
    },
    {
      title: 'Développer le Dashboard', type: 'Développement', priority: 'Moyenne',
      status: 'En cours', creator: encadrant1._id, assignedTo: stagiaire1._id,
      dueDate: '2026-08-20',
    },
    {
      title: 'Tester l\'API', type: 'Test', priority: 'Urgente',
      status: 'À faire', creator: encadrant1._id, assignedTo: stagiaire2._id,
      dueDate: '2026-08-15',
    },
  ]);

  console.log('Création du référentiel de compétences...');
  await Skill.create([
    { name: 'Maîtrise de React', description: 'Composants, hooks, state management', department: deptInfo._id },
    { name: 'Autonomie', description: 'Capacité à travailler sans supervision constante', department: deptInfo._id },
    { name: 'Communication', description: 'Clarté à l\'oral et à l\'écrit', department: deptMarketing._id },
  ]);

  console.log('\n✅ Seed terminé avec succès.');
  console.log('\nComptes de test (mot de passe pour tous : password123) :');
  console.log('  RH        -> rh@smartstage.com');
  console.log('  Encadrant -> ahmed@smartstage.com (département Informatique)');
  console.log('  Encadrant -> sami@smartstage.com (département Marketing)');
  console.log('  Stagiaire -> mohamed@smartstage.com');
  console.log('  Stagiaire -> ali@smartstage.com');
  console.log('  Stagiaire -> sarah@smartstage.com');

  process.exit(0);
};

run().catch((err) => {
  console.error('Erreur durant le seed :', err);
  process.exit(1);
});
