/**
 * Ce fichier ne contient QUE des annotations Swagger (@swagger) lues par
 * swagger-jsdoc — il n'exporte rien et n'est jamais require()-é ailleurs
 * que par config/swagger.js. Ça permet de documenter toute l'API sans
 * toucher aux fichiers de routes existants.
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Connexion (email + mot de passe)
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: rh@smartstage.com }
 *               password: { type: string, example: password123 }
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/LoginResponse' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403:
 *         description: Compte désactivé
 */

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Profil de l'utilisateur connecté
 *     responses:
 *       200:
 *         description: Profil utilisateur
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Demande de réinitialisation de mot de passe (envoie un email)
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200:
 *         description: Message générique (que le compte existe ou non)
 */

/**
 * @swagger
 * /auth/reset-password/{token}:
 *   post:
 *     tags: [Auth]
 *     summary: Réinitialise le mot de passe avec le token reçu par email
 *     security: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password: { type: string, minLength: 6 }
 *     responses:
 *       200: { description: Mot de passe réinitialisé }
 *       400: { description: Token invalide ou expiré }
 */

/**
 * @swagger
 * /auth/change-password:
 *   patch:
 *     tags: [Auth]
 *     summary: Change son propre mot de passe (connecté)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 6 }
 *     responses:
 *       200: { description: Mot de passe modifié }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */

/* ============================== USERS ============================== */

/**
 * @swagger
 * /users:
 *   post:
 *     tags: [Users]
 *     summary: Créer un compte (RH uniquement — pas d'inscription publique)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, password, role]
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               email: { type: string }
 *               password: { type: string, minLength: 6 }
 *               role: { type: string, enum: [RH, ENCADRANT, STAGIAIRE] }
 *               department: { type: string, description: "Id du département" }
 *               phone: { type: string }
 *               startDate: { type: string, format: date }
 *               endDate: { type: string, format: date }
 *     responses:
 *       201:
 *         description: Compte créé
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *   get:
 *     tags: [Users]
 *     summary: Liste des utilisateurs (RH uniquement)
 *     parameters:
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [RH, ENCADRANT, STAGIAIRE] }
 *       - in: query
 *         name: department
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Liste des comptes
 *         content:
 *           application/json:
 *             schema: { type: array, items: { $ref: '#/components/schemas/User' } }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */

/**
 * @swagger
 * /users/my-stagiaires:
 *   get:
 *     tags: [Users]
 *     summary: Mes stagiaires affectés (Encadrant uniquement)
 *     responses:
 *       200:
 *         description: Liste des stagiaires de l'encadrant connecté
 *         content:
 *           application/json:
 *             schema: { type: array, items: { $ref: '#/components/schemas/User' } }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Détail d'un utilisateur (RH, Encadrant)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Utilisateur trouvé
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   put:
 *     tags: [Users]
 *     summary: Modifier un utilisateur (RH uniquement)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: Utilisateur mis à jour }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *   delete:
 *     tags: [Users]
 *     summary: Supprimer un utilisateur (RH uniquement) — nettoie aussi ses affectations Stage
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Utilisateur supprimé }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */

/**
 * @swagger
 * /users/{id}/status:
 *   patch:
 *     tags: [Users]
 *     summary: Active ou désactive un compte (RH uniquement)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Statut basculé }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */

/* ============================ DEPARTMENTS ============================ */

/**
 * @swagger
 * /departments:
 *   post:
 *     tags: [Departments]
 *     summary: Créer un département (RH uniquement)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: Informatique }
 *     responses:
 *       201: { description: Département créé }
 *   get:
 *     tags: [Departments]
 *     summary: Liste des départements (tout utilisateur connecté)
 *     responses:
 *       200: { description: Liste des départements }
 */

/**
 * @swagger
 * /departments/{id}:
 *   put:
 *     tags: [Departments]
 *     summary: Modifier un département (RH uniquement)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Département modifié }
 *   delete:
 *     tags: [Departments]
 *     summary: Supprimer un département (RH uniquement)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Département supprimé }
 */