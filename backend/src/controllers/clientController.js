const { Client, Worker, User, ClientAssignment } = require('../models');

const getClients = async (req, res) => {
  const { company_id } = req.user;
  try {
    const clients = await Client.find({ company_id }).sort({ name: 1 }).lean();
    
    // Get worker count per client
    const clientsWithCount = await Promise.all(clients.map(async (c) => {
      const worker_count = await Worker.countDocuments({ client_id: c._id });
      return { ...c, id: c._id, worker_count };
    }));
    
    res.json(clientsWithCount);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getClientWorkforce = async (req, res) => {
  const { id } = req.params;
  try {
    const workers = await Worker.find({ client_id: id }).populate('user_id').populate('assignment_id').lean();
    
    const workforce = workers.map(w => ({
      name: w.user_id?.name,
      phone: w.user_id?.phone,
      job_role: w.job_role,
      shift_start: w.shift_start,
      shift_end: w.shift_end,
      working_hours: w.working_hours,
      assignment_name: w.assignment_id?.name
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
    const client = await Client.create({
      name, email, phone, contact_person, address, contract_terms, billing_rate, gst_number, 
      agreement_start, agreement_end, payment_terms, status: status || 'active', 
      shift_start: shift_start || '09:00', shift_end: shift_end || '18:00', 
      working_hours: working_hours || 8.0, company_id
    });
    res.status(201).json({ id: client._id, name: client.name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateClient = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, contact_person, address, contract_terms, billing_rate, gst_number, agreement_start, agreement_end, payment_terms, status, shift_start, shift_end, working_hours } = req.body;
  try {
    await Client.findByIdAndUpdate(id, {
      name, email, phone, contact_person, address, contract_terms, billing_rate, gst_number, 
      agreement_start, agreement_end, payment_terms, status, shift_start, shift_end, working_hours
    });
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
