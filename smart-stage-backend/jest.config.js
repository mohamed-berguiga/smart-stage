module.exports = {
  testEnvironment: 'node',
  // mongodb-memory-server télécharge un binaire MongoDB au premier lancement
  // (une seule fois, mis en cache ensuite) — le timeout est augmenté pour
  // laisser le temps à ce téléchargement de se faire sans faire échouer les tests.
  testTimeout: 30000,
  testPathIgnorePatterns: ['/node_modules/'],
};