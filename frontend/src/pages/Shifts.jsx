import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Plus, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import axios from 'axios';

const Shifts = () => {
  const [shifts, setShifts] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    worker_id: '',
    assignment_id: '',
    shift_date: '',
    shift_type: 'General',
    start_time: '09:00',
    end_time: '18:00'
  });

  useEffect(() => {
    fetchShifts();
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      const [workerRes, assignRes] = await Promise.all([
        axios.get('/api/workers'),
        axios.get('/api/assignments')
      ]);
      setWorkers(Array.isArray(workerRes.data) ? workerRes.data : []);
      setAssignments(Array.isArray(assignRes.data) ? assignRes.data : []);
    } catch (err) {
      console.error('Failed to load shift metadata', err);
    }
  };

  const fetchShifts = async () => {
    try {
      const res = await axios.get('/api/shifts');
      setShifts(res.data);
    } catch (err) {
      console.error('Failed to fetch shifts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.worker_id) {
      setFormError('Please select a worker.');
      return;
    }
    try {
      await axios.post('/api/shifts', formData);
      setShowForm(false);
      setFormData({
        worker_id: '',
        assignment_id: '',
        shift_date: '',
        shift_type: 'General',
        start_time: '09:00',
        end_time: '18:00'
      });
      fetchShifts();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to create shift';
      setFormError(typeof msg === 'object' ? msg.message : msg);
    }
  };

  const deleteShift = async (shiftId) => {
    try {
      await axios.delete(`/api/shifts/${shiftId}`);
      fetchShifts();
    } catch (err) {
      console.error('Failed to delete shift');
    }
  };

  return (
    <div className="space-y-8">
      <motion.div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-foreground">Shift Scheduling</h1>
          <p className="caption text-muted-foreground mt-2">Manage worker shifts and schedules</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => { setShowForm(!showForm); setFormError(''); }}
          className="px-6 py-3 bg-primary text-white font-bold rounded-2xl flex items-center gap-2"
        >
          <Plus size={20} /> Create Shift
        </motion.button>
      </motion.div>

      {showForm && (
        <motion.form onSubmit={handleSubmit} className="card-premium p-8 space-y-6">
          {formError && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 text-xs font-bold flex items-center gap-2">
              <AlertCircle size={16} /> {formError}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold mb-2">Worker *</label>
              <select
                value={formData.worker_id}
                onChange={(e) => setFormData({ ...formData, worker_id: e.target.value })}
                className="input-field w-full py-3 px-4"
                required
              >
                <option value="">Select Worker</option>
                {workers.map(w => (
                  <option key={w.id || w._id} value={w.id || w._id}>
                    {w.name} ({w.job_role || 'Worker'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Project Assignment</label>
              <select
                value={formData.assignment_id}
                onChange={(e) => setFormData({ ...formData, assignment_id: e.target.value })}
                className="input-field w-full py-3 px-4"
              >
                <option value="">No Assignment (General)</option>
                {assignments.map(a => (
                  <option key={a.id || a._id} value={a.id || a._id}>
                    {a.name || a.assignment_name || 'Assignment'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Shift Date *</label>
              <input
                type="date"
                value={formData.shift_date}
                onChange={(e) => setFormData({ ...formData, shift_date: e.target.value })}
                className="input-field w-full py-3 px-4"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Shift Type</label>
              <select
                value={formData.shift_type}
                onChange={(e) => setFormData({ ...formData, shift_type: e.target.value })}
                className="input-field w-full py-3 px-4"
              >
                <option value="General">General</option>
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
                <option value="Night">Night</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Start Time</label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="input-field w-full py-3 px-4"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">End Time</label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="input-field w-full py-3 px-4"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <button type="submit" className="px-6 py-3 bg-primary text-white font-bold rounded-xl">Create Shift</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 bg-secondary rounded-xl">Cancel</button>
          </div>
        </motion.form>
      )}

      {loading ? (
        <div className="card-premium p-12 text-center">
          <div className="animate-spin w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full mx-auto" />
        </div>
      ) : shifts.length === 0 ? (
        <div className="card-premium p-12 text-center">
          <Calendar size={40} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No shifts scheduled</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shifts.map((shift) => (
            <motion.div
              key={shift.id}
              className="card-premium p-6 border-l-4 border-primary"
              whileHover={{ y: -4 }}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-bold text-foreground">{shift.name}</p>
                  <p className="caption text-muted-foreground">{shift.shift_type}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => deleteShift(shift.id)}
                  className="p-2 hover:bg-rose-500/20 rounded-lg"
                >
                  <Trash2 size={16} className="text-rose-500" />
                </motion.button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-primary" />
                  {shift.shift_date}
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-primary" />
                  {shift.start_time} - {shift.end_time}
                </div>
                <div className="pt-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    shift.status === 'scheduled' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-amber-500/20 text-amber-600'
                  }`}>
                    {shift.status}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Shifts;
