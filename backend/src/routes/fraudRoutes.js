const express = require('express');
const router = express.Router();
const fraudController = require('../controllers/fraudController');
const { verifyToken } = require('../middleware/auth');
const enforceTenant = require('../middleware/tenant');
const authorizeRoles = require('../middleware/role');

router.use(verifyToken);
router.use(enforceTenant);

router.get('/cases', authorizeRoles('Company Admin', 'Auditor'), fraudController.getFraudCases);
router.post('/cases/:id/resolve', authorizeRoles('Company Admin', 'Auditor'), fraudController.resolveFraudCase);

module.exports = router;
