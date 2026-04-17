const router = require('express').Router();
const controller = require('./audit.controller');
const { authenticate, authorize } = require('../../common/middleware/auth.middleware');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/', controller.getAll);

module.exports = router;
