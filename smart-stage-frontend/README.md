# Smart Intern Hub

Voici une version complète et structurée du projet Smart Stage adaptée aux technologies que tu as choisies (React + Node.js + Express + MongoDB + Power BI). Ce document peut servir comme base pour développer le site et pour ton rapport de stage.
Smart Stage

Optimizing Internship Management

1. Présentation générale du projet

Smart Stage est une plateforme web intelligente dédiée à la gestion et au suivi des stages en entreprise.

L'objectif principal est de remplacer la gestion traditionnelle basée sur les fichiers Excel et les échanges par e-mail par une solution centralisée permettant :

 la gestion des stagiaires et des encadrants ;

 l'affectation des stagiaires aux encadrants ;

 la programmation et le suivi des tâches ;

 la communication entre stagiaire et encadrant ;

 la génération automatique des rapports hebdomadaires ;

 l'analyse des performances grâce à Power BI.

2. Technologies utilisées

Frontend

React.js

Utilisé pour développer l'interface utilisateur.

Responsabilités :

 création des pages web ;

 gestion des interfaces selon le rôle ;

 navigation entre les pages ;

 affichage dynamique des données ;

 communication avec le backend via API REST.

Bibliothèques recommandées :

 React Router → gestion des routes

 Axios → communication API

 Context API / Redux → gestion des utilisateurs connectés

 Bootstrap ou Material UI → composants UI

 Recharts → graphiques internes

Backend

Node.js + Express.js

Utilisés pour développer l'API backend.

Responsabilités :

 authentification ;

 gestion des utilisateurs ;

 gestion des permissions ;

 gestion des tâches ;

 génération des rapports ;

 communication avec MongoDB.

Architecture :

Frontend React

       |
       |
 REST API

       |

Backend Node.js + Express

       |

MongoDB

Base de données

MongoDB

Base NoSQL utilisée pour stocker :

 utilisateurs ;

 stagiaires ;

 encadrants ;

 départements ;

 tâches ;

 commentaires ;

 notifications ;

 rapports.

Visualisation

Power BI

Utilisé pour créer des dashboards interactifs.

Données analysées :

 nombre de tâches par stagiaire ;

 nombre de tâches par encadrant ;

 nombre de tâches par département ;

 taux d'avancement ;

 tâches terminées / en cours / retard ;

 évolution hebdomadaire.

3. Architecture générale

                 Utilisateur

                     |

              React Frontend

                     |

              API REST Express

                     |

              Node.js Backend

                     |

                MongoDB

                     |

                 Power BI

4. Modules du système

Module 1 : Authentification

Fonctionnalités :

 Login

 Logout

 Gestion session utilisateur

 Authentification JWT

 Gestion des rôles

Rôles :

ROLE_RH

ROLE_ENCADRANT

ROLE_STAGIAIRE

Module 2 : Gestion des utilisateurs

RH uniquement

Le RH peut :

 créer un compte stagiaire ;

 créer un compte encadrant ;

 modifier un compte ;

 supprimer un compte ;

 activer/désactiver un utilisateur.

Modèle User MongoDB

User {

_id,

firstName,

lastName,

email,

password,

phone,

role,

createdAt

}

Module 3 : Gestion des stages

Le RH gère :

 stagiaires ;

 encadrants ;

 départements ;

 affectations.

Relation :

Département

      |
      |
      *

Stagiaire

      |
      |
      1

Encadrant

Module 4 : Gestion des tâches

Tâche professionnelle

Créée par l'encadrant.

Informations :

Task {

title,

description,

type,

priority,

status,

deadline,

createdBy,

assignedTo,

createdAt

}

Type de tâche

Valeurs :

Travail

Réunion

Formation

Documentation

Recherche

Développement

Correction

Idée personnelle

Personnel

Priorité

Faible

Moyenne

Haute

Urgente

Statut

A faire

En cours

Terminée

En retard

Module 5 : Tâches personnelles

Chaque utilisateur peut créer ses propres tâches.

Exemple :

Stagiaire :

- apprendre React
- préparer rapport


Encadrant :

- préparer réunion
- vérifier documents

Ces tâches :

 ne sont visibles que par leur propriétaire ;

 ne sont pas visibles par RH ;

 ne sont pas incluses dans les statistiques.

Module 6 : Commentaires et collaboration

Sur chaque tâche :

Encadrant et stagiaire peuvent :

 écrire un commentaire ;

 répondre ;

 joindre un fichier.

Module 7 : Notifications

Notifications :

 nouvelle tâche reçue ;

 changement de statut ;

 commentaire ajouté ;

 échéance proche.

Module 8 : Rapport automatique

Chaque semaine le système génère :

Rapport texte

Exemple :

Rapport semaine 3

Stagiaire :
Ahmed Mohamed


Nombre total tâches : 12

Terminées : 8

En cours : 3

Retard : 1


Progression :
75 %

Module 9 : Power BI Dashboard

Dashboard RH

Visualisations :

Graphique 1

Somme des tâches par stagiaire

Ahmed      ███████ 15

Ali        █████ 10

Sami       ████ 8

Graphique 2

Somme des tâches par département

IT          50

Marketing   20

Finance     15

Graphique 3

Etat des tâches

Terminées 70%

En cours 20%

Retard 10%

5. Pages Frontend React

Pages publiques

Home

Contient :

 présentation Smart Stage ;

 avantages ;

 objectifs.

About

Contient :

 présentation entreprise ;

 adresse ;

 téléphone ;

 email RH ;

 Facebook ;

 LinkedIn ;

 Google Maps.

Login

Connexion utilisateur.

Pages privées

RH Dashboard

Contient :

 statistiques générales ;

 gestion utilisateurs ;

 gestion stagiaires ;

 gestion encadrants ;

 rapports ;

 Power BI.

Encadrant Dashboard

Contient :

 liste des stagiaires ;

 création tâches ;

 suivi tâches ;

 commentaires ;

 calendrier.

Stagiaire Dashboard

Contient :

 mes tâches ;

 changement statut ;

 mes rapports ;

 tâches personnelles.

6. Design et couleurs recommandées

Pour un site professionnel RH + entreprise :

Couleur principale

Bleu professionnel

#2563EB

Utilisation :

 Navbar

 boutons principaux

 titres

Couleur secondaire

Bleu foncé

#1E3A8A

Utilisation :

 Sidebar

 Footer

 éléments importants

Couleur accent

Vert succès

#16A34A

Utilisation :

 tâche terminée

 validation

 succès

Orange

#F59E0B

Utilisation :

 tâches en cours

 alertes

Rouge

#DC2626

Utilisation :

 retard

 erreurs

Gris clair

#F3F4F6

Utilisation :

 arrière-plan

 cartes

Texte

#111827

Palette finale

Primary       #2563EB  🔵

Dark          #1E3A8A  🔷

Success       #16A34A  🟢

Warning       #F59E0B  🟠

Danger        #DC2626  🔴

Background    #F3F4F6  ⚪

Text          #111827  ⚫

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://stage-smart-hub-64.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c10a4f89-d704-4672-87f6-cf9f10465b2d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
