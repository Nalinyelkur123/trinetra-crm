const { db } = require('../config/db');

const getCandidates = (req, res) => {
  try {
    const candidates = db.prepare('SELECT * FROM candidates ORDER BY applied_date DESC').all();
    res.json(candidates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const addCandidate = (req, res) => {
  const { name, email, phone, job_role } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO candidates (name, email, phone, job_role) VALUES (?, ?, ?, ?)');
    const result = stmt.run(name, email, phone, job_role);
    res.status(201).json({ id: result.lastInsertRowid, name, status: 'Screening' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateCandidateStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    db.prepare('UPDATE candidates SET status = ? WHERE id = ?').run(status, id);
    res.json({ message: 'Candidate status updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteCandidate = (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM candidates WHERE id = ?').run(id);
    res.json({ message: 'Candidate deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getCandidates, addCandidate, updateCandidateStatus, deleteCandidate };
