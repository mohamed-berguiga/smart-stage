/**
 * Suite et fin de la documentation Swagger : Notifications, Reports, Skills,
 * Attestations, Imports, Journal. Voir auth-users-departments.docs.js pour
 * l'explication du rôle de ce fichier.
 */

/* ========================== NOTIFICATIONS ========================== */

/**
 * @swagger
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Mes notifications
 *     responses:
 *       200: { description: Liste des notifications de l'utilisateur connecté }
 */

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Marquer une notification comme lue
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Notification marquée comme lue }
 */

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Marquer toutes mes notifications comme lues
 *     responses:
 *       200: { description: Toutes marquées comme lues }
 */

/* ============================== REPORTS ============================== */

/**
 * @swagger
 * /reports/weekly/{stagiaireId}:
 *   post:
 *     tags: [Reports]
 *     summary: Générer le rapport hebdomadaire d'un stagiaire (RH, Encadrant)
 *     parameters:
 *       - in: path
 *         name: stagiaireId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               periodStart: { type: string, format: date }
 *               periodEnd: { type: string, format: date }
 *     responses:
 *       201: { description: "Rapport calculé (total, terminées, en cours, en retard, taux de réalisation)" }
 */

/**
 * @swagger
 * /reports/stagiaire/{stagiaireId}:
 *   get:
 *     tags: [Reports]
 *     summary: Historique des rapports d'un stagiaire
 *     parameters:
 *       - in: path
 *         name: stagiaireId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Liste des rapports, du plus récent au plus ancien }
 */

/**
 * @swagger
 * /reports/pdf:
 *   post:
 *     tags: [Reports]
 *     summary: Générer un PDF de rapport à partir de statistiques déjà calculées côté client
 *     description: >
 *       Générique : le frontend calcule les stats adaptées à son rôle (RH,
 *       Encadrant ou Stagiaire) et les envoie ici pour mise en forme PDF.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               subtitle: { type: string }
 *               stats:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties: { label: { type: string }, value: { type: string } }
 *               rows:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties: { label: { type: string }, value: { type: string } }
 *               weekly:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties: { week: { type: string }, done: { type: integer } }
 *     responses:
 *       201:
 *         description: PDF généré
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { fileUrl: { type: string, example: /uploads/rapport-123.pdf } }
 */

/* =============================== SKILLS =============================== */

/**
 * @swagger
 * /skills:
 *   post:
 *     tags: [Skills]
 *     summary: Ajouter une compétence au référentiel (RH uniquement)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, department]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               department: { type: string }
 *     responses:
 *       201: { description: Compétence créée }
 *   get:
 *     tags: [Skills]
 *     summary: Référentiel de compétences
 *     parameters:
 *       - in: query
 *         name: department
 *         schema: { type: string }
 *     responses:
 *       200: { description: Liste des compétences }
 */

/**
 * @swagger
 * /skills/{id}:
 *   delete:
 *     tags: [Skills]
 *     summary: Supprimer une compétence du référentiel (RH uniquement)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Compétence supprimée }
 */

/**
 * @swagger
 * /skills/evaluations:
 *   post:
 *     tags: [Skills]
 *     summary: Évaluer un stagiaire sur une compétence (Encadrant uniquement)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [stagiaire, skill, level]
 *             properties:
 *               stagiaire: { type: string }
 *               skill: { type: string }
 *               level: { type: string, enum: [Débutant, Intermédiaire, Avancé, Maîtrisé] }
 *               comment: { type: string }
 *     responses:
 *       201: { description: "Évaluation créée ou mise à jour (une seule par stagiaire/compétence)" }
 */

/**
 * @swagger
 * /skills/evaluations/{stagiaireId}:
 *   get:
 *     tags: [Skills]
 *     summary: Progression complète d'un stagiaire sur le référentiel
 *     parameters:
 *       - in: path
 *         name: stagiaireId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Liste des évaluations de ce stagiaire }
 */

/* ============================ ATTESTATIONS ============================ */

/**
 * @swagger
 * /attestations/{stagiaireId}:
 *   post:
 *     tags: [Attestations]
 *     summary: Générer l'attestation de stage PDF (RH uniquement)
 *     description: Vérifie que le stage est bien terminé (date de fin dépassée) avant de générer.
 *     parameters:
 *       - in: path
 *         name: stagiaireId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201: { description: PDF généré et enregistré }
 *       400: { description: Stage non terminé }
 *   get:
 *     tags: [Attestations]
 *     summary: Liste des attestations déjà générées pour un stagiaire
 *     parameters:
 *       - in: path
 *         name: stagiaireId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Liste des attestations }
 */

/* =============================== IMPORTS =============================== */

/**
 * @swagger
 * /imports/stagiaires:
 *   post:
 *     tags: [Imports]
 *     summary: Import en masse de stagiaires depuis un fichier Excel/CSV (RH uniquement)
 *     description: >
 *       Colonnes requises dans le fichier : firstName, lastName, email, password
 *       (phone optionnel). Champs de formulaire additionnels optionnels pour
 *       affecter tout le lot au même coup : department, encadrant, startDate, endDate.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file: { type: string, format: binary }
 *               department: { type: string }
 *               encadrant: { type: string }
 *               startDate: { type: string, format: date }
 *               endDate: { type: string, format: date }
 *     responses:
 *       201:
 *         description: Résultat de l'import
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalRows: { type: integer }
 *                 successCount: { type: integer }
 *                 errorCount: { type: integer }
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       rowNumber: { type: integer }
 *                       errorMessage: { type: string }
 */

/**
 * @swagger
 * /imports:
 *   get:
 *     tags: [Imports]
 *     summary: Historique des imports (RH uniquement)
 *     responses:
 *       200: { description: Liste des imports précédents }
 */

/**
 * @swagger
 * /imports/{id}/errors:
 *   get:
 *     tags: [Imports]
 *     summary: Détail des erreurs d'un import donné (RH uniquement)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Liste des lignes en erreur }
 */

/* =============================== JOURNAL =============================== */

/**
 * @swagger
 * /journal:
 *   post:
 *     tags: [Journal]
 *     summary: Ajouter une entrée de journal (Stagiaire uniquement)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               text: { type: string }
 *               hours: { type: number }
 *     responses:
 *       201: { description: Entrée créée }
 *   get:
 *     tags: [Journal]
 *     summary: Lister les entrées de journal (scope automatique selon le rôle)
 *     description: RH voit tout, Encadrant voit son département, Stagiaire voit les siennes.
 *     responses:
 *       200: { description: Liste des entrées }
 */

/**
 * @swagger
 * /journal/{id}/visa:
 *   patch:
 *     tags: [Journal]
 *     summary: Viser (valider) ou retirer le visa d'une entrée (Encadrant uniquement)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Visa basculé }
 */

/**
 * @swagger
 * /journal/{id}/comments:
 *   post:
 *     tags: [Journal]
 *     summary: Commenter une entrée de journal
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string }
 *     responses:
 *       201: { description: Commentaire ajouté }
 *   get:
 *     tags: [Journal]
 *     summary: Lister les commentaires d'une entrée de journal
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Liste des commentaires }
 */