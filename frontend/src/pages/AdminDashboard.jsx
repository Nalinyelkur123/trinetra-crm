import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Calendar, Briefcase, DollarSign, TrendingUp, AlertCircle, 
  ArrowUpRight, Filter, ChevronRight, ShieldCheck, 
  ArrowUp, ArrowDown, CheckCircle2, MapPin, UserPlus, X
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import axios from 'axios';

const COLORS = ['#2563eb', '#6366f1', '#f43f5e', '#10b981'];

const StatCard = ({ title, value, icon: Icon, change, trend, loading }) => (
  <motion.div whileHover={{ y: -4 }} className="card-premium p-6">
    {loading ? (
      <div className="animate-pulse space-y-4">
        <div className="h-10 w-10 bg-secondary rounded-xl" />
        <div className="h-4 w-24 bg-secondary rounded" />
        <div className="h-8 w-16 bg-secondary rounded" />
      </div>
    ) : (
      <>
        <div className="flex justify-between items-start">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Icon size={20} />
          </div>
          {change && (
            <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${trend === 'up' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
              {trend === 'up' ? <ArrowUp size={10} /> : <ArrowDown size={10} />} {change}
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="caption">{title}</p>
          <p className="text-2xl font-black mt-1 text-foreground">{value}</p>
        </div>
      </>
    )}
  </motion.div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [newNote, setNewNote] = useState({ content: '', priority: 'normal' });

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleAddNote = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/dashboard/notes', newNote);
      setShowNoteModal(false);
      setNewNote({ content: '', priority: 'normal' });
      fetchStats();
    } catch (err) {
      console.error('Failed to save note');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Work Hub</h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">Comprehensive workforce management & operational overview</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary px-5 py-2.5 text-xs shadow-sm">
            <Filter size={16} className="mr-2" /> Filters
          </button>
          <button className="btn-primary px-5 py-2.5 text-xs">
            <ShieldCheck size={18} className="mr-2" /> Audit Trail
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Personnel" 
          value={stats?.summary?.totalWorkers ?? '0'} 
          icon={Users} 
          loading={loading}
        />
        <StatCard 
          title="Active Deployment" 
          value={stats?.summary?.activeWorkers ?? '0'} 
          icon={Briefcase} 
          change={stats ? `${stats.summary.deploymentRate}%` : null}
          trend="up"
          loading={loading}
        />
        <StatCard 
          title="Attendance Today" 
          value={stats?.summary?.todayAttendance?.present ?? '0'} 
          icon={Calendar} 
          loading={loading}
        />
        <StatCard 
          title="System Integrity" 
          value="99.9%" 
          icon={ShieldCheck} 
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
           {/* Attendance Trend Chart */}
           <div className="card-premium p-8">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-xl font-black">Personnel Engagement</h3>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">Real-time attendance & operational flux</p>
                </div>
                <div className="flex gap-2 p-1 bg-secondary/50 rounded-xl">
                   {['7D', '1M', '3M'].map(t => (
                     <button key={t} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${t === '7D' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>{t}</button>
                   ))}
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.trend || []}>
                    <defs>
                      <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} dx={-10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}
                      itemStyle={{ fontSize: '12px', fontWeight: '800', color: '#2563eb' }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#2563eb" fillOpacity={1} fill="url(#colorAttendance)" strokeWidth={4} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
           </div>
         </div>


        <div className="lg:col-span-4 space-y-8">
           {/* Administrative Notes */}
           <div className="card-premium p-8 bg-primary text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16" />
              <h3 className="text-xl font-black mb-6">Strategic Notes</h3>
              <div className="space-y-4">
                 {stats?.notes?.map((note, i) => (
                    <div key={i} className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-all cursor-default">
                       <div className="flex justify-between items-start mb-2">
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${note.priority === 'high' ? 'bg-rose-500' : 'bg-emerald-500'}`}>
                             {note.priority}
                          </span>
                          <p className="text-[8px] opacity-60 font-bold">{new Date(note.created_at).toLocaleDateString()}</p>
                       </div>
                       <p className="text-xs font-medium leading-relaxed">{note.content}</p>
                    </div>
                 ))}
                 {!stats?.notes?.length && <p className="text-xs opacity-60">No pending reminders.</p>}
              </div>
              <button 
                 onClick={() => setShowNoteModal(true)}
                 className="w-full mt-6 py-4 bg-white text-primary rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-black/10"
               >
                  Append Note
               </button>
           </div>

           {/* Pending Leaves */}
           <div className="card-premium p-8">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-xl font-black">Pending Leaves</h3>
                 <Calendar className="text-muted-foreground/30" size={20} />
              </div>
              <div className="space-y-4">
                 {stats?.leaves?.map((leave, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-secondary/30 rounded-2xl border border-border/50">
                       <div>
                          <p className="text-sm font-bold text-foreground">{leave.worker_name}</p>
                          <p className="text-[10px] font-black text-rose-500 uppercase mt-0.5">{leave.type}</p>
                       </div>
                       <button className="p-2 bg-white rounded-xl shadow-sm text-primary hover:bg-primary hover:text-white transition-all">
                          <ChevronRight size={16} />
                       </button>
                    </div>
                 ))}
                 {!stats?.leaves?.length && <p className="text-xs text-center py-4 text-muted-foreground">No pending leave requests.</p>}
              </div>
              <button className="w-full mt-6 py-3 border border-border rounded-xl text-[10px] font-black text-muted-foreground uppercase hover:bg-secondary transition-all">
                 View All Requests
              </button>
           </div>

           {/* Deployment Mix (Mini) */}
           <div className="card-premium p-8">
              <h3 className="text-xl font-black mb-6">Site Allocation</h3>
              <div className="space-y-4">
                 {stats?.assignments?.slice(0, 4).map((item, i) => (
                    <div key={i} className="space-y-2">
                       <div className="flex justify-between items-end">
                          <p className="text-[10px] font-black text-foreground truncate max-w-[150px]">{item.assignment_name}</p>
                          <span className="text-[10px] font-black text-primary">{item.worker_count} Staff</span>
                       </div>
                       <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: stats?.summary?.activeWorkers > 0 ? `${(item.worker_count / stats.summary.activeWorkers) * 100}%` : '0%' }} />
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      <AnimatePresence>
        {showNoteModal && (
          <div className="modal-overlay">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-[2.5rem] shadow-2xl p-10 max-w-lg w-full"
            >
               <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black">Strategic Reminder</h2>
                  <button onClick={() => setShowNoteModal(false)}><X size={24} /></button>
               </div>
               <form onSubmit={handleAddNote} className="space-y-6">
                  <div className="space-y-2">
                     <label className="caption">Note Content</label>
                     <textarea 
                       required
                       className="input-field w-full min-h-[120px] py-4"
                       value={newNote.content}
                       onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                       placeholder="Enter critical operational note..."
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="caption">Priority Level</label>
                     <div className="flex gap-4">
                        {['normal', 'high'].map(p => (
                          <button 
                            key={p}
                            type="button"
                            onClick={() => setNewNote({...newNote, priority: p})}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${newNote.priority === p ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}
                          >
                            {p}
                          </button>
                        ))}
                     </div>
                  </div>
                  <button type="submit" className="btn-primary w-full py-4 mt-4">Save to Ledger</button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
