const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Stage = require('../models/Stage');

/**
 * POST /api/users
 * Seul le RH peut créer un compte (RH, Encadrant ou Stagiaire). Pas d'inscription publique.
 */
const createUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, phone, role, department, startDate, endDate } = req.body;

  if (!firstName || !lastName || !email || !password || !role) {
    res.status(400);
    throw new Error('firstName, lastName, email, password et role sont obligatoires');
  }

  const user = await User.create({
    firstName, lastName, email, password, phone, role, department, startDate, endDate,
  });

  res.status(201).json(user);
});

/**
 * GET /api/users?role=STAGIAIRE&department=...
 */
const getUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.department) filter.department = req.query.department;

  const users = await User.find(filter).populate('department', 'name').sort('-createdAt');
  res.json(users);
});

/**
 * GET /api/users/my-stagiaires
 * Un encadrant ne voit QUE ses propres stagiaires.
 *
 * Défensif : si une affectation (Stage) pointe vers un stagiaire supprimé
 * entre-temps (référence orpheline), on l'ignore plutôt que de planter.
 */
const getMyStagiaires = asyncHandler(async (req, res) => {
  const stages = await Stage.find({ encadrant: req.user._id }).populate({
    path: 'stagiaire',
    populate: { path: 'department', select: 'name' },
  });
  res.json(stages.map((s) => s.stagiaire).filter(Boolean));
});

/**
 * GET /api/users/:id
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate('department', 'name');
  if (!user) {
    res.status(404);
    throw new Error('Utilisateur introuvable');
  }
  res.json(user);
});

/**
 * PUT /api/users/:id  (RH uniquement)
 */
const updateUser = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  delete updates.password;

  const user = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    res.status(404);
    throw new Error('Utilisateur introuvable');
  }
  res.json(user);
});

/**
 * PATCH /api/users/:id/status  (RH uniquement)
 */
const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('Utilisateur introuvable');
  }
  user.status = !user.status;
  await user.save();
  res.json(user);
});

/**
 * DELETE /api/users/:id  (RH uniquement)
 *
 * Nettoie aussi les affectations (Stage) qui référencent cet utilisateur,
 * qu'il soit stagiaire ou encadrant, pour éviter les références orphelines.
 */
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('Utilisateur introuvable');
  }

  await Stage.deleteMany({ $or: [{ stagiaire: req.params.id }, { encadrant: req.params.id }] });

  res.json({ message: 'Utilisateur supprimé', id: req.params.id });
});

module.exports = {
  createUser,
  getUsers,
  getMyStagiaires,
  getUserById,
  updateUser,
  toggleUserStatus,
  deleteUser,
};