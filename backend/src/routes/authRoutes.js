const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateFields } = require('../middleware/validator');

router.post('/register', validateFields(['name', 'email', 'password', 'companyName']), authController.register);
router.post('/verify-email', validateFields(['token']), authController.verifyEmail);
router.post('/login', validateFields(['email', 'password']), authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/forgot-password', validateFields(['email']), authController.forgotPassword);
router.post('/reset-password', validateFields(['token', 'newPassword']), authController.resetPassword);

module.exports = router;
