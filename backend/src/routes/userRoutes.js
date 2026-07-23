const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');
const enforceTenant = require('../middleware/tenant');
const authorizeRoles = require('../middleware/role');

router.use(verifyToken);
router.use(enforceTenant);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

// Admin/HR endpoints for employee lists and invites
router.get('/', authorizeRoles('Super Admin', 'Company Admin', 'HR Manager', 'Auditor'), userController.getCompanyUsers);
router.post('/invite', authorizeRoles('Company Admin', 'HR Manager'), userController.inviteUser);
router.put('/:id', authorizeRoles('Company Admin', 'HR Manager'), userController.updateUser);

module.exports = router;
