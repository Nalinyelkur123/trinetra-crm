const { db } = require('../config/db');

const markAttendance = (req, res) => {
  const { worker_id, status, location, date: reqDate, shift_type, overtime_hours } = req.body;
  const date = reqDate || new Date().toISOString().split('T')[0];

  try {
    // Fetch worker shift details
    const workerDetails = db.prepare('SELECT shift_start, shift_end FROM workers WHERE user_id = ?').get(worker_id);
    const currentTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    let finalStatus = status;
    // Auto-calculate late status if not specified and present
    if (status === 'present' && workerDetails?.shift_start) {
      if (currentTime > workerDetails.shift_start) {
        finalStatus = 'late';
      }
    }

    const existing = db.prepare('SELECT id, check_in_time FROM attendance WHERE worker_id = ? AND date = ?').get(worker_id, date);

    if (existing) {
      const updateStmt = db.prepare(`
        UPDATE attendance 
        SET status = ?, location = ?, check_in_time = COALESCE(check_in_time, ?), shift_type = ?, overtime_hours = ?
        WHERE id = ?
      `);
      updateStmt.run(finalStatus, location || 'Main HQ', (finalStatus === 'present' || finalStatus === 'late') ? currentTime : null, shift_type || 'General', overtime_hours || 0, existing.id);
      res.json({ message: 'Attendance updated', status: finalStatus });
    } else {
      const insertStmt = db.prepare(`
        INSERT INTO attendance (worker_id, date, status, location, check_in_time, shift_type, overtime_hours)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      insertStmt.run(worker_id, date, finalStatus, location || 'Main HQ', (finalStatus === 'present' || finalStatus === 'late') ? currentTime : null, shift_type || 'General', overtime_hours || 0);
      res.status(201).json({ message: 'Attendance marked', status: finalStatus });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const bulkMarkAttendance = (req, res) => {
  const { worker_ids, status, location, date, shift_type } = req.body;
  if (!Array.isArray(worker_ids) || !worker_ids.length || !['present', 'absent', 'half-day', 'late'].includes(status)) {
    return res.status(400).json({ error: 'Select workers and a valid attendance status' });
  }
  const attendanceDate = date || new Date().toISOString().split('T')[0];
  const now = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const upsert = db.prepare(`
    INSERT INTO attendance (worker_id, date, status, location, check_in_time, shift_type)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(worker_id, date) DO UPDATE SET
      status = excluded.status,
      location = excluded.location,
      check_in_time = COALESCE(attendance.check_in_time, excluded.check_in_time),
      shift_type = excluded.shift_type
  `);
  db.transaction(() => {
    worker_ids.forEach(workerId => upsert.run(
      workerId, attendanceDate, status, location || 'Main HQ',
      ['present', 'late'].includes(status) ? now : null, shift_type || 'General'
    ));
  })();
  res.json({ message: `Attendance updated for ${worker_ids.length} worker(s)` });
};

const reviewOvertime = (req, res) => {
  const { attendance_ids, status } = req.body;
  if (!Array.isArray(attendance_ids) || !attendance_ids.length || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Select overtime entries and a valid status' });
  }
  const placeholders = attendance_ids.map(() => '?').join(',');
  db.prepare(`UPDATE attendance SET overtime_status = ? WHERE id IN (${placeholders}) AND overtime_hours > 0`)
    .run(status, ...attendance_ids);
  res.json({ message: `Overtime ${status}` });
};

const getDailyAttendance = (req, res) => {
  const { date = new Date().toISOString().split('T')[0] } = req.query;
  const { company_id } = req.user;

  try {
    const attendance = db.prepare(`
      SELECT 
        u.id as worker_id, 
        u.name as worker_name, 
        u.phone,
        w.job_role,
        w.shift_start,
        w.shift_end,
        w.working_hours,
        c.name as client_name,
        a.status,
        a.location,
        a.check_in_time,
        a.check_out_time,
        a.shift_type,
        a.overtime_hours
        ,a.overtime_status
        ,a.id as attendance_id
      FROM users u
      JOIN workers w ON u.id = w.user_id
      LEFT JOIN clients c ON w.client_id = c.id
      LEFT JOIN attendance a ON u.id = a.worker_id AND a.date = ?
      WHERE u.company_id = ? AND u.role = 'worker'
      ORDER BY u.name ASC
    `).all(date, company_id);
    
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { markAttendance, bulkMarkAttendance, reviewOvertime, getDailyAttendance };
