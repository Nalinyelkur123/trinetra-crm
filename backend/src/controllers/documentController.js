const { db } = require('../config/db');

const getDocuments = (req, res) => {
  try {
    const docs = db.prepare(`
      SELECT d.*, u.name as worker_name
      FROM documents d
      JOIN users u ON d.worker_id = u.id
      ORDER BY d.created_at DESC
    `).all();
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateDocumentStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    db.prepare('UPDATE documents SET status = ? WHERE id = ?').run(status, id);
    
    // Log Activity
    db.prepare('INSERT INTO audit_logs (action, user_id, target_type, target_id) VALUES (?, ?, ?, ?)')
      .run('DOCUMENT_VERIFIED', req.user.id, 'DOCUMENT', id);

    res.json({ message: 'Document status updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteDocument = (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM documents WHERE id = ?').run(id);
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getDocuments, updateDocumentStatus, deleteDocument };
