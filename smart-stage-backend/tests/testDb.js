const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

/**
 * Démarre une base MongoDB temporaire en mémoire et connecte Mongoose dessus.
 * Aucune donnée réelle n'est jamais touchée — chaque exécution de tests
 * repart d'une base totalement vide.
 */
async function connect() {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
}

/** Vide toutes les collections (appelé entre chaque test). */
async function clearDatabase() {
  const { collections } = mongoose.connection;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

/** Ferme tout proprement (appelé une fois à la fin de la suite). */
async function closeDatabase() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongod) await mongod.stop();
}

module.exports = { connect, clearDatabase, closeDatabase };