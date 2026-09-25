require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dbConfig = require('./config/db');
const requireDb = typeof dbConfig.requireDb === 'function'
  ? dbConfig.requireDb
  : (req, res, next) => next();

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

const path = require('path');

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors());
app.use(express.json());
app.use(auditLogger);

// Static uploads serving
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Global DB Connection Initialization (Essential for Vercel serverless)
app.use(requireDb);

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
  max: process.env.NODE_ENV === 'development' ? 5000 : 200,
  standardHeaders: true,
  legacyHeaders: false,
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

const mountRouter = (path, router) => {
  if (typeof router !== 'function') {
    console.error(`Skipping ${path}: route module did not export an Express router`);
    return;
  }

  apiRouter.use(path, router);
};

// Register Sub-routes
mountRouter('/auth', authRoutes);
mountRouter('/workers', workerRoutes);
mountRouter('/payroll', payrollRoutes);
mountRouter('/dashboard', dashboardRoutes);
mountRouter('/recruitment', recruitmentRoutes);
mountRouter('/documents', documentRoutes);
mountRouter('/clients', clientRoutes);
mountRouter('/invoices', invoiceRoutes);
mountRouter('/expenses', expenseRoutes);
mountRouter('/reports', reportRoutes);
mountRouter('/leaves', leaveRoutes);
mountRouter('/shifts', shiftRoutes);
mountRouter('/tasks', taskRoutes);
mountRouter('/notifications', notificationRoutes);
mountRouter('/performance', performanceRoutes);
mountRouter('/monitoring', monitoringRoutes);
mountRouter('/messages', messageRoutes);

// System Routes
apiRouter.get('/audit', authenticateToken, getAuditLogs);
apiRouter.get('/settings', authenticateToken, getSystemSettings);
apiRouter.post('/settings', authenticateToken, updateSystemSettings);
apiRouter.get('/assignments', authenticateToken, getClientAssignments);
apiRouter.post('/assignments', authenticateToken, createClientAssignment);
apiRouter.put('/assignments/:id', authenticateToken, updateClientAssignment);
apiRouter.post('/assignments/deploy', authenticateToken, assignWorkerToClient);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), port: PORT });
});

app.get('/', (req, res) => {
  res.json({ message: 'Trinetra Backend Active' });
});

// Apply API Router. Vercel services strip routePrefix before forwarding.
app.use('/api', apiRouter);
app.use('/', apiRouter);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
