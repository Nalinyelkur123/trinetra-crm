const { db } = require('../config/db');

const getAuditLogs = (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT a.id, a.action, a.timestamp, u.name as user_name, a.target_type, a.target_id
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.timestamp DESC
      LIMIT 100
    `).all();
    
    // Map status based on action type
    const mappedLogs = logs.map(log => ({
      ...log,
      status: log.action.includes('DELETE') ? 'DANGER' : log.action.includes('UPDATE') ? 'WARN' : 'SUCCESS',
      time: new Date(log.timestamp).toLocaleString()
    }));

    res.json(mappedLogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getSystemSettings = (req, res) => {
  const company_id = req.user?.company_id || 1;
  try {
    const settings = db.prepare('SELECT * FROM settings WHERE company_id = ?').get(company_id || 1);
    if (settings) {
      settings.auto_attendance = !!settings.auto_attendance;
      settings.registry_lock = !!settings.registry_lock;
      settings.security_2fa = !!settings.security_2fa;
    }
    res.json(settings || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getClientAssignments = (req, res) => {
  const company_id = req.user?.company_id || 1;
  try {
    const assignments = db.prepare(`
      SELECT a.*, c.name as client_name, COUNT(w.id) as worker_count
      FROM client_assignments a
      JOIN clients c ON a.client_id = c.id
      LEFT JOIN workers w ON a.id = w.assignment_id AND w.status = 'active'
      WHERE a.company_id = ?
      GROUP BY a.id
    `).all(company_id || 1);
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createClientAssignment = (req, res) => {
  const { client_id, name, location, description, manager_name, contact_phone, start_date, end_date, shift_start, shift_end, working_hours } = req.body;
  try {
      const company_id = req.user.company_id || 1;
      const stmt = db.prepare(`
        INSERT INTO client_assignments (client_id, name, location, description, manager_name, contact_phone, start_date, end_date, status, progress, company_id, shift_start, shift_end, working_hours) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(client_id, name, location, description, manager_name, contact_phone, start_date, end_date, 'On-track', 0, company_id, shift_start || '09:00', shift_end || '18:00', working_hours || 8.0);
    
    db.prepare('INSERT INTO audit_logs (action, user_id, target_type, target_id) VALUES (?, ?, ?, ?)')
      .run('ASSIGNMENT_CREATED', req.user.id, 'ASSIGNMENT', result.lastInsertRowid);

    res.status(201).json({ id: result.lastInsertRowid, name, location });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const assignWorkerToClient = (req, res) => {
  const { worker_id, client_id, assignment_id } = req.body;
  try {
    // Fetch assignment shift defaults, fallback to client defaults
    const assignment = db.prepare('SELECT shift_start, shift_end, working_hours FROM client_assignments WHERE id = ?').get(assignment_id);
    const client = db.prepare('SELECT shift_start, shift_end, working_hours FROM clients WHERE id = ?').get(client_id);
    
    const finalShiftStart = assignment?.shift_start || client?.shift_start || '09:00';
    const finalShiftEnd = assignment?.shift_end || client?.shift_end || '18:00';
    const finalWorkingHours = assignment?.working_hours || client?.working_hours || 8.0;

    db.prepare(`
      UPDATE workers 
      SET client_id = ?, assignment_id = ?, shift_start = ?, shift_end = ?, working_hours = ? 
      WHERE user_id = ?
    `).run(client_id, assignment_id, finalShiftStart, finalShiftEnd, finalWorkingHours, worker_id);
    
    db.prepare('INSERT INTO audit_logs (action, user_id, target_type, target_id) VALUES (?, ?, ?, ?)')
      .run('WORKER_DEPLOYED', req.user.id, 'WORKER', worker_id);

    res.json({ message: 'Worker deployed to client successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateClientAssignment = (req, res) => {
  const { id } = req.params;
  const { name, location, description, manager_name, contact_phone, start_date, end_date, status, progress, shift_start, shift_end, working_hours } = req.body;
  try {
    const company_id = req.user.company_id || 1;
    const stmt = db.prepare(`
      UPDATE client_assignments 
      SET name = ?, location = ?, description = ?, manager_name = ?, contact_phone = ?, start_date = ?, end_date = ?, status = ?, progress = ?, shift_start = ?, shift_end = ?, working_hours = ?
      WHERE id = ? AND company_id = ?
    `);
    stmt.run(name, location, description, manager_name, contact_phone, start_date, end_date, status, progress, shift_start, shift_end, working_hours, id, company_id);

    db.prepare('INSERT INTO audit_logs (action, user_id, target_type, target_id) VALUES (?, ?, ?, ?)')
      .run('ASSIGNMENT_UPDATED', req.user.id, 'ASSIGNMENT', id);

    res.json({ message: 'Assignment updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateSystemSettings = (req, res) => {
  const { 
    company_name, timezone, auto_attendance, 
    registry_lock, retention_period, 
    notification_email, backup_frequency, security_2fa 
  } = req.body;
  const company_id = req.user?.company_id || 1;
  try {
    const stmt = db.prepare(`
      INSERT INTO settings (
        company_name, timezone, auto_attendance, 
        registry_lock, retention_period, 
        notification_email, backup_frequency, security_2fa, company_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(company_id) DO UPDATE SET
        company_name = excluded.company_name,
        timezone = excluded.timezone,
        auto_attendance = excluded.auto_attendance,
        registry_lock = excluded.registry_lock,
        retention_period = excluded.retention_period,
        notification_email = excluded.notification_email,
        backup_frequency = excluded.backup_frequency,
        security_2fa = excluded.security_2fa
    `);
    stmt.run(
      company_name, timezone, auto_attendance ? 1 : 0, 
      registry_lock ? 1 : 0, retention_period || '365 Days', 
      notification_email, backup_frequency || 'Daily', security_2fa ? 1 : 0,
      company_id
    );
    res.json({ message: 'System configuration updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { 
  getAuditLogs, 
  getSystemSettings, 
  getClientAssignments, 
  createClientAssignment, 
  assignWorkerToClient,
  updateSystemSettings,
  updateClientAssignment
};

