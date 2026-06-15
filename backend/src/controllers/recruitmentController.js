const Candidate = require('../models/Candidate');

const getCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find().sort({ applied_date: -1 }).lean();
    res.json(candidates.map(c => ({ ...c, id: c._id })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const addCandidate = async (req, res) => {
  const { name, email, phone, job_role } = req.body;
  try {
    const candidate = new Candidate({
      name,
      email,
      phone,
      job_role,
      status: 'Screening'
    });
    await candidate.save();
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
