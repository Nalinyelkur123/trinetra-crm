require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initDb } = require('./config/db');

const authRoutes = require('./routes/auth');
const workerRoutes = require('./routes/workers');
const { markAttendance, bulkMarkAttendance, reviewOvertime, getDailyAttendance } = require('./controllers/attendanceController');
const payrollRoutes = require('./routes/payroll');
const dashboardRoutes = require('./routes/dashboard');
const recruitmentRoutes = require('./routes/recruitment');
const documentRoutes = require('./routes/documents');
const clientRoutes = require('./routes/clients');
const invoiceRoutes = require('./routes/invoices');
const expenseRoutes = require('./routes/expenses');
const reportRoutes = require('./routes/reports');
const leaveRoutes = require('./routes/leaves');
const shiftRoutes = require('./routes/shifts');
const taskRoutes = require('./routes/tasks');
const notificationRoutes = require('./routes/notifications');
const performanceRoutes = require('./routes/performance');
const monitoringRoutes = require('./routes/monitoring');
const messageRoutes = require('./routes/messages');
const { authenticateToken } = require('./middleware/auth');
const auditLogger = require('./middleware/auditLogger');

const app = express();
const PORT = process.env.PORT || 5001;

// The database is initialized before starting the server
// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(auditLogger);

// SUPER DIRECT ATTENDANCE ROUTE (Experimental Bypass)
app.get('/api/attendance', authenticateToken, getDailyAttendance);
app.post('/api/attendance', authenticateToken, markAttendance);
app.post('/api/attendance/bulk', authenticateToken, bulkMarkAttendance);
app.put('/api/attendance/overtime/review', authenticateToken, reviewOvertime);

// Unified API Router
const apiRouter = express.Router();

// Rate limiting for API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200 
});
apiRouter.use(limiter);

const { 
  getAuditLogs, 
  getSystemSettings, 
  getClientAssignments, 
  createClientAssignment, 
  assignWorkerToClient,
  updateSystemSettings,
  updateClientAssignment
} = require('./controllers/systemController');

// Register Sub-routes
apiRouter.use('/auth', authRoutes);
apiRouter.use('/workers', workerRoutes);
apiRouter.use('/payroll', payrollRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/recruitment', recruitmentRoutes);
apiRouter.use('/documents', documentRoutes);
apiRouter.use('/clients', clientRoutes);
apiRouter.use('/invoices', invoiceRoutes);
apiRouter.use('/expenses', expenseRoutes);
apiRouter.use('/reports', reportRoutes);
apiRouter.use('/leaves', leaveRoutes);
apiRouter.use('/shifts', shiftRoutes);
apiRouter.use('/tasks', taskRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/performance', performanceRoutes);
apiRouter.use('/monitoring', monitoringRoutes);
apiRouter.use('/messages', messageRoutes);

// System Routes
apiRouter.get('/audit', authenticateToken, getAuditLogs);
apiRouter.get('/settings', authenticateToken, getSystemSettings);
apiRouter.post('/settings', authenticateToken, updateSystemSettings);
apiRouter.get('/assignments', authenticateToken, getClientAssignments);
apiRouter.post('/assignments', authenticateToken, createClientAssignment);
apiRouter.put('/assignments/:id', authenticateToken, updateClientAssignment);
apiRouter.post('/assignments/deploy', authenticateToken, assignWorkerToClient);

// Apply API Router
app.use('/api', apiRouter);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), port: PORT });
});

app.get('/', (req, res) => {
  res.json({ message: 'Trinetra Backend Active' });
});

if (require.main === module) {
  initDb().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  });
}

module.exports = app;
