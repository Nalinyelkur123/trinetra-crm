const Task = require('../models/Task');
const Notification = require('../models/Notification');

const createTask = async (req, res) => {
  const { assignment_id, worker_id, title, description, priority, due_date } = req.body;
  const assigned_by = req.user.id;

  try {
    if (!assignment_id || !title || !due_date) {
      return res.status(400).json({ error: 'Assignment, title, and due date are required' });
    }

    const task = new Task({
      assignment_id,
      worker_id: worker_id || undefined,
      title,
      description,
      priority,
      due_date,
      assigned_by
    });
    await task.save();

    // Notify assigned worker
    if (worker_id) {
      await Notification.create({
        user_id: worker_id,
        type: 'task_assigned',
        title: 'New Task',
        message: `${title} assigned - Due: ${due_date}`
      });
    }

    res.status(201).json({ message: 'Task created', taskId: task._id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getTasks = async (req, res) => {
  try {
    const { worker_id, assignment_id, status, priority } = req.query;
    let query = {};

    if (worker_id) query.worker_id = worker_id;
    if (assignment_id) query.assignment_id = assignment_id;
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const tasksRaw = await Task.find(query)
      .sort({ due_date: 1 })
      .populate('assigned_by', 'name')
      .populate('worker_id', 'name')
      .lean();

    const tasks = tasksRaw.map(t => ({
      ...t,
      id: t._id,
      assigned_by_name: t.assigned_by?.name,
      worker_name: t.worker_id?.name
    }));

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateTaskStatus = async (req, res) => {
  const { taskId } = req.params;
  const { status } = req.body;

  try {
    if (!['pending', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid task status' });
    }
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    task.status = status;
    if (status === 'completed') {
      task.completion_date = new Date();
    }
    await task.save();

    // Notify assigner
    await Notification.create({
      user_id: task.assigned_by,
      type: 'task_update',
      title: 'Task Status Updated',
      message: `${task.title} status changed to ${status}`
    });

    res.json({ message: 'Task status updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteTask = async (req, res) => {
  const { taskId } = req.params;
  try {
    await Task.findByIdAndDelete(taskId);
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTaskAnalytics = async (req, res) => {
  try {
    const total_tasks = await Task.countDocuments();
    const completed = await Task.countDocuments({ status: 'completed' });
    const pending = await Task.countDocuments({ status: 'pending' });
    const overdue = await Task.countDocuments({ due_date: { $lt: new Date() }, status: { $ne: 'completed' } });

    const by_priority_raw = await Task.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);
    const by_priority = by_priority_raw.map(p => ({ priority: p._id, count: p.count }));

    res.json({ total_tasks, completed, pending, overdue, by_priority });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createTask, getTasks, updateTaskStatus, deleteTask, getTaskAnalytics };
