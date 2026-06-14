const { db } = require('../config/db');

const createSiteMonitoring = (req, res) => {
  const {
    assignment_id, supervisor_id, supervisor_notes, worker_count,
    safety_score, quality_score, monitoring_date, latitude, longitude, client_feedback
  } = req.body;
  
  try {
    const stmt = db.prepare(`
      INSERT INTO site_monitoring (
        assignment_id, supervisor_id, supervisor_notes, worker_count,
        safety_score, quality_score, monitoring_date, latitude, longitude, client_feedback
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      assignment_id, supervisor_id || req.user.id, supervisor_notes, worker_count,
      safety_score, quality_score, monitoring_date, latitude || null, longitude || null, client_feedback || null
    );
    res.status(201).json({ message: 'Site monitoring record created', monitoringId: info.lastInsertRowid });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getSiteMonitoring = (req, res) => {
  try {
    const { assignment_id, date_from, date_to } = req.query;
    let query = 'SELECT s.*, c.name as client_name, u.name as supervisor_name FROM site_monitoring s LEFT JOIN client_assignments c ON s.assignment_id = c.id LEFT JOIN users u ON s.supervisor_id = u.id WHERE 1=1';
    const params = [];
    
    if (assignment_id) {
      query += ' AND s.assignment_id = ?';
      params.push(assignment_id);
    }
    if (date_from) {
      query += ' AND s.monitoring_date >= ?';
      params.push(date_from);
    }
    if (date_to) {
      query += ' AND s.monitoring_date <= ?';
      params.push(date_to);
    }
    
    query += ' ORDER BY s.monitoring_date DESC';
    const monitoring = db.prepare(query).all(...params);
    res.json(monitoring);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getSiteQualityReport = (req, res) => {
  try {
    const { assignment_id, month, year } = req.query;
    
    const report = db.prepare(`
      SELECT 
        s.monitoring_date,
        AVG(s.safety_score) as avg_safety,
        AVG(s.quality_score) as avg_quality,
        AVG(s.worker_count) as avg_workers,
        COUNT(*) as total_inspections
      FROM site_monitoring s
      WHERE s.assignment_id = ?
        AND strftime('%m', s.monitoring_date) = ?
        AND strftime('%Y', s.monitoring_date) = ?
      GROUP BY s.monitoring_date
      ORDER BY s.monitoring_date DESC
    `).all(assignment_id, String(month).padStart(2, '0'), year);
    
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createSiteMonitoring, getSiteMonitoring, getSiteQualityReport };
