const express = require('express');
const {
  createTask, getTasks, getTaskById, updateTask, changeTaskStatus, deleteTask,
} = require('../controllers/taskController');
const { addComment, getComments } = require('../controllers/commentController');
const { uploadAttachment, getAttachments } = require('../controllers/attachmentController');
const { getTaskHistory } = require('../controllers/taskHistoryController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(protect); // toutes les routes tâches nécessitent d'être connecté ; le scope RBAC
                      // est ensuite appliqué finement dans buildScopeFilter() (taskController)

router.route('/')
  .post(createTask)
  .get(getTasks);

router.route('/:id')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

router.patch('/:id/status', changeTaskStatus);

// Sous-ressources
router.route('/:taskId/comments')
  .post(addComment)
  .get(getComments);

router.route('/:taskId/attachments')
  .post(upload.single('file'), uploadAttachment)
  .get(getAttachments);

router.get('/:taskId/history', getTaskHistory);

module.exports = router;
