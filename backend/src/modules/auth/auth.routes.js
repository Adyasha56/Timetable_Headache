const router = require('express').Router();
const controller = require('./auth.controller');
const { authenticate } = require('../../common/middleware/auth.middleware');

router.post('/login', controller.login);
router.post('/logout', authenticate, controller.logout);
router.get('/me', authenticate, controller.me);

module.exports = router;
