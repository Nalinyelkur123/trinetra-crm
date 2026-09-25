const mongoose = require('mongoose');
const { Task, Notification } = require('../models');

const createTask = async (req, res) => {
  const { assignment_id, worker_id, title, description, priority, due_date } = req.body;
  const assigned_by = req.user.id;
  
  try {
    if (!assignment_id || !title || !due_date) {
      return res.status(400).json({ error: 'Assignment, title, and due date are required' });
    }
    
    const validWorker = (worker_id && mongoose.Types.ObjectId.isValid(worker_id)) ? worker_id : null;

    const task = await Task.create({
      assignment_id, worker_id: validWorker, title, description, priority: priority || 'medium', due_date, assigned_by
    });
    
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
    const filter = {};
    
    if (worker_id) filter.worker_id = worker_id;
    if (assignment_id) filter.assignment_id = assignment_id;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    
    const tasks = await Task.find(filter)
      .populate('assigned_by', 'name')
      .populate('worker_id', 'name')
      .sort({ due_date: 1 })
      .lean();

    const formattedTasks = tasks.map(t => ({
      ...t,
      id: t._id,
      assigned_by_name: t.assigned_by?.name,
      worker_name: t.worker_id?.name
    }));

    res.json(formattedTasks);
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
    
    const priorityGroup = await Task.aggregate([
      { $group: { _id: "$priority", count: { $sum: 1 } } }
    ]);
    const by_priority = priorityGroup.map(p => ({ priority: p._id, count: p.count }));

    res.json({
      total_tasks, completed, pending, overdue, by_priority
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createTask, getTasks, updateTaskStatus, deleteTask, getTaskAnalytics };
