# Smart Stage — Optimizing Internship Management

Plateforme web de **gestion centralisée des stages en entreprise**, développée dans le cadre d'un stage chez **LEONI Wiring Systems Tunisia** (Messadine, Sousse).

Smart Stage remplace le suivi traditionnel par fichiers Excel et échanges d'e-mails par une plateforme unique où le service RH, les encadrants et les stagiaires disposent chacun d'un espace dédié : gestion des comptes et affectations, suivi des tâches (avec vue Kanban), compétences, journal de stage, attestations, rapports et statistiques.

---

## Aperçu

| | |
|---|---|
| **Statut** | Projet complet et fonctionnel (voir [Fonctionnalités](#fonctionnalités)) |
| **Frontend** | React (TanStack Start) + Tailwind CSS |
| **Backend** | Node.js / Express.js / MongoDB |
| **Authentification** | JWT + bcrypt |
| **Tests** | Jest + Supertest (15 tests automatisés) |
| **Documentation API** | Swagger / OpenAPI (36 routes documentées) |

---

## Sommaire

- [Contexte](#contexte)
- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Structure du dépôt](#structure-du-dépôt)
- [Démarrage rapide](#démarrage-rapide)
- [Comptes de démonstration](#comptes-de-démonstration)
- [Documentation de l'API](#documentation-de-lapi)
- [Tests automatisés](#tests-automatisés)
- [Sécurité](#sécurité)
- [Captures d'écran](#captures-décran)
- [Auteur](#auteur)

---

## Contexte

La gestion des stages repose souvent sur des outils dispersés (Excel, e-mails, suivi manuel), ce qui entraîne une perte de temps pour le service RH, un manque de visibilité sur l'avancement réel des stagiaires, et l'absence de statistiques fiables.

Smart Stage centralise l'ensemble de ce processus autour de **trois rôles** :

- **RH** — administration globale : comptes, affectations, départements, rapports, statistiques.
- **Encadrant** — gestion de ses propres stagiaires uniquement : création et suivi des tâches, évaluation des compétences, validation du journal de stage.
- **Stagiaire** — accès à ses propres tâches, son journal quotidien, sa progression et ses rapports.

Chaque rôle ne voit **que** les données qui le concernent — cette règle de cloisonnement est appliquée côté serveur et vérifiée par des tests automatisés (voir [Tests](#tests-automatisés)).

---

## Fonctionnalités

### Gestion des comptes & affectations (RH)
- Création, activation/désactivation, suppression de comptes (aucune inscription publique)
- Affectation stagiaire ↔ encadrant ↔ département
- **Import en masse** de stagiaires via fichier Excel/CSV, avec rapport d'erreurs ligne par ligne

### Tâches
- Création, modification, suppression de tâches professionnelles et personnelles
- **Vue Kanban** avec glisser-déposer (statut "En retard" calculé automatiquement selon l'échéance)
- Commentaires et **pièces jointes** par tâche
- **Historique** complet des actions (qui a fait quoi, et quand)
- Recherche et filtres (titre, statut, priorité)

### Compétences
- Référentiel de compétences par département (géré par le RH)
- Évaluation des stagiaires par leur encadrant, avec barre de progression

### Journal de stage
- Entrées quotidiennes rédigées par le stagiaire (activités, heures travaillées)
- Visa de l'encadrant + commentaires sur chaque entrée

### Attestations & rapports
- Génération d'attestations de stage en **PDF réel** (avec vérification que le stage est terminé)
- Rapports hebdomadaires et statistiques (par stagiaire, par département, par statut)
- **Export PDF** des rapports pour les 3 rôles

### Notifications
- Notifications in-app (cloche avec compteur) **et par e-mail**
- Déclenchées automatiquement sur les événements clés (nouvelle tâche, tâche terminée, attestation disponible...)

### Compte utilisateur
- Connexion, **mot de passe oublié** (lien envoyé par e-mail), changement de mot de passe depuis son profil

### Confort d'utilisation
- **Mode sombre**
- Interface responsive

---

## Stack technique

**Frontend**
- React 19 + [TanStack Start](https://tanstack.com/start) (routing basé sur les fichiers, SSR)
- Tailwind CSS + composants shadcn/ui
- `@dnd-kit` (glisser-déposer Kanban), `xlsx` (import/export Excel)

**Backend**
- Node.js + Express.js — API REST
- MongoDB + Mongoose
- JWT (`jsonwebtoken`) + `bcryptjs` pour l'authentification
- `multer` (upload de fichiers), `pdfkit` (génération de PDF), `nodemailer` (e-mails)
- Sécurité : `helmet`, `express-rate-limit`, `express-mongo-sanitize`

**Outils**
- `swagger-jsdoc` / `swagger-ui-express` — documentation API interactive
- `jest` / `supertest` / `mongodb-memory-server` — tests automatisés

---

## Structure du dépôt

```
smart-stage/
├── backend/                 API REST (Node/Express/MongoDB)
│   ├── config/               connexion DB, constantes, config Swagger
│   ├── controllers/          logique métier par ressource
│   ├── docs/                 annotations Swagger (documentation API)
│   ├── middleware/           auth (JWT), rôles (RBAC), erreurs, upload
│   ├── models/                schémas Mongoose
│   ├── routes/                définition des endpoints
│   ├── tests/                 tests automatisés (Jest + Supertest)
│   ├── utils/                  helpers (email, notifications, token)
│   ├── seed.js                 données de démonstration
│   └── server.js                point d'entrée
│
└── frontend/                Application React (TanStack Start)
    └── src/
        ├── components/         composants réutilisables (Kanban, formulaires...)
        ├── lib/                 client API, session, store de données
        └── routes/               pages (basées sur le système de fichiers)
```

---

## Démarrage rapide

### Prérequis
- Node.js 18+
- Une base MongoDB (locale ou [MongoDB Atlas](https://www.mongodb.com/atlas), gratuit)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Renseignez au minimum `MONGO_URI` et `JWT_SECRET` dans `.env` (voir les commentaires du fichier pour la configuration optionnelle de l'envoi d'e-mails).

```bash
node seed.js     # crée des comptes et données de démonstration
npm run dev      # démarre l'API sur http://localhost:8000
```

### 2. Frontend

```bash
cd frontend
npm install
```

Créez un fichier `.env` avec :
```
VITE_API_URL=http://localhost:8000/api
```

```bash
npm run dev      # démarre l'application sur http://localhost:8080
```

---

## Comptes de démonstration

Après exécution de `node seed.js`, les comptes suivants sont disponibles (mot de passe : `password123`) :

| Rôle | Email |
|---|---|
| RH | `rh@smartstage.com` |
| Encadrant | `ahmed@smartstage.com` |
| Encadrant | `sami@smartstage.com` |
| Stagiaire | `mohamed@smartstage.com` |
| Stagiaire | `ali@smartstage.com` |
| Stagiaire | `sarah@smartstage.com` |

---

## Documentation de l'API

Une fois le backend démarré, la documentation interactive (36 routes, testables directement depuis le navigateur) est disponible sur :

```
http://localhost:8000/api-docs
```

---

## Tests automatisés

```bash
cd backend
npm test
```

La suite couvre notamment l'authentification et, surtout, la **règle de cloisonnement des données par rôle** (un encadrant ne doit jamais voir les stagiaires ou tâches d'un autre encadrant, un stagiaire ne voit jamais les tâches d'un autre stagiaire).

---

## Sécurité

- Mots de passe hachés (bcrypt), jamais renvoyés par l'API
- Authentification JWT, autorisations par rôle vérifiées côté serveur sur chaque route
- Protection anti-brute-force sur la connexion (`express-rate-limit`)
- Neutralisation des tentatives d'injection NoSQL (`express-mongo-sanitize`)
- En-têtes de sécurité HTTP (`helmet`)
- Liste blanche des types de fichiers autorisés à l'upload

---

## Captures d'écran

*(à ajouter — dashboard RH, vue Kanban, rapports...)*

---

## Auteur

Projet réalisé par **Mohamed Berguiga** dans le cadre d'un stage chez LEONI Wiring Systems Tunisia (Messadine, Sousse).
