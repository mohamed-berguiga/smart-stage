const asyncHandler = require('express-async-handler');
const Department = require('../models/Department');

const createDepartment = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) {
    res.status(400);
    throw new Error('Le nom du département est requis');
  }
  const department = await Department.create({ name });
  res.status(201).json(department);
});

const getDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find().sort('name');
  res.json(departments);
});

const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!department) {
    res.status(404);
    throw new Error('Département introuvable');
  }
  res.json(department);
});

const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findByIdAndDelete(req.params.id);
  if (!department) {
    res.status(404);
    throw new Error('Département introuvable');
  }
  res.json({ message: 'Département supprimé', id: req.params.id });
});

module.exports = { createDepartment, getDepartments, updateDepartment, deleteDepartment };
