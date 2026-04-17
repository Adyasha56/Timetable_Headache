const router = require('express').Router();
const controller = require('./notification.controller');
const { authenticate } = require('../../common/middleware/auth.middleware');

router.use(authenticate);

router.get('/', controller.getAll);
router.get('/unread-count', controller.getUnreadCount);
router.patch('/mark-all-read', controller.markAllRead);
router.patch('/:id/read', controller.markRead);

module.exports = router;
