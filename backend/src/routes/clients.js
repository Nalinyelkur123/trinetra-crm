const express = require('express');
const router = express.Router();
const { getClients, getClientWorkforce, createClient, updateClient, deleteClient } = require('../controllers/clientController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, getClients);
router.get('/:id/workforce', authenticateToken, getClientWorkforce);
router.post('/', authenticateToken, createClient);
router.put('/:id', authenticateToken, updateClient);
router.delete('/:id', authenticateToken, deleteClient);

module.exports = router;
