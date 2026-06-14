const express = require('express');
const { 
  addWorker, 
  updateWorker, 
  deleteWorker, 
  getWorkers, 
  getWorkerDetails 
} = require('../controllers/workerController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const router = express.Router();

router.post('/', authenticateToken, authorizeRole('admin'), upload.fields([
  { name: 'aadhaar_file', maxCount: 1 },
  { name: 'pan_file', maxCount: 1 }
]), addWorker);
router.get('/', authenticateToken, authorizeRole('admin'), getWorkers);
router.get('/:id', authenticateToken, getWorkerDetails);
router.put('/:id', authenticateToken, authorizeRole('admin'), upload.fields([
  { name: 'aadhaar_file', maxCount: 1 },
  { name: 'pan_file', maxCount: 1 }
]), updateWorker);
router.delete('/:id', authenticateToken, authorizeRole('admin'), deleteWorker);

module.exports = router;
