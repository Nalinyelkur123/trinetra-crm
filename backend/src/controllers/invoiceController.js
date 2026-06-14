const { db } = require('../config/db');

const getInvoices = (req, res) => {
  const { company_id } = req.user;
  try {
    const invoices = db.prepare(`
      SELECT i.*, c.name as client_name, a.name as assignment_name
      FROM invoices i
      JOIN clients c ON i.client_id = c.id
      LEFT JOIN client_assignments a ON i.assignment_id = a.id
      WHERE i.company_id = ?
      ORDER BY i.issue_date DESC
    `).all(company_id);
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const generateInvoice = (req, res) => {
  const { client_id, assignment_id, issue_date, due_date } = req.body;
  const { company_id } = req.user;

  try {
    const client = db.prepare('SELECT billing_rate FROM clients WHERE id = ?').get(client_id);
    if (!client) {
      return res.status(404).json({ error: 'Client record not found. Unable to calculate billing.' });
    }
    
    const attendanceCount = db.prepare(`
      SELECT COUNT(*) as total_days
      FROM attendance a
      JOIN workers w ON a.worker_id = w.user_id
      WHERE w.client_id = ? AND a.status IN ('present', 'late')
      AND a.date BETWEEN ? AND ?
    `).get(client_id, issue_date || '2000-01-01', due_date || '2100-01-01');

    const amount = (client.billing_rate || 0) * (attendanceCount.total_days || 0);
    const gst_amount = amount * 0.18;
    const total_amount = amount + gst_amount;

    const stmt = db.prepare(`
      INSERT INTO invoices (client_id, assignment_id, amount, gst_amount, total_amount, issue_date, due_date, company_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(client_id, assignment_id || null, amount, gst_amount, total_amount, issue_date, due_date, company_id);
    
    res.status(201).json({ id: info.lastInsertRowid, message: 'Invoice generated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateInvoiceStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    db.prepare('UPDATE invoices SET status = ? WHERE id = ?').run(status, id);
    res.json({ message: 'Invoice status updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteInvoice = (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM invoices WHERE id = ?').run(id);
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createInvoice = (req, res) => {
  const { client_id, assignment_id, amount, gst_amount, total_amount, issue_date, due_date, status } = req.body;
  const { company_id } = req.user;

  try {
    const stmt = db.prepare(`
      INSERT INTO invoices (client_id, assignment_id, amount, gst_amount, total_amount, issue_date, due_date, status, company_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      client_id, 
      assignment_id || null, 
      amount, 
      gst_amount, 
      total_amount, 
      issue_date, 
      due_date, 
      status || 'pending', 
      company_id
    );
    
    res.status(201).json({ id: info.lastInsertRowid, message: 'Invoice created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getInvoices, generateInvoice, updateInvoiceStatus, deleteInvoice, createInvoice };
