const { db } = require('../config/db');

const getClients = (req, res) => {
  const { company_id } = req.user;
  try {
    const clients = db.prepare(`
      SELECT c.*, COUNT(w.id) as worker_count 
      FROM clients c 
      LEFT JOIN workers w ON c.id = w.client_id
      WHERE c.company_id = ? 
      GROUP BY c.id
      ORDER BY c.name ASC
    `).all(company_id);
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getClientWorkforce = (req, res) => {
  const { id } = req.params;
  try {
    const workforce = db.prepare(`
      SELECT u.name, u.phone, w.job_role, w.shift_start, w.shift_end, w.working_hours, ca.name as assignment_name
      FROM workers w
      JOIN users u ON w.user_id = u.id
      LEFT JOIN client_assignments ca ON w.assignment_id = ca.id
      WHERE w.client_id = ?
    `).all(id);
    res.json(workforce);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createClient = (req, res) => {
  const { name, email, phone, contact_person, address, contract_terms, billing_rate, gst_number, agreement_start, agreement_end, payment_terms, status, shift_start, shift_end, working_hours } = req.body;
  const { company_id } = req.user;
  try {
    const stmt = db.prepare(`
      INSERT INTO clients (name, email, phone, contact_person, address, contract_terms, billing_rate, gst_number, agreement_start, agreement_end, payment_terms, status, shift_start, shift_end, working_hours, company_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(name, email, phone, contact_person, address, contract_terms, billing_rate, gst_number, agreement_start, agreement_end, payment_terms, status || 'active', shift_start || '09:00', shift_end || '18:00', working_hours || 8.0, company_id);
    res.status(201).json({ id: result.lastInsertRowid, name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateClient = (req, res) => {
  const { id } = req.params;
  const { name, email, phone, contact_person, address, contract_terms, billing_rate, gst_number, agreement_start, agreement_end, payment_terms, status, shift_start, shift_end, working_hours } = req.body;
  try {
    const stmt = db.prepare(`
      UPDATE clients 
      SET name = ?, email = ?, phone = ?, contact_person = ?, address = ?, contract_terms = ?, billing_rate = ?, gst_number = ?, agreement_start = ?, agreement_end = ?, payment_terms = ?, status = ?, shift_start = ?, shift_end = ?, working_hours = ?
      WHERE id = ?
    `);
    stmt.run(name, email, phone, contact_person, address, contract_terms, billing_rate, gst_number, agreement_start, agreement_end, payment_terms, status, shift_start, shift_end, working_hours, id);
    res.json({ message: 'Client updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteClient = (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM clients WHERE id = ?').run(id);
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getClients, getClientWorkforce, createClient, updateClient, deleteClient };
