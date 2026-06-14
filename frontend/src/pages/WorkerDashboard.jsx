import { motion } from 'framer-motion';
import { 
  Calendar, FileText, IndianRupee, Clock, CheckCircle2, 
  AlertCircle, ArrowUpRight, MapPin, Briefcase 
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <motion.div 
    whileHover={{ y: -4 }}
    className="glass-dark p-6 rounded-3xl border border-white/5 relative overflow-hidden group"
  >
    <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-500/10 blur-[50px] rounded-full translate-x-10 -translate-y-10 group-hover:bg-${color}-500/20 transition-all`} />
    <div className="flex justify-between items-start relative z-10">
      <div className={`p-3 rounded-2xl bg-${color}-500/10 text-${color}-500`}>
        <Icon size={24} />
      </div>
      <button className="text-slate-500 hover:text-white transition-colors">
        <ArrowUpRight size={18} />
      </button>
    </div>
    <div className="mt-6 relative z-10">
      <p className="text-slate-400 text-sm font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
    </div>
  </motion.div>
);

const WorkerDashboard = () => {
  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Work Hub</h1>
          <p className="text-slate-400 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Active Session: <span className="text-slate-300 font-medium">Green Meadows Phase 2</span>
          </p>
        </div>
        <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md">
          <button className="px-6 py-2.5 rounded-xl bg-primary-600 text-white font-bold text-sm shadow-lg shadow-primary-600/20 transition-all">Check-in</button>
          <button className="px-6 py-2.5 rounded-xl text-slate-400 font-bold text-sm hover:text-white transition-all">My History</button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Stats */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <StatCard title="Earnings (Oct)" value="₹24,500" icon={IndianRupee} color="green" />
             <StatCard title="Days Attended" value="22 / 26" icon={Calendar} color="blue" />
          </div>

          {/* Job Details Card */}
          <div className="glass-dark p-8 rounded-[32px] border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/5 blur-[80px] rounded-full" />
            <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
              <Briefcase size={20} className="text-primary-500" /> Current Assignment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <div className="space-y-6">
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Project Site</p>
                  <p className="text-xl font-semibold text-white">Green Meadows Phase 2</p>
                  <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5">
                    <MapPin size={14} /> Sector 44, Gurgaon, HR
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Supervisor</p>
                  <p className="text-lg font-semibold text-white">Mr. Rajesh Khanna</p>
                  <p className="text-sm text-primary-500">+91 98123 45678</p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Shift Schedule</p>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-800 text-white">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-white">09:00 AM - 06:00 PM</p>
                      <p className="text-sm text-slate-400">Regular Day Shift</p>
                    </div>
                  </div>
                </div>
                <div className="pt-2">
                   <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full w-3/4 bg-gradient-to-r from-primary-600 to-blue-500 rounded-full" />
                   </div>
                   <p className="text-xs text-slate-500 mt-2">Shift progress: 75% completed</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-6">
          <div className="glass-dark p-6 rounded-[32px] border border-white/5 h-full">
            <h3 className="text-lg font-bold text-white mb-6">Verification Hub</h3>
            <div className="space-y-4">
              {[
                { name: 'Aadhaar Card', status: 'verified' },
                { name: 'PAN Card', status: 'verified' },
                { name: 'Bank Account', status: 'pending' },
                { name: 'Profile Photo', status: 'verified' },
              ].map((doc, i) => (
                <div key={i} className="group p-4 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-primary-500/30 transition-all cursor-pointer">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${doc.status === 'verified' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                        <FileText size={18} />
                      </div>
                      <span className="text-sm font-semibold text-slate-200">{doc.name}</span>
                    </div>
                    {doc.status === 'verified' ? (
                      <CheckCircle2 size={16} className="text-green-500" />
                    ) : (
                      <AlertCircle size={16} className="text-yellow-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 p-6 rounded-[24px] bg-primary-600/5 border border-primary-600/10 text-center">
              <p className="text-slate-400 text-sm leading-relaxed">
                Update your <span className="text-white font-semibold">Bank Details</span> to ensure timely salary credit.
              </p>
              <button className="mt-4 text-primary-500 font-bold text-sm hover:underline">Upload Document</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerDashboard;
