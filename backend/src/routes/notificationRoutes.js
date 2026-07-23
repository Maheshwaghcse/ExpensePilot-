const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/auth');
const enforceTenant = require('../middleware/tenant');

router.use(verifyToken);
router.use(enforceTenant);

router.get('/', notificationController.getNotifications);
router.post('/:id/read', notificationController.markAsRead);
router.post('/read-all', notificationController.markAllAsRead);

module.exports = router;
