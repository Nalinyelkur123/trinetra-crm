const { db } = require('../config/db');

const getExpenses = (req, res) => {
  const company_id = req.user?.company_id || 1;
  try {
    const expenses = db.prepare(`
      SELECT e.*, c.name as client_name
      FROM expenses e
      LEFT JOIN clients c ON e.client_id = c.id
      WHERE e.company_id = ?
      ORDER BY e.date DESC
    `).all(company_id);
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createExpense = (req, res) => {
  const { client_id, assignment_id, category, amount, date, description } = req.body;
  const company_id = req.user?.company_id || 1;
  try {
    const stmt = db.prepare(`
      INSERT INTO expenses (client_id, assignment_id, category, amount, date, description, company_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(client_id, assignment_id || null, category, amount, date, description, company_id);
    res.status(201).json({ id: info.lastInsertRowid, message: 'Expense recorded successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getClientProfitability = (req, res) => {
  const company_id = req.user?.company_id || 1;
  try {
    const stats = db.prepare(`
      SELECT 
        c.name as client_name,
        COALESCE(SUM(i.amount), 0) as revenue,
        (SELECT COALESCE(SUM(net_pay), 0) FROM payroll py JOIN workers w ON py.worker_id = w.user_id WHERE w.client_id = c.id) as payroll_costs,
        COALESCE((SELECT SUM(amount) FROM expenses e WHERE e.client_id = c.id), 0) as operational_expenses
      FROM clients c
      LEFT JOIN invoices i ON c.id = i.client_id AND i.status = 'paid'
      WHERE c.company_id = ?
      GROUP BY c.id
    `).all(company_id);

    const formatted = stats.map(s => ({
      ...s,
      total_costs: s.payroll_costs + s.operational_expenses,
      profit: s.revenue - (s.payroll_costs + s.operational_expenses)
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteExpense = (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getExpenses, createExpense, getClientProfitability, deleteExpense };
