require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 8000;

const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Smart Stage API démarrée sur http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Échec du démarrage du serveur :', err.message);
    process.exit(1);
  }
};

start();
