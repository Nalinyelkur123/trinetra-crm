import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import Workers from './pages/Workers';
import Attendance from './pages/Attendance';
import Payroll from './pages/Payroll';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Recruitment from './pages/Recruitment';
import AuditLogs from './pages/AuditLogs';
import axios from 'axios';
import Layout from './components/Layout';
import OnboardingPage from './pages/OnboardingPage';
import Documents from './pages/Documents';
import Clients from './pages/Clients';
import Billing from './pages/Billing';
import Expenses from './pages/Expenses';
import Leaves from './pages/Leaves';
import Shifts from './pages/Shifts';
import Tasks from './pages/Tasks';

// Configure Axios Defaults
axios.defaults.baseURL = ''; // Use relative paths for proxy

// Setup interceptors once at module level (not inside component to prevent duplication)
let requestInterceptorId = null;
let responseInterceptorId = null;

function setupAxiosInterceptors(token, logout) {
  // Eject previous interceptors before adding new ones
  if (requestInterceptorId !== null) axios.interceptors.request.eject(requestInterceptorId);
  if (responseInterceptorId !== null) axios.interceptors.response.eject(responseInterceptorId);

  requestInterceptorId = axios.interceptors.request.use((config) => {
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  responseInterceptorId = axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401 || error.response?.status === 403) logout();
      return Promise.reject(error);
    }
  );
}

function App() {
  const { user, token, logout } = useAuthStore();

  // Setup interceptors whenever token changes (ejects old ones first)
  setupAxiosInterceptors(token, logout);

  return (
    <Routes>
      <Route path="/login" element={!token ? <Login /> : <Navigate to={user?.role === 'admin' ? '/admin' : '/worker'} />} />
      
      <Route element={<Layout />}>
        <Route path="/admin" element={token && user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />} />
        <Route path="/admin/workers" element={token && user?.role === 'admin' ? <Workers /> : <Navigate to="/login" />} />
        <Route path="/admin/workers/new" element={token && user?.role === 'admin' ? <OnboardingPage /> : <Navigate to="/login" />} />
        <Route path="/admin/workers/edit/:id" element={token && user?.role === 'admin' ? <OnboardingPage /> : <Navigate to="/login" />} />
        <Route path="/admin/attendance" element={token && user?.role === 'admin' ? <Attendance /> : <Navigate to="/login" />} />

        <Route path="/admin/payroll" element={token && user?.role === 'admin' ? <Payroll /> : <Navigate to="/login" />} />
        <Route path="/admin/leaves" element={token && user?.role === 'admin' ? <Leaves /> : <Navigate to="/login" />} />
        <Route path="/admin/shifts" element={token && user?.role === 'admin' ? <Shifts /> : <Navigate to="/login" />} />
        <Route path="/admin/tasks" element={token && user?.role === 'admin' ? <Tasks /> : <Navigate to="/login" />} />
        <Route path="/admin/reports" element={token && user?.role === 'admin' ? <Reports /> : <Navigate to="/login" />} />
        <Route path="/admin/documents" element={token && user?.role === 'admin' ? <Documents /> : <Navigate to="/login" />} />
        <Route path="/admin/settings" element={token && user?.role === 'admin' ? <Settings /> : <Navigate to="/login" />} />
        <Route path="/admin/recruitment" element={token && user?.role === 'admin' ? <Recruitment /> : <Navigate to="/login" />} />
        <Route path="/admin/clients" element={token && user?.role === 'admin' ? <Clients /> : <Navigate to="/login" />} />
        <Route path="/admin/billing" element={token && user?.role === 'admin' ? <Billing /> : <Navigate to="/login" />} />
        <Route path="/admin/expenses" element={token && user?.role === 'admin' ? <Expenses /> : <Navigate to="/login" />} />
        <Route path="/admin/audit" element={token && user?.role === 'admin' ? <AuditLogs /> : <Navigate to="/login" />} />
        <Route 
          path="/worker" 
          element={token && user?.role === 'worker' ? <WorkerDashboard /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/worker/profile" 
          element={token && user?.role === 'worker' ? <WorkerDashboard defaultTab="profile" /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/worker/attendance" 
          element={token && user?.role === 'worker' ? <WorkerDashboard defaultTab="attendance" /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/worker/documents" 
          element={token && user?.role === 'worker' ? <WorkerDashboard defaultTab="documents" /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/worker/payslips" 
          element={token && user?.role === 'worker' ? <WorkerDashboard defaultTab="payslips" /> : <Navigate to="/login" />} 
        />
      </Route>

      <Route path="/" element={<Navigate to={token ? (user?.role === 'admin' ? '/admin' : '/worker') : '/login'} />} />
    </Routes>
  );
}

export default App;
