const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { verifyToken } = require('../middleware/auth');
const enforceTenant = require('../middleware/tenant');
const authorizeRoles = require('../middleware/role');

router.use(verifyToken);
router.use(enforceTenant);

router.get('/', departmentController.getDepartments);
router.post('/', authorizeRoles('Company Admin', 'HR Manager'), departmentController.createDepartment);
router.put('/:id', authorizeRoles('Company Admin', 'HR Manager'), departmentController.updateDepartment);
router.delete('/:id', authorizeRoles('Company Admin', 'HR Manager'), departmentController.deleteDepartment);

module.exports = router;
