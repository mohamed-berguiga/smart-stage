const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Smart Stage API',
      version: '1.0.0',
      description:
        "API REST pour Smart Stage — plateforme de gestion centralisée des stages en entreprise. " +
        "Trois rôles : RH (gestion globale), Encadrant (suivi de ses stagiaires), Stagiaire (ses propres tâches).",
      contact: { name: 'Smart Stage' },
    },
    servers: [
      { url: 'http://localhost:8000/api', description: 'Serveur local (développement)' },
    ],
    tags: [
      { name: 'Auth', description: 'Connexion, profil, mot de passe' },
      { name: 'Users', description: 'Gestion des comptes (RH uniquement pour la création)' },
      { name: 'Departments', description: 'Départements de l\'entreprise' },
      { name: 'Stages', description: 'Affectations stagiaire ↔ encadrant ↔ département' },
      { name: 'Tasks', description: 'Tâches, commentaires, pièces jointes, historique' },
      { name: 'Notifications', description: 'Notifications in-app' },
      { name: 'Reports', description: 'Rapports hebdomadaires et export PDF' },
      { name: 'Skills', description: 'Référentiel de compétences et évaluations' },
      { name: 'Attestations', description: 'Génération d\'attestations de stage (PDF)' },
      { name: 'Imports', description: 'Import en masse de stagiaires (Excel/CSV)' },
      { name: 'Journal', description: 'Journal de stage quotidien et commentaires' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token obtenu via POST /auth/login, à passer en en-tête : Authorization: Bearer <token>',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Identifiants incorrects' },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '66f1a2b3c4d5e6f7a8b9c0d1' },
            firstName: { type: 'string', example: 'Ahmed' },
            lastName: { type: 'string', example: 'Ben Ali' },
            email: { type: 'string', example: 'ahmed@smartstage.com' },
            role: { type: 'string', enum: ['RH', 'ENCADRANT', 'STAGIAIRE'] },
            status: { type: 'boolean', example: true },
            department: { type: 'string', example: '66f1a2b3c4d5e6f7a8b9c0d2' },
          },
        },
        Task: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string', example: 'Développer la page Login' },
            description: { type: 'string' },
            type: { type: 'string', example: 'Développement' },
            priority: { type: 'string', enum: ['Faible', 'Moyenne', 'Haute', 'Urgente'] },
            status: { type: 'string', enum: ['À faire', 'En cours', 'Terminée'] },
            isPersonal: { type: 'boolean' },
            isLate: { type: 'boolean', description: 'Calculé automatiquement (lecture seule)' },
            dueDate: { type: 'string', format: 'date-time' },
            assignedTo: { type: 'string' },
            creator: { type: 'string' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Token manquant, invalide ou expiré',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        Forbidden: {
          description: 'Rôle non autorisé pour cette action',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        NotFound: {
          description: 'Ressource introuvable',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./docs/*.docs.js'],
};

module.exports = swaggerJsdoc(options);