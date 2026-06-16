const { Document, AuditLog } = require('../models');

const getDocuments = async (req, res) => {
  try {
    const docs = await Document.find().populate('worker_id', 'name').sort({ createdAt: -1 }).lean();
    const formattedDocs = docs.map(d => ({
      ...d,
      id: d._id,
      worker_name: d.worker_id?.name
    }));
    res.json(formattedDocs);
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
