/**
 * Gère les routes non trouvées (404).
 */
function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Route non trouvée : ${req.originalUrl}`));
}

/**
 * Gestionnaire d'erreurs centralisé. Toute erreur levée (throw new Error(...))
 * dans un contrôleur ou middleware protégé par express-async-handler termine ici.
 */
function errorHandler(err, req, res, next) {
  // Si un contrôleur a levé une erreur sans définir de status, on force 500
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  // Erreurs de validation Mongoose
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Erreur de validation',
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  // Doublon (ex : email déjà utilisé)
  if (err.code === 11000) {
    return res.status(409).json({
      message: 'Conflit : une ressource avec ces données existe déjà',
      field: Object.keys(err.keyPattern || {}),
    });
  }

  res.status(statusCode).json({
    message: err.message || 'Erreur serveur',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
}

module.exports = { notFound, errorHandler };
