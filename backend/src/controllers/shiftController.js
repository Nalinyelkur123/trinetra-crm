const { db } = require('../config/db');

const createShift = (req, res) => {
  const { worker_id, assignment_id, shift_date, shift_type, start_time, end_time, notes } = req.body;
  try {
    if (!worker_id || !shift_date || !start_time || !end_time || start_time >= end_time) {
      return res.status(400).json({ error: 'Worker, date, and a valid time range are required' });
    }
    const conflict = db.prepare(`
      SELECT id FROM shifts WHERE worker_id = ? AND shift_date = ?
      AND status != 'cancelled' AND NOT (end_time <= ? OR start_time >= ?)
    `).get(worker_id, shift_date, start_time, end_time);
    if (conflict) return res.status(409).json({ error: 'Worker already has an overlapping shift' });
    const stmt = db.prepare('INSERT INTO shifts (worker_id, assignment_id, shift_date, shift_type, start_time, end_time, notes) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const info = stmt.run(worker_id, assignment_id, shift_date, shift_type, start_time, end_time, notes);
    
    // Notify worker
    db.prepare('INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)')
      .run(worker_id, 'shift_assigned', 'Shift Assigned', `${shift_type} shift on ${shift_date} from ${start_time} to ${end_time}`);
    
    res.status(201).json({ message: 'Shift created', shiftId: info.lastInsertRowid });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const bulkCreateShifts = (req, res) => {
  const { worker_ids, assignment_id, shift_date, shift_type, start_time, end_time, notes } = req.body;
  if (!Array.isArray(worker_ids) || !worker_ids.length) return res.status(400).json({ error: 'Select at least one worker' });
  const insert = db.prepare('INSERT INTO shifts (worker_id, assignment_id, shift_date, shift_type, start_time, end_time, notes) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const hasConflict = db.prepare(`
    SELECT id FROM shifts WHERE worker_id = ? AND shift_date = ?
    AND status != 'cancelled' AND NOT (end_time <= ? OR start_time >= ?)
  `);
  const created = [];
  const skipped = [];
  db.transaction(() => {
    for (const workerId of worker_ids) {
      if (hasConflict.get(workerId, shift_date, start_time, end_time)) {
        skipped.push(workerId);
        continue;
      }
      insert.run(workerId, assignment_id || null, shift_date, shift_type || 'General', start_time, end_time, notes || null);
      created.push(workerId);
      db.prepare('INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)')
        .run(workerId, 'shift_assigned', 'Shift Assigned', `${shift_type || 'General'} shift on ${shift_date}`);
    }
  })();
  res.status(201).json({ message: `${created.length} shift(s) created`, created, skipped });
};

const getShifts = (req, res) => {
  try {
    const { worker_id, assignment_id, date_from, date_to } = req.query;
    let query = 'SELECT s.*, u.name FROM shifts s JOIN users u ON s.worker_id = u.id WHERE 1=1';
    const params = [];
    
    if (worker_id) {
      query += ' AND s.worker_id = ?';
      params.push(worker_id);
    }
    if (assignment_id) {
      query += ' AND s.assignment_id = ?';
      params.push(assignment_id);
    }
    if (date_from) {
      query += ' AND s.shift_date >= ?';
      params.push(date_from);
    }
    if (date_to) {
      query += ' AND s.shift_date <= ?';
      params.push(date_to);
    }
    
    query += ' ORDER BY s.shift_date DESC';
    const shifts = db.prepare(query).all(...params);
    res.json(shifts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateShift = (req, res) => {
  const { shiftId } = req.params;
  const { shift_type, start_time, end_time, status, notes } = req.body;
  try {
    db.prepare('UPDATE shifts SET shift_type = ?, start_time = ?, end_time = ?, status = ?, notes = ? WHERE id = ?')
      .run(shift_type, start_time, end_time, status, notes, shiftId);
    
    res.json({ message: 'Shift updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteShift = (req, res) => {
  const { shiftId } = req.params;
  try {
    const shift = db.prepare('SELECT * FROM shifts WHERE id = ?').get(shiftId);
    db.prepare('DELETE FROM shifts WHERE id = ?').run(shiftId);
    
    // Notify worker
    db.prepare('INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)')
      .run(shift.worker_id, 'shift_cancelled', 'Shift Cancelled', `Shift on ${shift.shift_date} has been cancelled`);
    
    res.json({ message: 'Shift deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getShiftConflicts = (req, res) => {
  try {
    const { worker_id, shift_date } = req.query;
    const conflicts = db.prepare(`
      SELECT s1.id as shift1_id, s2.id as shift2_id, 
             s1.start_time, s1.end_time, s2.start_time as shift2_start, s2.end_time as shift2_end
      FROM shifts s1, shifts s2
      WHERE s1.worker_id = s2.worker_id AND s1.id != s2.id
      AND s1.shift_date = s2.shift_date
      AND s1.worker_id = ? AND s1.shift_date = ?
      AND NOT (s1.end_time <= s2.start_time OR s1.start_time >= s2.end_time)
    `).all(worker_id, shift_date);
    
    res.json(conflicts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createShift, bulkCreateShifts, getShifts, updateShift, deleteShift, getShiftConflicts };
