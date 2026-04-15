const router = require('express').Router();
const controller = require('./subject.controller');
const { authenticate, authorize } = require('../../common/middleware/auth.middleware');

router.use(authenticate);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', authorize('admin', 'hod'), controller.create);
router.patch('/:id', authorize('admin', 'hod'), controller.update);
router.delete('/:id', authorize('admin'), controller.remove);

module.exports = router;
