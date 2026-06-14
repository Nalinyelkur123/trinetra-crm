const { db } = require('../config/db');

const calculatePerformance = (req, res) => {
  const { worker_id, month, year } = req.body;
  
  try {
    const attendance = db.prepare(`
      SELECT COUNT(*) as total_days,
             SUM(CASE WHEN status IN ('present', 'late') THEN 1 ELSE 0 END) as present_days,
             SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
             SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days
      FROM attendance
      WHERE worker_id = ? AND strftime('%m', date) = ? AND strftime('%Y', date) = ?
    `).get(worker_id, String(month).padStart(2, '0'), year);
    
    const tasks = db.prepare(`
      SELECT COUNT(*) as total_tasks,
             SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks
      FROM tasks
      WHERE worker_id = ? AND strftime('%m', completion_date) = ? AND strftime('%Y', completion_date) = ?
    `).get(worker_id, String(month).padStart(2, '0'), year);
    
    const attendance_pct = attendance.total_days > 0 ? ((attendance.present_days / attendance.total_days) * 100).toFixed(2) : 0;
    const punctuality = attendance.total_days > 0 ? (100 - ((attendance.late_days / attendance.total_days) * 100)).toFixed(2) : 100;
    
    // Determine performance rating
    let rating = 'Average';
    if (attendance_pct >= 95 && punctuality >= 95) rating = 'Excellent';
    else if (attendance_pct >= 85 && punctuality >= 85) rating = 'Good';
    else if (attendance_pct < 75) rating = 'Poor';
    
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO performance 
      (worker_id, month, year, total_days, present_days, absent_days, late_days, 
       attendance_percentage, punctuality_score, tasks_completed, performance_rating)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      worker_id, month, year,
      attendance.total_days,
      attendance.present_days,
      attendance.absent_days,
      attendance.late_days,
      attendance_pct,
      punctuality,
      tasks.completed_tasks,
      rating
    );
    
    res.json({ message: 'Performance calculated', performance: { attendance_pct, punctuality, rating } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPerformance = (req, res) => {
  try {
    const { worker_id, month, year } = req.query;
    let query = `
      SELECT p.*, u.name as worker_name,
        (SELECT COUNT(*) FROM discipline_records d
         WHERE d.worker_id = p.worker_id
           AND strftime('%m', d.record_date) = printf('%02d', p.month)
           AND strftime('%Y', d.record_date) = CAST(p.year AS TEXT)) as discipline_count
      FROM performance p JOIN users u ON p.worker_id = u.id
      WHERE u.company_id = ?
    `;
    const params = [req.user.company_id];
    
    if (worker_id) {
      query += ' AND worker_id = ?';
      params.push(worker_id);
    }
    if (month) {
      query += ' AND month = ?';
      params.push(month);
    }
    if (year) {
      query += ' AND year = ?';
      params.push(year);
    }
    
    query += ' ORDER BY year DESC, month DESC';
    const performance = db.prepare(query).all(...params);
    res.json(performance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const addDisciplineRecord = (req, res) => {
  const { worker_id, record_date, category, severity, notes } = req.body;
  if (!worker_id || !record_date || !category) return res.status(400).json({ error: 'Worker, date, and category are required' });
  const info = db.prepare(`
    INSERT INTO discipline_records (worker_id, record_date, category, severity, notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(worker_id, record_date, category, severity || 'warning', notes || null, req.user.id);
  res.status(201).json({ id: info.lastInsertRowid, message: 'Discipline record added' });
};

const getDisciplineRecords = (req, res) => {
  const rows = db.prepare(`
    SELECT d.*, u.name as worker_name FROM discipline_records d
    JOIN users u ON d.worker_id = u.id
    WHERE u.company_id = ?
    ORDER BY d.record_date DESC
  `).all(req.user.company_id);
  res.json(rows);
};

const getWorkerRankings = (req, res) => {
  try {
    const rankings = db.prepare(`
      SELECT u.id, u.name, p.attendance_percentage, p.punctuality_score, p.performance_rating, p.tasks_completed
      FROM performance p
      JOIN users u ON p.worker_id = u.id
      WHERE p.year = ? AND p.month = ?
      ORDER BY p.attendance_percentage DESC, p.punctuality_score DESC
      LIMIT 20
    `).all(new Date().getFullYear(), new Date().getMonth() + 1);
    
    res.json(rankings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { calculatePerformance, getPerformance, getWorkerRankings, addDisciplineRecord, getDisciplineRecords };
