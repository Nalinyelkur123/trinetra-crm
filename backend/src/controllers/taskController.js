const { db } = require('../config/db');

const createTask = (req, res) => {
  const { assignment_id, worker_id, title, description, priority, due_date } = req.body;
  const assigned_by = req.user.id; // From auth middleware
  
  try {
    if (!assignment_id || !title || !due_date) {
      return res.status(400).json({ error: 'Assignment, title, and due date are required' });
    }
    const stmt = db.prepare('INSERT INTO tasks (assignment_id, worker_id, title, description, priority, due_date, assigned_by) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const info = stmt.run(assignment_id, worker_id, title, description, priority, due_date, assigned_by);
    
    // Notify assigned worker
    if (worker_id) {
      db.prepare('INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)')
        .run(worker_id, 'task_assigned', 'New Task', `${title} assigned - Due: ${due_date}`);
    }
    
    res.status(201).json({ message: 'Task created', taskId: info.lastInsertRowid });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getTasks = (req, res) => {
  try {
    const { worker_id, assignment_id, status, priority } = req.query;
    let query = 'SELECT t.*, u.name as assigned_by_name, w.name as worker_name FROM tasks t LEFT JOIN users u ON t.assigned_by = u.id LEFT JOIN users w ON t.worker_id = w.id WHERE 1=1';
    const params = [];
    
    if (worker_id) {
      query += ' AND t.worker_id = ?';
      params.push(worker_id);
    }
    if (assignment_id) {
      query += ' AND t.assignment_id = ?';
      params.push(assignment_id);
    }
    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }
    if (priority) {
      query += ' AND t.priority = ?';
      params.push(priority);
    }
    
    query += ' ORDER BY t.due_date ASC';
    const tasks = db.prepare(query).all(...params);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateTaskStatus = (req, res) => {
  const { taskId } = req.params;
  const { status } = req.body;
  
  try {
    if (!['pending', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid task status' });
    }
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run(status, taskId);
    
    if (status === 'completed') {
      db.prepare('UPDATE tasks SET completion_date = ? WHERE id = ?').run(new Date().toISOString().split('T')[0], taskId);
    }
    
    // Notify assigner
    db.prepare('INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)')
      .run(task.assigned_by, 'task_update', 'Task Status Updated', `${task.title} status changed to ${status}`);
    
    res.json({ message: 'Task status updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteTask = (req, res) => {
  const { taskId } = req.params;
  try {
    db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTaskAnalytics = (req, res) => {
  try {
    const analytics = {
      total_tasks: db.prepare('SELECT COUNT(*) as count FROM tasks').get().count,
      completed: db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'").get().count,
      pending: db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'").get().count,
      overdue: db.prepare("SELECT COUNT(*) as count FROM tasks WHERE due_date < date('now') AND status != 'completed'").get().count,
      by_priority: db.prepare('SELECT priority, COUNT(*) as count FROM tasks GROUP BY priority').all()
    };
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createTask, getTasks, updateTaskStatus, deleteTask, getTaskAnalytics };
