/**
 * Restreint l'accès à une route à une liste de rôles autorisés.
 * Usage : router.post('/departments', protect, allowRoles('RH'), createDepartment)
 */
function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error('Non autorisé');
    }
    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`Accès refusé : rôle "${req.user.role}" non autorisé pour cette action`);
    }
    next();
  };
}

module.exports = { allowRoles };
