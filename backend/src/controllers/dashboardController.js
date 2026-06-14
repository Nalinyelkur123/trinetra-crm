const { db } = require('../config/db');

const getDashboardStats = (req, res) => {
  try {
    // 1. Total Workers Count
    const totalWorkersData = db.prepare('SELECT COUNT(*) as count FROM workers').get();
    const totalWorkers = totalWorkersData ? totalWorkersData.count : 0;

    // 2. Active Workers
    const activeWorkersData = db.prepare("SELECT COUNT(*) as count FROM workers WHERE status = 'active'").get();
    const activeWorkers = activeWorkersData ? activeWorkersData.count : 0;

    // 3. Today's Attendance Summary
    const today = new Date().toISOString().split('T')[0];
    const attendanceStats = db.prepare(`
      SELECT 
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late,
        SUM(CASE WHEN status = 'half-day' THEN 1 ELSE 0 END) as half_day
      FROM attendance 
      WHERE date = ?
    `).get(today) || { present: 0, absent: 0, late: 0, half_day: 0 };

    // 4. Monthly Attendance Trend (Last 7 Days)
    const trendData = db.prepare(`
      SELECT date, COUNT(*) as count 
      FROM attendance 
      WHERE date >= date('now', '-7 days') AND status IN ('present', 'late', 'half-day')
      GROUP BY date
      ORDER BY date ASC
    `).all() || [];

    // 5. Recent Activity Logs (Activity Feed)
    const recentLogs = db.prepare(`
      SELECT a.action, a.timestamp, u.name as user_name
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.timestamp DESC
      LIMIT 10
    `).all() || [];

    // 6. Client Assignment Distribution
    const assignmentStats = db.prepare(`
      SELECT c.name as client_name, ca.name as assignment_name, COUNT(w.id) as worker_count
      FROM clients c
      LEFT JOIN client_assignments ca ON c.id = ca.client_id
      LEFT JOIN workers w ON ca.id = w.assignment_id
      GROUP BY ca.id
      HAVING worker_count > 0
    `).all() || [];

    // 7. Pending Leaves
    const pendingLeaves = db.prepare(`
      SELECT l.*, u.name as worker_name
      FROM leaves l
      JOIN users u ON l.worker_id = u.id
      WHERE l.status = 'pending'
      ORDER BY l.created_at DESC
      LIMIT 5
    `).all() || [];

    // 8. Recent Notes
    const recentNotes = db.prepare(`
      SELECT * FROM notes 
      WHERE is_completed = 0
      ORDER BY created_at DESC
      LIMIT 5
    `).all() || [];

    res.json({
      summary: {
        totalWorkers,
        activeWorkers,
        deploymentRate: totalWorkers > 0 ? ((activeWorkers / totalWorkers) * 100).toFixed(1) : 0,
        todayAttendance: {
          present: attendanceStats.present || 0,
          absent: attendanceStats.absent || 0,
          late: attendanceStats.late || 0,
          totalMarked: (Number(attendanceStats.present) || 0) + (Number(attendanceStats.absent) || 0) + (Number(attendanceStats.late) || 0) + (Number(attendanceStats.half_day) || 0)
        }
      },
      trend: trendData,
      recentLogs,
      assignments: assignmentStats,
      leaves: pendingLeaves,
      notes: recentNotes
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
};

const createNote = (req, res) => {
  const { content, priority } = req.body;
  const user_id = req.user.id;
  try {
    db.prepare('INSERT INTO notes (user_id, content, priority) VALUES (?, ?, ?)').run(user_id, content, priority || 'normal');
    res.status(201).json({ message: 'Note saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getDashboardStats, createNote };
