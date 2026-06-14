const { db } = require('../config/db');

const requestLeave = async (req, res) => {
  const { type, start_date, end_date, reason } = req.body;
  const worker_id = req.user.role === 'worker' ? req.user.id : Number(req.body.worker_id);
  try {
    if (!worker_id || !['casual', 'sick', 'annual'].includes(type)) {
      return res.status(400).json({ error: 'Valid worker and leave type are required' });
    }
    if (!start_date || !end_date || end_date < start_date) {
      return res.status(400).json({ error: 'Enter a valid leave date range' });
    }
    const worker = db.prepare('SELECT id, name FROM users WHERE id = ? AND company_id = ? AND role = ?')
      .get(worker_id, req.user.company_id, 'worker');
    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    const overlap = db.prepare(`
      SELECT id FROM leaves
      WHERE worker_id = ? AND status IN ('pending', 'approved')
        AND start_date <= ? AND end_date >= ?
    `).get(worker_id, end_date, start_date);
    if (overlap) return res.status(409).json({ error: 'This leave overlaps an existing request' });

    const requestedDays = Math.floor((new Date(end_date) - new Date(start_date)) / 86400000) + 1;
    const year = Number(start_date.slice(0, 4));
    db.prepare('INSERT OR IGNORE INTO leave_balance (worker_id, year) VALUES (?, ?)').run(worker_id, year);
    const balance = db.prepare('SELECT * FROM leave_balance WHERE worker_id = ? AND year = ?').get(worker_id, year);
    const totalColumn = `${type}_leaves`;
    const usedColumn = `leaves_used_${type}`;
    if (requestedDays > (balance[totalColumn] - balance[usedColumn])) {
      return res.status(400).json({ error: `Insufficient ${type} leave balance` });
    }

    const info = db.prepare('INSERT INTO leaves (worker_id, type, start_date, end_date, reason, status) VALUES (?, ?, ?, ?, ?, ?)')
      .run(worker_id, type, start_date, end_date, reason, 'pending');
    
    // Create notification for admin
    db.prepare('INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)')
      .run(req.user.role === 'admin' ? req.user.id : 1, 'leave_request', `Leave Request from ${worker.name}`, `${type} leave requested from ${start_date} to ${end_date}`);
    
    res.status(201).json({ message: 'Leave request submitted', leaveId: info.lastInsertRowid });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getLeaves = (req, res) => {
  try {
    const { worker_id, status } = req.query;
    let query = 'SELECT l.*, u.name FROM leaves l JOIN users u ON l.worker_id = u.id WHERE u.company_id = ?';
    const params = [req.user.company_id];
    if (req.user.role === 'worker') {
      query += ' AND l.worker_id = ?';
      params.push(req.user.id);
    }
    
    if (worker_id) {
      query += ' AND l.worker_id = ?';
      params.push(worker_id);
    }
    if (status) {
      query += ' AND l.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY l.start_date DESC';
    const leaves = db.prepare(query).all(...params);
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const approveLeave = (req, res) => {
  const { leaveId } = req.params;
  try {
    const leave = db.prepare('SELECT * FROM leaves WHERE id = ?').get(leaveId);
    if (!leave) return res.status(404).json({ error: 'Leave request not found' });
    if (leave.status !== 'pending') return res.status(409).json({ error: 'Leave request has already been reviewed' });
    const days = Math.floor((new Date(leave.end_date) - new Date(leave.start_date)) / 86400000) + 1;
    const year = Number(leave.start_date.slice(0, 4));
    db.transaction(() => {
      db.prepare('INSERT OR IGNORE INTO leave_balance (worker_id, year) VALUES (?, ?)').run(leave.worker_id, year);
      db.prepare(`UPDATE leave_balance SET leaves_used_${leave.type} = leaves_used_${leave.type} + ? WHERE worker_id = ? AND year = ?`)
        .run(days, leave.worker_id, year);
      db.prepare('UPDATE leaves SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run('approved', req.user.id, leaveId);
    })();
    db.prepare('INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)')
      .run(leave.worker_id, 'leave_approved', 'Leave Request Approved', `Your ${leave.type} leave has been approved`);
    
    res.json({ message: 'Leave approved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const rejectLeave = (req, res) => {
  const { leaveId } = req.params;
  const { reason } = req.body;
  try {
    const leave = db.prepare('SELECT * FROM leaves WHERE id = ?').get(leaveId);
    if (!leave) return res.status(404).json({ error: 'Leave request not found' });
    if (leave.status !== 'pending') return res.status(409).json({ error: 'Leave request has already been reviewed' });
    db.prepare('UPDATE leaves SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, rejection_reason = ? WHERE id = ?')
      .run('rejected', req.user.id, reason || null, leaveId);
    db.prepare('INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)')
      .run(leave.worker_id, 'leave_rejected', 'Leave Request Rejected', reason || 'Your leave request has been rejected');
    
    res.json({ message: 'Leave rejected' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getLeaveBalance = (req, res) => {
  const worker_id = req.user.role === 'worker' ? req.user.id : Number(req.params.worker_id);
  try {
    const balance = db.prepare('SELECT * FROM leave_balance WHERE worker_id = ? AND year = ?')
      .get(worker_id, new Date().getFullYear());
    
    if (!balance) {
      // Initialize leave balance for new year
      const newBalance = db.prepare('INSERT INTO leave_balance (worker_id, year) VALUES (?, ?)')
        .run(worker_id, new Date().getFullYear());
      const created = db.prepare('SELECT * FROM leave_balance WHERE id = ?').get(newBalance.lastInsertRowid);
      return res.json(created);
    }
    
    res.json(balance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getHolidays = (req, res) => {
  const holidays = db.prepare('SELECT * FROM holidays WHERE company_id = ? ORDER BY holiday_date').all(req.user.company_id);
  res.json(holidays);
};

const createHoliday = (req, res) => {
  const { name, holiday_date, category } = req.body;
  if (!name || !holiday_date) return res.status(400).json({ error: 'Name and date are required' });
  const info = db.prepare('INSERT INTO holidays (name, holiday_date, category, company_id) VALUES (?, ?, ?, ?)')
    .run(name, holiday_date, category || 'Company', req.user.company_id);
  res.status(201).json({ id: info.lastInsertRowid, message: 'Holiday added' });
};

const bulkReviewLeaves = (req, res) => {
  const { leave_ids, status, reason } = req.body;
  if (!Array.isArray(leave_ids) || !leave_ids.length || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Select leaves and a valid status' });
  }
  const handler = status === 'approved' ? approveLeave : rejectLeave;
  let completed = 0;
  for (const id of leave_ids) {
    const mockReq = { ...req, params: { leaveId: id }, body: { reason }, user: req.user };
    const mockRes = {
      status: () => mockRes,
      json: (payload) => { if (!payload?.error) completed += 1; return payload; }
    };
    handler(mockReq, mockRes);
  }
  res.json({ message: `${completed} leave request(s) ${status}` });
};

module.exports = {
  requestLeave, getLeaves, approveLeave, rejectLeave, getLeaveBalance,
  getHolidays, createHoliday, bulkReviewLeaves
};
