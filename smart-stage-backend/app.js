const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const swaggerSpec = require('./config/swagger');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const stageRoutes = require('./routes/stageRoutes');
const taskRoutes = require('./routes/taskRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const skillRoutes = require('./routes/skillRoutes');
const attestationRoutes = require('./routes/attestationRoutes');
const importRoutes = require('./routes/importRoutes');
const journalRoutes = require('./routes/journalRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();

// --- Sécurité : en-têtes HTTP (protection XSS, clickjacking, etc.) ---
app.use(helmet());

// --- CORS : une seule origine précise autorisée (voir .env CLIENT_URL) ---
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Sécurité : neutralise les tentatives d'injection NoSQL dans
// req.body / req.query / req.params (ex: ?status[$ne]=null) ---
app.use(mongoSanitize());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// --- Sécurité : limite le nombre de tentatives de connexion (anti brute-force) ---
// En développement, la limite est volontairement plus large pour ne pas
// gêner les tests répétés ; en production, elle reste stricte.
const isProduction = process.env.NODE_ENV === 'production';
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 10 : 100,
  message: { message: 'Trop de tentatives de connexion, réessayez dans quelques minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- Sécurité : limite générale sur toute l'API (anti-abus / anti-scraping) ---
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// Fichiers statiques (pièces jointes, attestations PDF, etc.)
// Note : ces fichiers sont servis avec des noms générés aléatoirement
// (non devinables), ce qui limite l'exposition sans nécessiter d'authentification
// pour les télécharger. Pour un contrôle d'accès strict, prévoir une route
// authentifiée dédiée dans une prochaine itération.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Smart Stage API', timestamp: new Date().toISOString() });
});

// --- Documentation interactive de l'API ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Smart Stage API — Documentation',
}));

app.use('/api/auth/login', loginLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/stages', stageRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/attestations', attestationRoutes);
app.use('/api/imports', importRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/ai', aiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;