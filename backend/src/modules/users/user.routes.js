const router = require('express').Router();
const controller = require('./user.controller');
const { authenticate, authorize } = require('../../common/middleware/auth.middleware');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
