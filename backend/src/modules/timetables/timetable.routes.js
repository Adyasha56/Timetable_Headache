const router = require('express').Router();
const controller = require('./timetable.controller');
const { authenticate, authorize } = require('../../common/middleware/auth.middleware');

router.use(authenticate);

router.get('/', controller.getAll);
router.post('/generate', authorize('admin', 'hod'), controller.generate);
router.get('/:scheduleId', controller.getById);
router.get('/:scheduleId/status', controller.getStatus);
router.post('/:scheduleId/lock', authorize('admin', 'hod'), controller.lock);
router.post('/:scheduleId/publish', authorize('admin'), controller.publish);

module.exports = router;
