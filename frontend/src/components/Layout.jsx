import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Calendar, Briefcase, DollarSign, Settings, 
  LogOut, Menu, X, Bell, LayoutDashboard, FileText, Search, UserPlus, Shield, Activity, RefreshCw, Building2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import ThemeToggle from './ThemeToggle';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuthStore();
  const { theme } = useThemeStore();
  const location = useLocation();

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
  }, [theme]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
           <RefreshCw className="animate-spin text-primary" size={40} />
           <p className="caption">Initializing System Core...</p>
        </div>
      </div>
    );
  }

  const getMenuItems = () => {
    switch(user.role) {
      case 'admin':
        return [
          { name: 'Overview', icon: LayoutDashboard, path: '/admin' },
          { name: 'Clients', icon: Building2, path: '/admin/clients' },
          { name: 'Workforce', icon: Users, path: '/admin/workers' },
          { name: 'Attendance', icon: Calendar, path: '/admin/attendance' },
          { name: 'Billing Hub', icon: FileText, path: '/admin/billing' },
          { name: 'Recruitment', icon: UserPlus, path: '/admin/recruitment' },
          { name: 'Payroll Hub', icon: DollarSign, path: '/admin/payroll' },
          { name: 'Expenses', icon: Activity, path: '/admin/expenses' },
          { name: 'Audit Trail', icon: Shield, path: '/admin/audit' },
          { name: 'Reports', icon: Activity, path: '/admin/reports' },
          { name: 'Leaves', icon: Calendar, path: '/admin/leaves' },
          { name: 'Shifts', icon: Clock, path: '/admin/shifts' },
          { name: 'Tasks', icon: Briefcase, path: '/admin/tasks' },
          { name: 'Settings', icon: Settings, path: '/admin/settings' },
        ];
      case 'supervisor':
        return [
          { name: 'Overview', icon: LayoutDashboard, path: '/admin' },
          { name: 'Attendance', icon: Calendar, path: '/admin/attendance' },
          { name: 'Workforce', icon: Users, path: '/admin/workers' },
        ];
      case 'client':
        return [
          { name: 'Project Overview', icon: LayoutDashboard, path: '/admin/projects' },
          { name: 'Attendance Logs', icon: Calendar, path: '/admin/attendance' },
          { name: 'Invoice History', icon: FileText, path: '/admin/billing' },
        ];
      case 'worker':
      default:
        return [
          { name: 'Dashboard', icon: LayoutDashboard, path: '/worker' },
          { name: 'Identity', icon: Users, path: '/worker/profile' },
          { name: 'Attendance', icon: Calendar, path: '/worker/attendance' },
          { name: 'Documents', icon: FileText, path: '/worker/documents' },
          { name: 'Payslips', icon: DollarSign, path: '/worker/payslips' },
        ];
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Side Navbar - Enhanced Professional Design */}
      <motion.aside 
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 80 }}
        className={`bg-card border-r border-border fixed h-full z-40 flex flex-col shadow-sm hover:shadow-md transition-all duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-20 px-6 flex items-center justify-between border-b border-border/50 shrink-0 bg-gradient-to-r from-primary/5 to-transparent">
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                  <Briefcase size={18} className="text-white" />
                </div>
                <span className="text-base font-black tracking-tighter bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">TRINETRA</span>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 hover:bg-secondary/50 rounded-lg transition-all text-muted-foreground hover:text-foreground"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </motion.button>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <Link key={item.path} to={item.path} onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}>
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                  location.pathname === item.path 
                    ? 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/20' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50 group'
                }`}
              >
                <motion.div
                  animate={{ rotate: location.pathname === item.path ? 360 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <item.icon size={20} className={location.pathname === item.path ? 'text-white' : 'group-hover:text-primary'} />
                </motion.div>
                {sidebarOpen && <span className="font-bold text-sm whitespace-nowrap">{item.name}</span>}
              </motion.div>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border/50 bg-gradient-to-t from-secondary/5 to-transparent">
          <motion.button 
            onClick={logout}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center gap-4 px-4 py-3 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all duration-200"
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="font-bold text-sm">Sign Out</span>}
          </motion.button>
        </div>
      </motion.aside>

      {/* Content Area */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'md:ml-[260px]' : 'md:ml-[80px]'}`}>
        <header className="h-20 bg-card/95 border-b border-border flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 shadow-sm hover:shadow-md transition-shadow duration-300 backdrop-blur-sm">
          <div className="flex items-center gap-3 md:gap-6">
            <motion.button 
              onClick={() => setSidebarOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="md:hidden p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
            >
              <Menu size={20} />
            </motion.button>
            <p className="caption hidden md:block">Command Center</p>
            <motion.div 
              className="relative hidden sm:block"
              whileFocus={{ scale: 1.02 }}
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
              <motion.input 
                type="text" 
                placeholder="Search system..." 
                className="bg-secondary/30 border border-border/50 rounded-xl py-2.5 pl-10 pr-4 text-sm w-48 md:w-64 focus:w-80 transition-all outline-none focus:border-primary focus:shadow-md focus:bg-secondary/50"
                whileFocus={{ boxShadow: '0 0 20px rgba(59, 130, 246, 0.1)' }}
              />
            </motion.div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 pr-4 border-r border-border">
              <ThemeToggle />
              <motion.button 
                whileHover={{ scale: 1.05, rotate: 10 }}
                whileTap={{ scale: 0.95 }}
                className="p-2.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-all hover:shadow-md"
              >
                <Bell size={20} />
              </motion.button>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-none">{user?.name || 'Admin'}</p>
                <p className="text-[10px] bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent font-black uppercase mt-1">Verified</p>
              </div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-black shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
              >
                {user?.name?.[0] || 'A'}
              </motion.div>
            </div>
          </div>
        </header>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-[calc(100vh-80px)]"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
};

export default Layout;
