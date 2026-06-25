import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Plus, CheckCircle2, Clock, XCircle, AlertCircle, ChevronDown, Download } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const Leaves = () => {
  const { user } = useAuthStore();
  const [leaves, setLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    type: 'casual',
    start_date: '',
    end_date: '',
    reason: ''
  });

  useEffect(() => {
    fetchLeaves();
  }, [filterStatus]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchWorkers();
    } else if (user?.id) {
      setSelectedWorkerId(user.id);
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
    if (selectedWorkerId) {
      fetchLeaveBalance(selectedWorkerId);
    } else {
      setLeaveBalance(null);
    }
  }, [selectedWorkerId]);

  const fetchLeaves = async () => {
    try {
      const res = await axios.get(`/api/leaves?status=${filterStatus === 'all' ? '' : filterStatus}`);
      setLeaves(res.data);
    } catch (err) {
      console.error('Failed to fetch leaves');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const res = await axios.get('/api/workers');
      const workerList = Array.isArray(res.data) ? res.data : [];
      setWorkers(workerList);
      setSelectedWorkerId((current) => current || workerList[0]?.id || '');
    } catch (err) {
      console.error('Failed to fetch workers');
    }
  };

  const fetchLeaveBalance = async (workerId) => {
    try {
      const res = await axios.get(`/api/leaves/balance/${workerId}`);
      setLeaveBalance(res.data);
    } catch (err) {
      console.error('Failed to fetch leave balance');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!selectedWorkerId) return;

      await axios.post('/api/leaves', {
        worker_id: selectedWorkerId,
        ...formData
      });
      setShowForm(false);
      setFormData({ type: 'casual', start_date: '', end_date: '', reason: '' });
      fetchLeaves();
      fetchLeaveBalance(selectedWorkerId);
    } catch (err) {
      console.error('Failed to request leave');
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock size={16} className="text-amber-500" />,
      approved: <CheckCircle2 size={16} className="text-emerald-500" />,
      rejected: <XCircle size={16} className="text-rose-500" />
    };
    return icons[status] || <AlertCircle size={16} />;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div 
        className="flex justify-between items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-4xl font-black text-foreground">Leave Management</h1>
          <p className="caption text-muted-foreground mt-2">Request and track your leaves</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-primary text-white font-bold rounded-2xl flex items-center gap-2 hover:bg-primary/90"
        >
          <Plus size={20} /> Request Leave
        </motion.button>
      </motion.div>

      {/* Leave Balance Cards */}
      {leaveBalance && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Casual Leaves', used: leaveBalance.leaves_used_casual, total: leaveBalance.casual_leaves, color: 'from-blue-500/20 to-blue-600/5' },
            { label: 'Sick Leaves', used: leaveBalance.leaves_used_sick, total: leaveBalance.sick_leaves, color: 'from-red-500/20 to-red-600/5' },
            { label: 'Annual Leaves', used: leaveBalance.leaves_used_annual, total: leaveBalance.annual_leaves, color: 'from-emerald-500/20 to-emerald-600/5' }
          ].map((leave, i) => (
            <motion.div
              key={i}
              className={`card-premium p-6 bg-gradient-to-br ${leave.color} border border-border/50`}
              whileHover={{ y: -4 }}
            >
              <p className="caption text-muted-foreground">{leave.label}</p>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-black text-foreground">{leave.total - leave.used}</span>
                <span className="text-sm text-muted-foreground">/ {leave.total}</span>
              </div>
              <div className="mt-3 w-full bg-secondary/50 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all"
                  style={{ width: `${(leave.used / leave.total) * 100}%` }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Request Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={handleSubmit}
            className="card-premium p-8 space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">Leave Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="input-field w-full py-3 px-4"
                >
                  <option value="casual">Casual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="annual">Annual Leave</option>
                </select>
              </div>
              {user?.role === 'admin' ? (
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">Worker</label>
                  <select
                    value={selectedWorkerId}
                    onChange={(e) => setSelectedWorkerId(e.target.value)}
                    className="input-field w-full py-3 px-4"
                    required
                  >
                    <option value="" disabled>Select worker</option>
                    {workers.map((worker) => (
                      <option key={worker.id} value={worker.id}>{worker.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div></div>
              )}
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="input-field w-full py-3 px-4"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">End Date</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="input-field w-full py-3 px-4"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">Reason</label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="input-field w-full py-3 px-4 h-24"
                placeholder="Provide reason for leave..."
              />
            </div>
            <div className="flex gap-4">
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                disabled={!selectedWorkerId}
                className="px-6 py-3 bg-primary text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Request
              </motion.button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 bg-secondary text-foreground font-bold rounded-xl"
              >
                Cancel
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Filter & List */}
      <div className="space-y-4">
        <div className="flex gap-4">
          {['all', 'pending', 'approved', 'rejected'].map(status => (
            <motion.button
              key={status}
              whileHover={{ scale: 1.05 }}
              onClick={() => {
                setFilterStatus(status);
                setLoading(true);
              }}
              className={`px-4 py-2 rounded-lg font-bold capitalize transition-all ${
                filterStatus === status 
                  ? 'bg-primary text-white' 
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              {status}
            </motion.button>
          ))}
        </div>

        {loading ? (
          <div className="card-premium p-12 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full mx-auto" />
          </div>
        ) : leaves.length === 0 ? (
          <div className="card-premium p-12 text-center">
            <Calendar size={40} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No leave requests found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaves.map((leave, idx) => (
              <motion.div
                key={leave.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="card-premium p-6 border-l-4 border-primary hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(leave.status)}
                      <span className="font-bold text-foreground capitalize">{leave.type} Leave</span>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full capitalize ${
                        leave.status === 'approved' ? 'bg-emerald-500/20 text-emerald-600' :
                        leave.status === 'pending' ? 'bg-amber-500/20 text-amber-600' :
                        'bg-rose-500/20 text-rose-600'
                      }`}>
                        {leave.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{leave.reason}</p>
                    <p className="text-xs text-muted-foreground mt-2">{leave.start_date} to {leave.end_date}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaves;
