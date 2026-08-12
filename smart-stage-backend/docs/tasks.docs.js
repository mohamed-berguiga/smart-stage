/**
 * Suite de la documentation Swagger : Stages, Tasks et leurs sous-ressources
 * (comments, attachments, history). Voir auth-users-departments.docs.js pour
 * l'explication du rôle de ce fichier.
 */

/* ============================== STAGES ============================== */

/**
 * @swagger
 * /stages:
 *   post:
 *     tags: [Stages]
 *     summary: Affecter un stagiaire à un encadrant et un département (RH uniquement)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [stagiaire, encadrant, department, startDate, endDate]
 *             properties:
 *               stagiaire: { type: string, description: "Id du stagiaire" }
 *               encadrant: { type: string, description: "Id de l'encadrant" }
 *               department: { type: string }
 *               startDate: { type: string, format: date }
 *               endDate: { type: string, format: date }
 *     responses:
 *       201: { description: Affectation créée (ou mise à jour si le stagiaire en avait déjà une) }
 *   get:
 *     tags: [Stages]
 *     summary: Liste des affectations (RH, Encadrant)
 *     parameters:
 *       - in: query
 *         name: encadrant
 *         schema: { type: string }
 *       - in: query
 *         name: department
 *         schema: { type: string }
 *     responses:
 *       200: { description: Liste des affectations }
 */

/**
 * @swagger
 * /stages/{id}:
 *   put:
 *     tags: [Stages]
 *     summary: Modifier une affectation (RH uniquement)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Affectation modifiée }
 *   delete:
 *     tags: [Stages]
 *     summary: Supprimer une affectation (RH uniquement)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Affectation supprimée }
 */

/* =============================== TASKS =============================== */

/**
 * @swagger
 * /tasks:
 *   post:
 *     tags: [Tasks]
 *     summary: Créer une tâche (pro par un Encadrant, personnelle par n'importe quel rôle)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, type]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               type: { type: string, example: Développement }
 *               priority: { type: string, enum: [Faible, Moyenne, Haute, Urgente] }
 *               status: { type: string, enum: [À faire, En cours, Terminée] }
 *               dueDate: { type: string, format: date }
 *               assignedTo: { type: string, description: "Id du stagiaire (requis pour une tâche pro)" }
 *               isPersonal: { type: boolean, default: false }
 *     responses:
 *       201:
 *         description: Tâche créée
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Task' }
 *   get:
 *     tags: [Tasks]
 *     summary: Lister les tâches (scope automatique selon le rôle connecté)
 *     description: >
 *       RH voit toutes les tâches pro. Encadrant voit celles de ses stagiaires
 *       + ses propres tâches perso. Stagiaire voit les siennes uniquement.
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [À faire, En cours, Terminée] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [Faible, Moyenne, Haute, Urgente] }
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *       - in: query
 *         name: assignedTo
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string, description: "Recherche dans le titre" }
 *     responses:
 *       200:
 *         description: Liste des tâches visibles par ce rôle
 *         content:
 *           application/json:
 *             schema: { type: array, items: { $ref: '#/components/schemas/Task' } }
 */

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     tags: [Tasks]
 *     summary: Détail d'une tâche (si dans le scope du rôle connecté)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Tâche trouvée
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Task' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   put:
 *     tags: [Tasks]
 *     summary: Modifier une tâche (créateur, assigné, ou RH)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               priority: { type: string }
 *               type: { type: string }
 *               dueDate: { type: string, format: date }
 *     responses:
 *       200: { description: Tâche mise à jour }
 *   delete:
 *     tags: [Tasks]
 *     summary: Supprimer une tâche (créateur ou RH)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Tâche supprimée }
 */

/**
 * @swagger
 * /tasks/{id}/status:
 *   patch:
 *     tags: [Tasks]
 *     summary: Changer le statut d'une tâche (aussi utilisé par le glisser-déposer Kanban)
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
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [À faire, En cours, Terminée] }
 *     responses:
 *       200: { description: Statut mis à jour, historique enregistré automatiquement }
 */

/**
 * @swagger
 * /tasks/{taskId}/comments:
 *   post:
 *     tags: [Tasks]
 *     summary: Ajouter un commentaire sur une tâche
 *     parameters:
 *       - in: path
 *         name: taskId
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
 *       201: { description: Commentaire ajouté (notifie l'autre partie) }
 *   get:
 *     tags: [Tasks]
 *     summary: Lister les commentaires d'une tâche
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Liste des commentaires, triés du plus ancien au plus récent }
 */

/**
 * @swagger
 * /tasks/{taskId}/attachments:
 *   post:
 *     tags: [Tasks]
 *     summary: Joindre un fichier à une tâche
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       201: { description: "Pièce jointe enregistrée (extensions autorisées : pdf, doc(x), xls(x), csv, images, zip — 10 Mo max)" }
 *   get:
 *     tags: [Tasks]
 *     summary: Lister les pièces jointes d'une tâche
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Liste des pièces jointes }
 */

/**
 * @swagger
 * /tasks/{taskId}/history:
 *   get:
 *     tags: [Tasks]
 *     summary: Historique des actions effectuées sur une tâche
 *     description: Alimenté automatiquement à chaque changement de statut.
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Historique chronologique }
 */