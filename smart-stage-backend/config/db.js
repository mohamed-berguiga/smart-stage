const mongoose = require('mongoose');

/**
 * Établit la connexion à MongoDB.
 * Utilisé par server.js au démarrage de l'application.
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI manquant dans le fichier .env');
  }

  const conn = await mongoose.connect(uri);
  console.log(`MongoDB connecté : ${conn.connection.host}/${conn.connection.name}`);
  return conn;
};

module.exports = connectDB;
