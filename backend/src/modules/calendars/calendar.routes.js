const router = require('express').Router();
const controller = require('./calendar.controller');
const { authenticate, authorize } = require('../../common/middleware/auth.middleware');

router.use(authenticate);

router.get('/', controller.getAll);
router.post('/rollover', authorize('admin'), controller.rolloverCalendar);
router.get('/:semesterId', controller.getById);
router.post('/', authorize('admin'), controller.create);
router.patch('/:semesterId', authorize('admin'), controller.update);
router.delete('/:semesterId', authorize('admin'), controller.remove);

module.exports = router;
