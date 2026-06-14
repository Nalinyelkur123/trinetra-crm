const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const Worker = require('../models/Worker');
const Attendance = require('../models/Attendance');

const getInvoices = async (req, res) => {
  const { company_id } = req.user;
  try {
    const invoicesRaw = await Invoice.find({ company_id })
      .sort({ issue_date: -1 })
      .populate('client_id', 'name')
      .populate('assignment_id', 'name')
      .lean();

    const invoices = invoicesRaw.map(i => ({
      ...i,
      id: i._id,
      client_name: i.client_id?.name,
      assignment_name: i.assignment_id?.name || null
    }));

    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const generateInvoice = async (req, res) => {
  const { client_id, assignment_id, issue_date, due_date } = req.body;
  const { company_id } = req.user;

  try {
    const client = await Client.findById(client_id).lean();
    if (!client) {
      return res.status(404).json({ error: 'Client record not found. Unable to calculate billing.' });
    }
    
    // Find workers assigned to this client
    const workers = await Worker.find({ client_id }).lean();
    const workerIds = workers.map(w => w.user_id);

    const issueDateObj = issue_date ? new Date(issue_date) : new Date('2000-01-01');
    const dueDateObj = due_date ? new Date(due_date) : new Date('2100-01-01');

    // Count present/late attendance for these workers in date range
    const attendanceCount = await Attendance.countDocuments({
      worker_id: { $in: workerIds },
      status: { $in: ['present', 'late'] },
      date: { $gte: issueDateObj, $lte: dueDateObj }
    });

    const amount = (client.billing_rate || 0) * attendanceCount;
    const gst_amount = amount * 0.18;
    const total_amount = amount + gst_amount;

    const invoice = new Invoice({
      client_id,
      assignment_id: assignment_id || undefined,
      amount,
      gst_amount,
      total_amount,
      issue_date,
      due_date,
      company_id
    });
    await invoice.save();
    
    res.status(201).json({ id: invoice._id, message: 'Invoice generated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateInvoiceStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await Invoice.findByIdAndUpdate(id, { status });
    res.json({ message: 'Invoice status updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteInvoice = async (req, res) => {
  const { id } = req.params;
  try {
    await Invoice.findByIdAndDelete(id);
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createInvoice = async (req, res) => {
  const { client_id, assignment_id, amount, gst_amount, total_amount, issue_date, due_date, status } = req.body;
  const { company_id } = req.user;

  try {
    const invoice = new Invoice({
      client_id,
      assignment_id: assignment_id || undefined,
      amount,
      gst_amount,
      total_amount,
      issue_date,
      due_date,
      status: status || 'pending',
      company_id
    });
    await invoice.save();
    
    res.status(201).json({ id: invoice._id, message: 'Invoice created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getInvoices, generateInvoice, updateInvoiceStatus, deleteInvoice, createInvoice };
