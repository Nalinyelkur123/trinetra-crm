const Client = require('../models/Client');
const Worker = require('../models/Worker');
const User = require('../models/User');

const getClients = async (req, res) => {
  const { company_id } = req.user;
  try {
    const clients = await Client.find({ company_id }).lean();

    // Get worker counts per client
    const workerCounts = await Worker.aggregate([
      { $match: { client_id: { $in: clients.map(c => c._id) } } },
      { $group: { _id: '$client_id', count: { $sum: 1 } } }
    ]);

    const countMap = workerCounts.reduce((acc, curr) => {
      acc[curr._id.toString()] = curr.count;
      return acc;
    }, {});

    const result = clients.map(c => ({
      ...c,
      id: c._id,
      worker_count: countMap[c._id.toString()] || 0
    })).sort((a, b) => a.name.localeCompare(b.name));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getClientWorkforce = async (req, res) => {
  const { id } = req.params;
  try {
    const workers = await Worker.find({ client_id: id })
      .populate('user_id', 'name phone')
      .populate('assignment_id', 'name')
      .lean();

    const workforce = workers.map(w => ({
      name: w.user_id?.name,
      phone: w.user_id?.phone,
      job_role: w.job_role,
      shift_start: w.shift_start,
      shift_end: w.shift_end,
      working_hours: w.working_hours,
      assignment_name: w.assignment_id?.name || null
    }));

    res.json(workforce);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createClient = async (req, res) => {
  const { name, email, phone, contact_person, address, contract_terms, billing_rate, gst_number, agreement_start, agreement_end, payment_terms, status, shift_start, shift_end, working_hours } = req.body;
  const { company_id } = req.user;
  try {
    const client = new Client({
      name, email, phone, contact_person, address, contract_terms, billing_rate, gst_number,
      agreement_start, agreement_end, payment_terms,
      status: status || 'active',
      shift_start: shift_start || '09:00',
      shift_end: shift_end || '18:00',
      working_hours: working_hours || 8.0,
      company_id
    });
    await client.save();
    res.status(201).json({ id: client._id, name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateClient = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  try {
    await Client.findByIdAndUpdate(id, updateData);
    res.json({ message: 'Client updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteClient = async (req, res) => {
  const { id } = req.params;
  try {
    await Client.findByIdAndDelete(id);
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getClients, getClientWorkforce, createClient, updateClient, deleteClient };
