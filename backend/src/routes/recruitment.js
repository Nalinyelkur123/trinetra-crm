const express = require('express');
const router = express.Router();
const { getCandidates, addCandidate, updateCandidateStatus, deleteCandidate } = require('../controllers/recruitmentController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/', authenticateToken, authorizeRole('admin'), getCandidates);
router.post('/', authenticateToken, authorizeRole('admin'), addCandidate);
router.patch('/:id/status', authenticateToken, authorizeRole('admin'), updateCandidateStatus);
router.delete('/:id', authenticateToken, authorizeRole('admin'), deleteCandidate);

module.exports = router;
