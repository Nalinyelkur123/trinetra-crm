const express = require('express');
const { getDocuments, updateDocumentStatus, deleteDocument } = require('../controllers/documentController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticateToken, authorizeRole('admin'), getDocuments);
router.patch('/:id/status', authenticateToken, authorizeRole('admin'), updateDocumentStatus);
router.delete('/:id', authenticateToken, authorizeRole('admin'), deleteDocument);

module.exports = router;
