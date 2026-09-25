import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, CheckCircle2, XCircle, MapPin, Users,
  ChevronLeft, ChevronRight, Filter, Search, Activity, Clock, Briefcase, RefreshCw, Check, AlertCircle, Plus, X
} from 'lucide-react';
import axios from 'axios';
import Pagination from '../components/Pagination';

const Attendance = () => {
  const [attendanceRecord, setAttendanceRecord] = useState([]);
  const [workersList, setWorkersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState('All Clients');
  const [selectedRole, setSelectedRole] = useState('All Roles');
  const [savingId, setSavingId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submittingModal, setSubmittingModal] = useState(false);
  const [modalForm, setModalForm] = useState({
    worker_id: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    shift_type: 'General',
    check_in_time: '',
    check_out_time: '',
    overtime_hours: 0,
    location: 'Main HQ'
  });

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/attendance?date=${date}`);
      setAttendanceRecord(res.data);
    } catch (err) {
      console.error('Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const res = await axios.get('/api/workers');
      const list = Array.isArray(res.data) ? res.data : [];
      setWorkersList(list);
      if (list.length > 0 && !modalForm.worker_id) {
        setModalForm(prev => ({ ...prev, worker_id: list[0].id }));
      }
    } catch (err) {
      console.error('Failed to fetch workers list');
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [date]);

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!modalForm.worker_id) {
      alert('Please select a worker');
      return;
    }
    setSubmittingModal(true);
    try {
      let checkInISO = null;
      let checkOutISO = null;
      if (modalForm.check_in_time) {
        checkInISO = new Date(`${modalForm.date}T${modalForm.check_in_time}:00`).toISOString();
      }
      if (modalForm.check_out_time) {
        checkOutISO = new Date(`${modalForm.date}T${modalForm.check_out_time}:00`).toISOString();
      }

      await axios.post('/api/attendance', {
        worker_id: modalForm.worker_id,
        date: modalForm.date,
        status: modalForm.status,
        shift_type: modalForm.shift_type,
        location: modalForm.location,
        overtime_hours: parseFloat(modalForm.overtime_hours) || 0,
        check_in_time: checkInISO,
        check_out_time: checkOutISO,
        status_override: true
      });

      setShowAddModal(false);
      // Reset form
      setModalForm({
        worker_id: workersList[0]?.id || '',
        date: date,
        status: 'present',
        shift_type: 'General',
        check_in_time: '',
        check_out_time: '',
        overtime_hours: 0,
        location: 'Main HQ'
      });
      fetchAttendance();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to record attendance');
    } finally {
      setSubmittingModal(false);
    }
  };

  const updateStatus = async (workerId, newStatus, shiftType = 'General', overtimeHours = 0) => {
    setSavingId(workerId);
    try {
      await axios.post('/api/attendance', {
        worker_id: workerId,
        status: newStatus,
        location: 'Main HQ',
        date: date,
        shift_type: shiftType,
        overtime_hours: overtimeHours
      });
      // Refresh data to get latest timestamps and status
      fetchAttendance();
    } catch (err) {
      console.error('Failed to update attendance');
    } finally {
      setSavingId(null);
    }
  };

  const filteredRecords = attendanceRecord.filter(r => {
    const matchesSearch = r.worker_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.worker_id?.toString().includes(searchTerm);
    const matchesClient = selectedClient === 'All Clients' || r.client_name === selectedClient;
    const matchesRole = selectedRole === 'All Roles' || r.job_role === selectedRole;
    return matchesSearch && matchesClient && matchesRole;
  });

  const clients = ['All Clients', ...new Set((attendanceRecord || []).map(r => r.client_name).filter(Boolean))];
  const roles = ['All Roles', ...new Set((attendanceRecord || []).map(r => r.job_role).filter(Boolean))];

  const totalFiltered = filteredRecords.length;
  const totalPages = Math.ceil(totalFiltered / itemsPerPage);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedClient, selectedRole]);

  const stats = [
    { 
      label: 'Selected Workers', 
      value: totalFiltered, 
      subValue: 'In Current Filter',
      color: 'bg-primary/10 text-primary border-primary/10', 
      icon: Users 
    },
    { 
      label: 'Present', 
      value: (filteredRecords || []).filter(r => r.status === 'present').length, 
      subValue: `out of ${totalFiltered}`,
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/10', 
      icon: CheckCircle2 
    },
    { 
      label: 'Late Entry', 
      value: (filteredRecords || []).filter(r => r.status === 'late').length, 
      subValue: `out of ${totalFiltered}`,
      color: 'bg-amber-500/10 text-amber-600 border-amber-500/10', 
      icon: Clock 
    },
    { 
      label: 'Absent', 
      value: (filteredRecords || []).filter(r => r.status === 'absent' || !r.status).length, 
      subValue: `out of ${totalFiltered}`,
      color: 'bg-rose-500/10 text-rose-600 border-rose-500/10', 
      icon: XCircle 
    },
  ];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Attendance Log</h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">Track daily attendance</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-card border border-border p-1.5 rounded-2xl shadow-sm">
             <button onClick={() => {
                const d = new Date(date);
                d.setDate(d.getDate() - 1);
                setDate(d.toISOString().split('T')[0]);
              }} className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all"><ChevronLeft size={18} /></button>
              <div className="flex flex-col items-center px-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-primary/60 mb-0.5">Date</p>
                <p className="text-xs font-black uppercase tracking-tighter">{new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
              <button onClick={() => {
                const d = new Date(date);
                d.setDate(d.getDate() + 1);
                setDate(d.toISOString().split('T')[0]);
              }} className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all"><ChevronRight size={18} /></button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input 
              type="text" 
              placeholder="Quick search..." 
              className="input-field pl-10 w-48 text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => {
              setModalForm(prev => ({
                ...prev,
                date: date,
                worker_id: prev.worker_id || workersList[0]?.id || ''
              }));
              setShowAddModal(true);
            }}
            className="btn-primary flex items-center gap-2 text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-2xl shadow-lg shadow-primary/20 whitespace-nowrap"
          >
            <Plus size={16} /> Record Attendance
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
           <div key={i} className="card-premium p-6 flex items-center justify-between">
              <div>
                <p className="caption mb-1">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-black text-foreground">{stat.value}</h3>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">{stat.subValue}</span>
                </div>
              </div>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border ${stat.color}`}>
                 <stat.icon size={28} />
              </div>
           </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-card p-4 rounded-2xl border border-border/50 shadow-sm">
        <div className="flex items-center gap-3 flex-1 w-full">
          <Filter size={16} className="text-primary" />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Filters</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <select 
            value={selectedClient} 
            onChange={(e) => setSelectedClient(e.target.value)}
            className="input-field py-2 text-[10px] font-black uppercase tracking-widest min-w-[180px]"
          >
            {clients.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select 
            value={selectedRole} 
            onChange={(e) => setSelectedRole(e.target.value)}
            className="input-field py-2 text-[10px] font-black uppercase tracking-widest min-w-[180px]"
          >
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button 
            onClick={() => {
              setSelectedClient('All Clients');
              setSelectedRole('All Roles');
              setSearchTerm('');
            }}
            className="p-3 bg-secondary/50 border border-border/50 rounded-xl text-muted-foreground hover:text-primary transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
          >
            <RefreshCw size={14} /> Clear Filters
          </button>
        </div>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-6 py-5 caption">Worker Identity</th>
                <th className="px-6 py-5 caption">Client</th>
                <th className="px-6 py-5 caption">Expected Shift</th>
                <th className="px-6 py-5 caption">OT (Hrs)</th>
                <th className="px-6 py-5 caption">Check-In</th>
                <th className="px-6 py-5 caption text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="6" className="px-6 py-8 bg-secondary/5" />
                  </tr>
                ))
              ) : paginatedRecords.map((record, idx) => (
                <tr key={record.id || `${record.worker_id}-${idx}`} className="hover:bg-secondary/20 transition-all group">
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
                          {record.worker_name ? record.worker_name[0] : '?'}
                       </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{record.worker_name}</p>
                          <p className="text-[10px] text-muted-foreground font-black uppercase mt-0.5">TRN-{record.worker_id?.toString().slice(-6).toUpperCase()}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary">
                       <Briefcase size={14} />
                       {record.client_name || 'Unassigned'}
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 text-[10px] font-black text-foreground">
                        <Clock size={12} className="text-primary" />
                        {record.shift_start || '09:00'} - {record.shift_end || '18:00'}
                      </div>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase mt-1">
                        {record.working_hours || '8.0'} Hrs Shift
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                     <input 
                       type="number"
                       className="w-12 bg-secondary/50 rounded-lg px-2 py-1 text-[10px] font-black outline-none border border-border/50 focus:border-primary transition-all"
                       value={record.overtime_hours || 0}
                       onChange={(e) => updateStatus(record.worker_id, record.status, record.shift_type, e.target.value)}
                     />
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-500/5 px-2 py-1 rounded-lg border border-emerald-500/10">
                      <Clock size={12} />
                      {(() => {
                        if (!record.check_in_time) return '--:--';
                        const d = new Date(record.check_in_time);
                        if (!isNaN(d.getTime())) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const fallback = new Date(`2000-01-01T${record.check_in_time}`);
                        if (!isNaN(fallback.getTime())) return fallback.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        return '--:--';
                      })()}
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center justify-center gap-2">
                       {[
                         { id: 'present', label: 'P', active: 'bg-emerald-500 text-white shadow-emerald-500/20', inactive: 'hover:bg-emerald-500/10 hover:text-emerald-600', icon: Check },
                         { id: 'late', label: 'L', active: 'bg-amber-500 text-white shadow-amber-500/20', inactive: 'hover:bg-amber-500/10 hover:text-amber-600', icon: Clock },
                         { id: 'absent', label: 'A', active: 'bg-rose-500 text-white shadow-rose-500/20', inactive: 'hover:bg-rose-500/10 hover:text-rose-600', icon: XCircle },
                       ].map((btn) => (
                         <button
                           key={btn.id}
                           onClick={() => updateStatus(record.worker_id, btn.id, record.shift_type, record.overtime_hours)}
                           disabled={savingId === record.worker_id}
                           className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black transition-all shadow-lg ${
                             record.status === btn.id 
                               ? `${btn.active}`
                               : `bg-secondary text-muted-foreground ${btn.inactive}`
                           }`}
                         >
                           {savingId === record.worker_id && record.status !== btn.id ? (
                             <RefreshCw size={12} className="animate-spin" />
                           ) : (
                             <btn.icon size={14} />
                           )}
                         </button>
                       ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filteredRecords.length === 0 && (
            <div className="py-20 text-center">
               <Calendar className="mx-auto text-muted-foreground/20 mb-4" size={48} />
               <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">No Workers Found</p>
            </div>
          )}
        </div>
        
        {!loading && filteredRecords.length > 0 && (
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
            totalItems={filteredRecords.length}
          />
        )}
      </div>

      {/* Record Working Attendant Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="modal-overlay">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="modal-content max-w-xl p-8 overflow-y-auto max-h-[90vh] custom-scrollbar"
            >
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-foreground">Record Working Attendant</h3>
                    <p className="caption text-muted-foreground">Log or update daily worker attendance</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleModalSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="caption">Select Personnel / Attendant</label>
                  <select 
                    required
                    value={modalForm.worker_id}
                    onChange={(e) => setModalForm({ ...modalForm, worker_id: e.target.value })}
                    className="input-field w-full py-2.5 text-xs font-bold"
                  >
                    <option value="">-- Choose Worker --</option>
                    {workersList.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.job_role || 'Worker'}) - {w.client_name || 'No Client'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="caption">Attendance Date</label>
                    <input 
                      type="date"
                      required
                      value={modalForm.date}
                      onChange={(e) => setModalForm({ ...modalForm, date: e.target.value })}
                      className="input-field w-full py-2.5 text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="caption">Attendance Status</label>
                    <select 
                      value={modalForm.status}
                      onChange={(e) => setModalForm({ ...modalForm, status: e.target.value })}
                      className="input-field w-full py-2.5 text-xs font-bold"
                    >
                      <option value="present">Present (Full Day)</option>
                      <option value="late">Late Arrival</option>
                      <option value="half-day">Half Day</option>
                      <option value="absent">Absent</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="caption">Check-In Time</label>
                    <input 
                      type="time"
                      value={modalForm.check_in_time}
                      onChange={(e) => setModalForm({ ...modalForm, check_in_time: e.target.value })}
                      className="input-field w-full py-2.5 text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="caption">Check-Out Time</label>
                    <input 
                      type="time"
                      value={modalForm.check_out_time}
                      onChange={(e) => setModalForm({ ...modalForm, check_out_time: e.target.value })}
                      className="input-field w-full py-2.5 text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="caption">Shift Type</label>
                    <select 
                      value={modalForm.shift_type}
                      onChange={(e) => setModalForm({ ...modalForm, shift_type: e.target.value })}
                      className="input-field w-full py-2.5 text-xs font-bold"
                    >
                      <option value="General">General</option>
                      <option value="Morning">Morning</option>
                      <option value="Afternoon">Afternoon</option>
                      <option value="Night">Night</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="caption">OT Hours</label>
                    <input 
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      value={modalForm.overtime_hours}
                      onChange={(e) => setModalForm({ ...modalForm, overtime_hours: e.target.value })}
                      className="input-field w-full py-2.5 text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="caption">Location / Site</label>
                    <input 
                      type="text"
                      value={modalForm.location}
                      onChange={(e) => setModalForm({ ...modalForm, location: e.target.value })}
                      placeholder="e.g. Main HQ"
                      className="input-field w-full py-2.5 text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)}
                    className="btn-secondary px-5 py-2.5 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submittingModal}
                    className="btn-primary px-6 py-2.5 text-xs font-black uppercase tracking-wider flex items-center gap-2"
                  >
                    {submittingModal ? <RefreshCw size={14} className="animate-spin" /> : <Check size={16} />}
                    Save Attendance
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Attendance;
