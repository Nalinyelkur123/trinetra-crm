import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, AlertCircle, Plus, Trash2, Filter } from 'lucide-react';
import axios from 'axios';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    assignment_id: '',
    worker_id: '',
    title: '',
    description: '',
    priority: 'medium',
    due_date: ''
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const params = filterStatus !== 'all' ? `status=${filterStatus}` : '';
      const res = await axios.get(`/api/tasks?${params}`);
      setTasks(res.data);
    } catch (err) {
      console.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/tasks', formData);
      setShowForm(false);
      setFormData({ assignment_id: '', worker_id: '', title: '', description: '', priority: 'medium', due_date: '' });
      fetchTasks();
    } catch (err) {
      console.error('Failed to create task');
    }
  };

  const updateStatus = async (taskId, newStatus) => {
    try {
      await axios.put(`/api/tasks/${taskId}/status`, { status: newStatus });
      fetchTasks();
    } catch (err) {
      console.error('Failed to update task');
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`/api/tasks/${taskId}`);
      fetchTasks();
    } catch (err) {
      console.error('Failed to delete task');
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-rose-500/20 text-rose-600',
      medium: 'bg-amber-500/20 text-amber-600',
      low: 'bg-blue-500/20 text-blue-600'
    };
    return colors[priority] || colors.medium;
  };

  return (
    <div className="space-y-8">
      <motion.div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-foreground">Task Management</h1>
          <p className="caption text-muted-foreground mt-2">Assign and track work orders</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-primary text-white font-bold rounded-2xl flex items-center gap-2"
        >
          <Plus size={20} /> Create Task
        </motion.button>
      </motion.div>

      {showForm && (
        <motion.form onSubmit={handleSubmit} className="card-premium p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold mb-2">Task Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input-field w-full py-3 px-4"
                placeholder="Enter task title"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="input-field w-full py-3 px-4"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Due Date</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="input-field w-full py-3 px-4"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Worker ID</label>
              <input
                type="number"
                value={formData.worker_id}
                onChange={(e) => setFormData({ ...formData, worker_id: e.target.value })}
                className="input-field w-full py-3 px-4"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field w-full py-3 px-4 h-24"
              placeholder="Task description..."
            />
          </div>
          <div className="flex gap-4">
            <button type="submit" className="px-6 py-3 bg-primary text-white font-bold rounded-xl">Create</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 bg-secondary rounded-xl">Cancel</button>
          </div>
        </motion.form>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'in_progress', 'completed'].map(status => (
          <motion.button
            key={status}
            whileHover={{ scale: 1.05 }}
            onClick={() => { setFilterStatus(status); setLoading(true); }}
            className={`px-4 py-2 rounded-lg font-bold capitalize text-sm ${
              filterStatus === status ? 'bg-primary text-white' : 'bg-secondary text-foreground'
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
      ) : tasks.length === 0 ? (
        <div className="card-premium p-12 text-center">
          <CheckCircle2 size={40} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No tasks found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              className="card-premium p-6 hover:shadow-lg transition-all border-l-4 border-primary"
              whileHover={{ x: 4 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-foreground">{task.title}</h3>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full capitalize ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      task.status === 'completed' ? 'bg-emerald-500/20 text-emerald-600' :
                      task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-600' :
                      'bg-amber-500/20 text-amber-600'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock size={14} /> Due: {task.due_date}
                    </div>
                    <div>Assigned to: {task.worker_name || 'Unassigned'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={task.status}
                    onChange={(e) => updateStatus(task.id, e.target.value)}
                    className="px-3 py-1 bg-secondary rounded text-sm font-bold"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    onClick={() => deleteTask(task.id)}
                    className="p-2 hover:bg-rose-500/20 rounded-lg"
                  >
                    <Trash2 size={16} className="text-rose-500" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tasks;
