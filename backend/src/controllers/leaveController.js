const { Leave, LeaveBalance, Notification, Holiday, User } = require('../models');

const requestLeave = async (req, res) => {
  const { type, start_date, end_date, reason } = req.body;
  const worker_id = req.user.role === 'worker' ? req.user.id : req.body.worker_id;
  try {
    if (!worker_id || !['casual', 'sick', 'annual'].includes(type)) {
      return res.status(400).json({ error: 'Valid worker and leave type are required' });
    }
    if (!start_date || !end_date || end_date < start_date) {
      return res.status(400).json({ error: 'Enter a valid leave date range' });
    }
    
    const worker = await User.findOne({ _id: worker_id, company_id: req.user.company_id, role: 'worker' }).lean();
    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    const overlap = await Leave.findOne({
      worker_id,
      status: { $in: ['pending', 'approved'] },
      start_date: { $lte: new Date(end_date) },
      end_date: { $gte: new Date(start_date) }
    });
    if (overlap) return res.status(409).json({ error: 'This leave overlaps an existing request' });

    const requestedDays = Math.floor((new Date(end_date) - new Date(start_date)) / 86400000) + 1;
    const year = Number(start_date.slice(0, 4));

    let balance = await LeaveBalance.findOne({ worker_id, year });
    if (!balance) {
      balance = await LeaveBalance.create({ worker_id, year });
    }
    
    const totalField = `${type}_leaves`;
    const usedField = `leaves_used_${type}`;
    
    if (requestedDays > (balance[totalField] - balance[usedField])) {
      return res.status(400).json({ error: `Insufficient ${type} leave balance` });
    }

    const leave = await Leave.create({ worker_id, type, start_date, end_date, reason, status: 'pending' });
    
    await Notification.create({
      user_id: req.user.role === 'admin' ? req.user.id : worker_id, // should probably notify admins, using worker id as fallback if no admin specifically, or we need to find admin
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
    
    const users = await User.find({ company_id: req.user.company_id }).lean();
    const userIds = users.map(u => u._id);

    const filter = { worker_id: { $in: userIds } };
    
    if (req.user.role === 'worker') {
      filter.worker_id = req.user.id;
    } else if (worker_id) {
      filter.worker_id = worker_id;
    }
    if (status) filter.status = status;
    
    const leaves = await Leave.find(filter).populate('worker_id', 'name').sort({ start_date: -1 }).lean();
    const formatted = leaves.map(l => ({ ...l, id: l._id, name: l.worker_id?.name }));
    
    res.json(formatted);
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

    let balance = await LeaveBalance.findOne({ worker_id: leave.worker_id, year });
    if (!balance) balance = await LeaveBalance.create({ worker_id: leave.worker_id, year });

    balance[`leaves_used_${leave.type}`] += days;
    await balance.save();

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
    leave.rejection_reason = reason || null;
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
  const year = new Date().getFullYear();
  try {
    let balance = await LeaveBalance.findOne({ worker_id, year });
    if (!balance) {
      balance = await LeaveBalance.create({ worker_id, year });
    }
    res.json(balance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getHolidays = async (req, res) => {
  try {
    const holidays = await Holiday.find({ company_id: req.user.company_id }).sort({ holiday_date: 1 });
    res.json(holidays);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createHoliday = async (req, res) => {
  const { name, holiday_date, category } = req.body;
  if (!name || !holiday_date) return res.status(400).json({ error: 'Name and date are required' });
  try {
    const holiday = await Holiday.create({ name, holiday_date, category: category || 'Company', company_id: req.user.company_id });
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
      if (status === 'approved') {
        const mockRes = { status: () => mockRes, json: () => {} };
        await approveLeave({ params: { leaveId: id }, user: req.user }, mockRes);
        completed++;
      } else {
        const mockRes = { status: () => mockRes, json: () => {} };
        await rejectLeave({ params: { leaveId: id }, body: { reason }, user: req.user }, mockRes);
        completed++;
      }
    } catch (err) {
      // ignore individual failures for bulk
    }
  }
  
  res.json({ message: `${completed} leave request(s) ${status}` });
};

module.exports = {
  requestLeave, getLeaves, approveLeave, rejectLeave, getLeaveBalance,
  getHolidays, createHoliday, bulkReviewLeaves
};
