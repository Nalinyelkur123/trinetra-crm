const Expense = require('../models/Expense');
const Client = require('../models/Client');
const Invoice = require('../models/Invoice');
const Payroll = require('../models/Payroll');
const Worker = require('../models/Worker');

const getExpenses = async (req, res) => {
  const company_id = req.user?.company_id;
  try {
    const expensesRaw = await Expense.find({ company_id })
      .sort({ date: -1 })
      .populate('client_id', 'name')
      .lean();

    const expenses = expensesRaw.map(e => ({
      ...e,
      id: e._id,
      client_name: e.client_id?.name || null
    }));

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createExpense = async (req, res) => {
  const { client_id, assignment_id, category, amount, date, description } = req.body;
  const company_id = req.user?.company_id;
  try {
    const expense = new Expense({
      client_id: client_id || undefined,
      assignment_id: assignment_id || undefined,
      category,
      amount,
      date,
      description,
      company_id
    });
    await expense.save();
    res.status(201).json({ id: expense._id, message: 'Expense recorded successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getClientProfitability = async (req, res) => {
  const company_id = req.user?.company_id;
  try {
    const clients = await Client.find({ company_id }).lean();
    const invoices = await Invoice.find({ company_id, status: 'paid' }).lean();
    const expenses = await Expense.find({ company_id }).lean();

    // Workers with client
    const workers = await Worker.find({ client_id: { $ne: null } }).lean();
    const workerToClient = workers.reduce((acc, w) => {
      acc[w.user_id.toString()] = w.client_id.toString();
      return acc;
    }, {});

    const payrolls = await Payroll.find().lean(); // Could filter by company_id if added

    const result = clients.map(client => {
      const clientIdStr = client._id.toString();

      const revenue = invoices
        .filter(i => i.client_id?.toString() === clientIdStr)
        .reduce((sum, i) => sum + (i.amount || 0), 0);

      const operational_expenses = expenses
        .filter(e => e.client_id?.toString() === clientIdStr)
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      const payroll_costs = payrolls
        .filter(p => workerToClient[p.worker_id?.toString()] === clientIdStr)
        .reduce((sum, p) => sum + (p.net_pay || 0), 0);

      const total_costs = payroll_costs + operational_expenses;
      return {
        client_name: client.name,
        revenue,
        payroll_costs,
        operational_expenses,
        total_costs,
        profit: revenue - total_costs
      };
    });

    res.json(result);
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
