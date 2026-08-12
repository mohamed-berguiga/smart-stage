// Centralise toutes les valeurs d'énumération du cahier des charges.
// Garder ce fichier synchronisé avec le diagramme de classes StarUML.

module.exports = {
  ROLES: ['RH', 'ENCADRANT', 'STAGIAIRE'],

  TASK_TYPES: [
    'Travail', 'Développement', 'Recherche', 'Documentation', 'Formation',
    'Réunion', 'Test', 'Correction', 'Maintenance', 'Idée', 'Personnel', 'Autre',
  ],

  TASK_PRIORITIES: ['Faible', 'Moyenne', 'Haute', 'Urgente'],

  TASK_STATUSES: ['À faire', 'En cours', 'Terminée'],

  NOTIFICATION_TYPES: [
    'NouvelleTâche', 'ChangementStatut', 'NouveauCommentaire',
    'ÉchéanceProche', 'TâcheTerminée', 'AttestationDisponible', 'EvaluationCompetence',
  ],

  SKILL_LEVELS: ['Débutant', 'Intermédiaire', 'Avancé', 'Maîtrisé'],

  ATTESTATION_STATUSES: ['Généré', 'Téléchargé'],

  IMPORT_STATUSES: ['EnCours', 'Terminé', 'Échec'],
};
