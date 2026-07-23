const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receiptController');
const { verifyToken } = require('../middleware/auth');
const enforceTenant = require('../middleware/tenant');
const upload = require('../middleware/upload');

router.use(verifyToken);
router.use(enforceTenant);

// 'receipt' is the fieldname for the uploaded file in multipart form
router.post('/upload', upload.single('receipt'), receiptController.uploadReceipt);
router.get('/:id/status', receiptController.getReceiptStatus);

module.exports = router;
