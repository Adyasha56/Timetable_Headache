const router = require('express').Router();
const controller = require('./override.controller');
const { authenticate, authorize } = require('../../common/middleware/auth.middleware');

router.use(authenticate);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/absence', authorize('admin', 'hod', 'faculty'), controller.createAbsence);
router.post('/room-block', authorize('admin', 'hod'), controller.createRoomBlock);
router.post('/extra-class', authorize('admin', 'hod'), controller.createExtraClass);
router.delete('/:id', authorize('admin', 'hod'), controller.remove);

module.exports = router;
