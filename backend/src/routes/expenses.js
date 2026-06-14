const express = require('express');
const router = express.Router();
const { getExpenses, createExpense, getClientProfitability, deleteExpense } = require('../controllers/expenseController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, getExpenses);
router.post('/', authenticateToken, createExpense);
router.get('/profitability', authenticateToken, getClientProfitability);
router.delete('/:id', authenticateToken, deleteExpense);

module.exports = router;
