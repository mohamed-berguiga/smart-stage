const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

/**
 * Attache Socket.io au serveur HTTP existant. Chaque connexion doit
 * présenter le même token JWT que l'API REST — sans token valide, la
 * connexion est refusée (testé : voir la conversation de développement).
 *
 * Chaque utilisateur rejoint une "room" privée (user:<id>) : une notification
 * n'est donc jamais envoyée qu'à la bonne personne, jamais diffusée à tous.
 */
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentification requise'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Token invalide'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);
  });

  return io;
}

/** Pousse un événement en temps réel à un utilisateur précis (par son id). */
function emitToUser(userId, event, payload) {
  if (!io) return; // Socket.io pas encore initialisé (ex: pendant les tests) — pas bloquant
  io.to(`user:${userId}`).emit(event, payload);
}

module.exports = { initSocket, emitToUser };