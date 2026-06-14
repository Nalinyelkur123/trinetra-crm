const express = require('express');
const router = express.Router();
const { getInvoices, generateInvoice, updateInvoiceStatus, deleteInvoice, createInvoice } = require('../controllers/invoiceController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, getInvoices);
router.post('/', authenticateToken, createInvoice);
router.post('/generate', authenticateToken, generateInvoice);
router.patch('/:id/status', authenticateToken, updateInvoiceStatus);
router.delete('/:id', authenticateToken, deleteInvoice);

module.exports = router;
