const { Candidate } = require('../models');

const getCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find().sort({ applied_date: -1 }).lean();
    
    const formatted = candidates.map(c => ({
      ...c,
      id: c._id
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const addCandidate = async (req, res) => {
  const { name, email, phone, job_role } = req.body;
  try {
    const candidate = await Candidate.create({ name, email, phone, job_role });
    res.status(201).json({ id: candidate._id, name, status: 'Screening' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateCandidateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await Candidate.findByIdAndUpdate(id, { status });
    res.json({ message: 'Candidate status updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteCandidate = async (req, res) => {
  const { id } = req.params;
  try {
    await Candidate.findByIdAndDelete(id);
    res.json({ message: 'Candidate deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getCandidates, addCandidate, updateCandidateStatus, deleteCandidate };
