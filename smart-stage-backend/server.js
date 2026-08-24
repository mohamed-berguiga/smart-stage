require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./utils/socket');

const PORT = process.env.PORT || 8000;

const start = async () => {
  try {
    await connectDB();

    // On crée explicitement le serveur HTTP (au lieu d'app.listen direct)
    // pour pouvoir y attacher Socket.io en plus d'Express.
    const server = http.createServer(app);
    initSocket(server);

    server.listen(PORT, () => {
      console.log(`Smart Stage API démarrée sur http://localhost:${PORT}`);
      console.log('Socket.io prêt pour les notifications en temps réel.');
    });
  } catch (err) {
    console.error('Échec du démarrage du serveur :', err.message);
    process.exit(1);
  }
};

start();