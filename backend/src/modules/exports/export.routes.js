const router = require('express').Router();
const controller = require('./export.controller');
const { authenticate } = require('../../common/middleware/auth.middleware');

router.use(authenticate);

router.get('/:scheduleId/pdf', controller.pdf);
router.get('/:scheduleId/ical', controller.ical);

module.exports = router;
