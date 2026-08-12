const asyncHandler = require('express-async-handler');
const TaskHistory = require('../models/TaskHistory');

/**
 * GET /api/tasks/:taskId/history
 */
const getTaskHistory = asyncHandler(async (req, res) => {
  const history = await TaskHistory.find({ task: req.params.taskId })
    .populate('performedBy', 'firstName lastName role')
    .sort('timestamp');
  res.json(history);
});

module.exports = { getTaskHistory };
