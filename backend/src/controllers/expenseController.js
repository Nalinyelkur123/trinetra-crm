const { Expense, Client, Invoice, Payroll, Worker } = require('../models');

const getExpenses = async (req, res) => {
  const company_id = req.user?.company_id;
  try {
    const expenses = await Expense.find({ company_id }).populate('client_id', 'name').sort({ date: -1 }).lean();
    const formatted = expenses.map(e => ({
      ...e,
      id: e._id,
      client_name: e.client_id?.name
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createExpense = async (req, res) => {
  const { client_id, assignment_id, category, amount, date, description } = req.body;
  const company_id = req.user?.company_id;
  try {
    const expense = await Expense.create({
      client_id: client_id || null, 
      assignment_id: assignment_id || null, 
      category, 
      amount, 
      date, 
      description, 
      company_id
    });
    res.status(201).json({ id: expense._id, message: 'Expense recorded successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getClientProfitability = async (req, res) => {
  const company_id = req.user?.company_id;
  try {
    const clients = await Client.find({ company_id }).lean();

    const formatted = await Promise.all(clients.map(async (c) => {
      // Revenue from paid invoices
      const invoices = await Invoice.find({ client_id: c._id, status: 'paid' }).lean();
      const revenue = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

      // Payroll costs for workers under this client
      const workers = await Worker.find({ client_id: c._id }).lean();
      const workerIds = workers.map(w => w.user_id);
      const payrolls = await Payroll.find({ worker_id: { $in: workerIds } }).lean();
      const payroll_costs = payrolls.reduce((sum, p) => sum + (p.net_pay || 0), 0);

      // Operational expenses mapped to this client
      const expenses = await Expense.find({ client_id: c._id }).lean();
      const operational_expenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

      const total_costs = payroll_costs + operational_expenses;

      return {
        client_name: c.name,
        revenue,
        payroll_costs,
        operational_expenses,
        total_costs,
        profit: revenue - total_costs
      };
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteExpense = async (req, res) => {
  const { id } = req.params;
  try {
    await Expense.findByIdAndDelete(id);
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getExpenses, createExpense, getClientProfitability, deleteExpense };
