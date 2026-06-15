const Document = require('../models/Document');
const AuditLog = require('../models/AuditLog');

const getDocuments = async (req, res) => {
  try {
    const docsRaw = await Document.find()
      .sort({ created_at: -1 })
      .populate('worker_id', 'name')
      .lean();

    const docs = docsRaw.map(d => ({
      ...d,
      id: d._id,
      worker_name: d.worker_id?.name
    }));

    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateDocumentStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await Document.findByIdAndUpdate(id, { status });
    
    // Log Activity
    await AuditLog.create({
      action: 'DOCUMENT_VERIFIED',
      user_id: req.user.id,
      target_type: 'DOCUMENT',
      target_id: id
    });

    res.json({ message: 'Document status updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteDocument = async (req, res) => {
  const { id } = req.params;
  try {
    await Document.findByIdAndDelete(id);
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getDocuments, updateDocumentStatus, deleteDocument };
