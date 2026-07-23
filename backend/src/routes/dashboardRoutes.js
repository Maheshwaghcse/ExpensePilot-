const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/auth');
const enforceTenant = require('../middleware/tenant');

router.use(verifyToken);
router.use(enforceTenant);

router.get('/analytics', dashboardController.getDashboardAnalytics);

module.exports = router;
