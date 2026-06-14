import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User as UserIcon, Loader2, ArrowRight, ShieldCheck, Smartphone, AlertCircle } from 'lucide-react';
import axios from 'axios';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setAuth = useAuthStore((state) => state.setAuth);
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('/api/auth/login', { identifier, password });
      const { user, token } = response.data;
      setAuth(user, token);
      navigate(user.role === 'admin' ? '/admin' : '/worker');
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500 bg-background`}>
      {/* Background Subtle Gradient */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[1000px] grid grid-cols-1 lg:grid-cols-2 rounded-[2.5rem] border border-border shadow-2xl shadow-black/5 overflow-hidden z-10 glass"
      >
        {/* Branding Side */}
        <div className="hidden lg:flex flex-col justify-between p-16 bg-primary relative">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-16">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <ShieldCheck className="text-primary" size={24} />
              </div>
              <span className="text-2xl font-black text-white tracking-tighter">TRINETRA</span>
            </div>
            <h1 className="text-5xl font-black text-white leading-[1.1] mb-8 tracking-tighter">
              Precision <br /> 
              Workforce <br />
              <span className="opacity-60">Intelligence.</span>
            </h1>
            <p className="text-white/80 text-lg font-medium leading-relaxed max-w-sm">
              The professional command center for streamlined manpower deployment and real-time operational oversight.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-6">
            <div className="p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
              <p className="text-white font-black text-2xl tracking-tighter">12.8k</p>
              <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest mt-1">Personnel</p>
            </div>
            <div className="p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
              <p className="text-white font-black text-2xl tracking-tighter">99.2%</p>
              <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest mt-1">Efficiency</p>
            </div>
          </div>
        </div>

        {/* Login Form Side */}
        <div className={`p-10 lg:p-16 flex flex-col justify-center bg-card`}>
          <div className="mb-12">
            <h2 className="text-3xl font-black mb-2 tracking-tight text-foreground">Access Portal</h2>
            <p className="text-muted-foreground font-medium text-sm">Sign in to engage the tactical management grid.</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-xs font-bold flex items-center gap-3"
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="caption ml-1">Login Identity</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="text"
                  required
                  className="w-full input-field pl-12"
                  placeholder="Phone or Email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="caption">Access Key</label>
                <button type="button" className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">Forgot Key?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="password"
                  required
                  className="w-full input-field pl-12"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 flex items-center justify-center gap-3 group"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  Engage Command System
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Demo Details */}
           <div className={`mt-12 p-6 rounded-3xl bg-secondary/50 border border-border`}>
            <h4 className="caption mb-4">Credentials Ledger</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Administrator</p>
                <code className="text-xs text-primary font-bold">admin@trinetra.com</code>
                <p className="text-[9px] text-muted-foreground font-semibold mt-1">Key: admin123</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Personnel Hub</p>
                <code className="text-xs text-indigo-500 font-bold">suresh@trinetra.com</code>
                <p className="text-[9px] text-muted-foreground font-semibold mt-1">Key: worker123</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
