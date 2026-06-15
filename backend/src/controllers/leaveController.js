const Leave = require('../models/Leave');
const LeaveBalance = require('../models/LeaveBalance');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Holiday = require('../models/Holiday');

const requestLeave = async (req, res) => {
  const { type, start_date, end_date, reason } = req.body;
  const worker_id = req.user.role === 'worker' ? req.user.id : req.body.worker_id;
  try {
    if (!worker_id || !['casual', 'sick', 'annual'].includes(type)) {
      return res.status(400).json({ error: 'Valid worker and leave type are required' });
    }
    if (!start_date || !end_date || new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({ error: 'Enter a valid leave date range' });
    }
    const worker = await User.findOne({ _id: worker_id, company_id: req.user.company_id, role: 'worker' }).lean();
    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    const overlap = await Leave.findOne({
      worker_id,
      status: { $in: ['pending', 'approved'] },
      start_date: { $lte: endDate },
      end_date: { $gte: startDate }
    });
    if (overlap) return res.status(409).json({ error: 'This leave overlaps an existing request' });

    const requestedDays = Math.floor((endDate - startDate) / 86400000) + 1;
    const year = startDate.getFullYear();

    // Upsert leave balance
    await LeaveBalance.findOneAndUpdate(
      { worker_id, year },
      { $setOnInsert: { worker_id, year } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const balance = await LeaveBalance.findOne({ worker_id, year }).lean();
    const totalColumn = `${type}_leaves`;
    const usedColumn = `leaves_used_${type}`;
    if (requestedDays > ((balance[totalColumn] || 0) - (balance[usedColumn] || 0))) {
      return res.status(400).json({ error: `Insufficient ${type} leave balance` });
    }

    const leave = new Leave({
      worker_id,
      type,
      start_date: startDate,
      end_date: endDate,
      reason,
      status: 'pending'
    });
    await leave.save();

    // Create notification for admin
    await Notification.create({
      user_id: req.user.role === 'admin' ? req.user.id : worker_id, // Usually notify admin
      type: 'leave_request',
      title: `Leave Request from ${worker.name}`,
      message: `${type} leave requested from ${start_date} to ${end_date}`
    });

    res.status(201).json({ message: 'Leave request submitted', leaveId: leave._id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getLeaves = async (req, res) => {
  try {
    const { worker_id, status } = req.query;

    let query = {};
    if (req.user.role === 'worker') {
      query.worker_id = req.user.id;
    } else if (worker_id) {
      query.worker_id = worker_id;
    }

    if (status) query.status = status;

    const leavesRaw = await Leave.find(query)
      .sort({ start_date: -1 })
      .populate('worker_id', 'name')
      .lean();

    const leaves = leavesRaw.map(l => ({
      ...l,
      id: l._id,
      name: l.worker_id?.name
    }));

    res.json(leaves);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const approveLeave = async (req, res) => {
  const { leaveId } = req.params;
  try {
    const leave = await Leave.findById(leaveId);
    if (!leave) return res.status(404).json({ error: 'Leave request not found' });
    if (leave.status !== 'pending') return res.status(409).json({ error: 'Leave request has already been reviewed' });

    const days = Math.floor((new Date(leave.end_date) - new Date(leave.start_date)) / 86400000) + 1;
    const year = new Date(leave.start_date).getFullYear();

    await LeaveBalance.findOneAndUpdate(
      { worker_id: leave.worker_id, year },
      { $setOnInsert: { worker_id: leave.worker_id, year } },
      { upsert: true }
    );

    const updateQuery = {};
    updateQuery[`leaves_used_${leave.type}`] = days;

    await LeaveBalance.findOneAndUpdate(
      { worker_id: leave.worker_id, year },
      { $inc: updateQuery }
    );

    leave.status = 'approved';
    leave.reviewed_by = req.user.id;
    leave.reviewed_at = new Date();
    await leave.save();

    await Notification.create({
      user_id: leave.worker_id,
      type: 'leave_approved',
      title: 'Leave Request Approved',
      message: `Your ${leave.type} leave has been approved`
    });

    res.json({ message: 'Leave approved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const rejectLeave = async (req, res) => {
  const { leaveId } = req.params;
  const { reason } = req.body;
  try {
    const leave = await Leave.findById(leaveId);
    if (!leave) return res.status(404).json({ error: 'Leave request not found' });
    if (leave.status !== 'pending') return res.status(409).json({ error: 'Leave request has already been reviewed' });

    leave.status = 'rejected';
    leave.reviewed_by = req.user.id;
    leave.reviewed_at = new Date();
    leave.rejection_reason = reason;
    await leave.save();

    await Notification.create({
      user_id: leave.worker_id,
      type: 'leave_rejected',
      title: 'Leave Request Rejected',
      message: reason || 'Your leave request has been rejected'
    });

    res.json({ message: 'Leave rejected' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getLeaveBalance = async (req, res) => {
  const worker_id = req.user.role === 'worker' ? req.user.id : req.params.worker_id;
  try {
    const year = new Date().getFullYear();
    const balance = await LeaveBalance.findOne({ worker_id, year }).lean();

    if (!balance) {
      // Initialize leave balance for new year
      const newBalance = new LeaveBalance({ worker_id, year });
      await newBalance.save();
      return res.json({ ...newBalance.toObject(), id: newBalance._id });
    }

    res.json({ ...balance, id: balance._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getHolidays = async (req, res) => {
  try {
    const holidays = await Holiday.find({ company_id: req.user.company_id }).sort({ holiday_date: 1 }).lean();
    res.json(holidays.map(h => ({ ...h, id: h._id })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createHoliday = async (req, res) => {
  const { name, holiday_date, category } = req.body;
  if (!name || !holiday_date) return res.status(400).json({ error: 'Name and date are required' });
  try {
    const holiday = new Holiday({
      name,
      holiday_date,
      category: category || 'Company',
      company_id: req.user.company_id
    });
    await holiday.save();
    res.status(201).json({ id: holiday._id, message: 'Holiday added' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const bulkReviewLeaves = async (req, res) => {
  const { leave_ids, status, reason } = req.body;
  if (!Array.isArray(leave_ids) || !leave_ids.length || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Select leaves and a valid status' });
  }

  let completed = 0;
  for (const id of leave_ids) {
    try {
      const mockReq = { ...req, params: { leaveId: id }, body: { reason }, user: req.user };
      const mockRes = {
        status: () => mockRes,
        json: (payload) => { if (!payload?.error) completed += 1; return payload; }
      };
      if (status === 'approved') {
        await approveLeave(mockReq, mockRes);
      } else {
        await rejectLeave(mockReq, mockRes);
      }
    } catch (err) {
      // ignore individual error in bulk
    }
  }
  res.json({ message: `${completed} leave request(s) ${status}` });
};

module.exports = {
  requestLeave, getLeaves, approveLeave, rejectLeave, getLeaveBalance,
  getHolidays, createHoliday, bulkReviewLeaves
};
