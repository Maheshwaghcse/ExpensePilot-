const express = require('express');
const router = express.Router();
const policyController = require('../controllers/policyController');
const { verifyToken } = require('../middleware/auth');
const enforceTenant = require('../middleware/tenant');
const authorizeRoles = require('../middleware/role');

router.use(verifyToken);
router.use(enforceTenant);

router.get('/', policyController.getPolicies);
router.post('/', authorizeRoles('Company Admin'), policyController.createPolicy);
router.put('/:id', authorizeRoles('Company Admin'), policyController.updatePolicy);
router.delete('/:id', authorizeRoles('Company Admin'), policyController.deletePolicy);

module.exports = router;
