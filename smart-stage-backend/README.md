# Smart Stage — Backend API

API REST pour la plateforme **Smart Stage** (gestion centralisée des stages).
Node.js + Express.js + MongoDB (Mongoose) + JWT + bcrypt.

---

## 1. Installation

```bash
cd smart-stage-backend
npm install
cp .env.example .env
```

Ouvrez `.env` et renseignez au minimum :

```
MONGO_URI=mongodb://127.0.0.1:27017/smart_stage
JWT_SECRET=une_longue_chaine_aleatoire
```

Vous pouvez utiliser une base locale (MongoDB Community installé sur votre machine) ou
un cluster gratuit sur [MongoDB Atlas](https://www.mongodb.com/atlas).

## 2. Peupler la base avec des données de test (optionnel mais recommandé)

```bash
node seed.js
```

Crée 1 RH, 2 encadrants, 3 stagiaires, 2 départements, 3 affectations, 3 tâches et
3 compétences. Tous les comptes ont le mot de passe `password123`. La liste des emails
est affichée à la fin du script.

## 3. Démarrer le serveur

```bash
npm run dev     # avec nodemon (redémarrage auto)
# ou
npm start       # sans nodemon
```

Le serveur démarre par défaut sur `http://localhost:8000`.
Vérifiez qu'il tourne : `GET http://localhost:8000/api/health`.

---

## 4. Authentification

Il n'y a **pas d'inscription publique**. Seul le RH crée les comptes (`POST /api/users`).

```
POST /api/auth/login
Body: { "email": "rh@smartstage.com", "password": "password123" }
Réponse: { "token": "...", "user": { id, firstName, lastName, email, role } }
```

Pour toutes les routes protégées, ajoutez le header :
```
Authorization: Bearer <token>
```

---

## 5. Liste des endpoints

### Auth
| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | /api/auth/login | Public | Connexion |
| GET | /api/auth/me | Connecté | Profil de l'utilisateur connecté |

### Users (comptes)
| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | /api/users | RH | Créer un compte (RH/Encadrant/Stagiaire) |
| GET | /api/users | RH | Liste des utilisateurs (filtres `role`, `department`) |
| GET | /api/users/my-stagiaires | Encadrant | Ses stagiaires affectés uniquement |
| GET | /api/users/:id | RH, Encadrant | Détail d'un utilisateur |
| PUT | /api/users/:id | RH | Modifier un utilisateur |
| PATCH | /api/users/:id/status | RH | Activer / désactiver un compte |
| DELETE | /api/users/:id | RH | Supprimer un utilisateur |

### Departments
| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | /api/departments | RH | Créer un département |
| GET | /api/departments | Connecté | Lister les départements |
| PUT | /api/departments/:id | RH | Modifier |
| DELETE | /api/departments/:id | RH | Supprimer |

### Stages (affectations)
| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | /api/stages | RH | Affecter un stagiaire à un encadrant + département |
| GET | /api/stages | RH, Encadrant | Lister les affectations |
| PUT | /api/stages/:id | RH | Modifier une affectation |
| DELETE | /api/stages/:id | RH | Supprimer une affectation |

### Tasks (cœur du système)
| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | /api/tasks | Connecté | Créer une tâche (pro par Encadrant, perso par tous) |
| GET | /api/tasks | Connecté | Lister les tâches (scope automatique par rôle) + filtres `status`, `priority`, `type`, `assignedTo`, `search` |
| GET | /api/tasks/:id | Connecté (scope) | Détail d'une tâche |
| PUT | /api/tasks/:id | Créateur/assigné/RH | Modifier une tâche |
| PATCH | /api/tasks/:id/status | Créateur/assigné/RH | Changer le statut (utilisé aussi par la vue Kanban) |
| DELETE | /api/tasks/:id | Créateur/RH | Supprimer une tâche |
| POST | /api/tasks/:taskId/comments | Connecté | Ajouter un commentaire |
| GET | /api/tasks/:taskId/comments | Connecté | Lister les commentaires |
| POST | /api/tasks/:taskId/attachments | Connecté | Upload pièce jointe (`multipart/form-data`, champ `file`) |
| GET | /api/tasks/:taskId/attachments | Connecté | Lister les pièces jointes |
| GET | /api/tasks/:taskId/history | Connecté | Historique des actions sur la tâche |

> **Important — cloisonnement des données** : le filtre de "scope" est appliqué
> automatiquement côté serveur selon le rôle (voir `buildScopeFilter` dans
> `controllers/taskController.js`) : RH voit tout, Encadrant voit ses stagiaires,
> Stagiaire voit uniquement ses propres tâches + ses tâches personnelles.

### Notifications
| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | /api/notifications | Connecté | Mes notifications |
| PATCH | /api/notifications/:id/read | Connecté | Marquer comme lue |
| PATCH | /api/notifications/read-all | Connecté | Tout marquer comme lu |

### Reports
| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | /api/reports/weekly/:stagiaireId | RH, Encadrant | Générer le rapport hebdomadaire |
| GET | /api/reports/stagiaire/:stagiaireId | Connecté | Historique des rapports d'un stagiaire |

### Skills (nouvelle fonctionnalité — compétences)
| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | /api/skills | RH | Créer une compétence dans le référentiel |
| GET | /api/skills | Connecté | Lister (filtre `department`) |
| POST | /api/skills/evaluations | Encadrant | Évaluer un stagiaire sur une compétence |
| GET | /api/skills/evaluations/:stagiaireId | Connecté | Progression complète d'un stagiaire |

### Attestations (nouvelle fonctionnalité — PDF)
| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | /api/attestations/:stagiaireId | RH | Génère le PDF (vérifie que le stage est terminé) |
| GET | /api/attestations/:stagiaireId | Connecté | Liste des attestations d'un stagiaire |

### Imports (nouvelle fonctionnalité — Excel/CSV en masse)
| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | /api/imports/stagiaires | RH | Upload d'un fichier `.xlsx`/`.csv` (champ `file`) — colonnes requises : `firstName`, `lastName`, `email`, `password` (optionnel : `phone`) |
| GET | /api/imports | RH | Historique des imports |
| GET | /api/imports/:id/errors | RH | Détail des lignes en erreur d'un import |

---

## 6. Exemple de test rapide (curl)

```bash
# 1. Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rh@smartstage.com","password":"password123"}'

# 2. Récupérer les tâches (remplacez <TOKEN>)
curl http://localhost:8000/api/tasks \
  -H "Authorization: Bearer <TOKEN>"
```

## 7. Structure du projet

```
smart-stage-backend/
├── app.js                 # config Express (routes, middlewares)
├── server.js              # point d'entrée (connexion DB + listen)
├── seed.js                # données de test
├── config/
│   ├── db.js
│   └── constants.js       # enums (rôles, statuts, priorités...)
├── models/                 # 14 modèles Mongoose (fidèles au diagramme de classes)
├── middleware/
│   ├── authMiddleware.js   # protect (JWT)
│   ├── roleMiddleware.js   # allowRoles (RBAC)
│   ├── uploadMiddleware.js # Multer
│   └── errorMiddleware.js
├── controllers/            # logique métier par ressource
├── routes/                 # définition des endpoints par ressource
└── uploads/                 # fichiers uploadés (pièces jointes, PDF attestations)
```

## 8. Connecter le frontend React

Dans votre projet React, configurez la base URL de l'API (ex. dans `services/api.js` avec Axios) :

```js
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:8000/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
```

N'oubliez pas de mettre à jour `CLIENT_URL` dans `.env` avec l'URL de votre app React
(ex. `http://localhost:5173` pour Vite) pour que CORS autorise les requêtes.

---

## 9. Prochaines étapes suggérées

- Ajouter des tests automatisés (Jest + Supertest + `mongodb-memory-server`).
- Ajouter la validation de schéma des entrées (ex. `zod` ou `joi`) en plus des validations Mongoose.
- Remplacer le stockage local des fichiers (`/uploads`) par un service cloud (S3, Cloudinary) avant la mise en production.
- Ajouter un rate-limiter (`express-rate-limit`) sur `/api/auth/login`.
- Générer la documentation interactive de l'API (Swagger / OpenAPI).
