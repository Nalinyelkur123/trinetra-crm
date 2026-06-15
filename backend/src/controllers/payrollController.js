const Payroll = require('../models/Payroll');
const User = require('../models/User');
const Worker = require('../models/Worker');
const Attendance = require('../models/Attendance');

const getPayroll = async (req, res) => {
  try {
    const { company_id } = req.user;

    // Find all users in company
    const users = await User.find({ company_id }).lean();
    const userIds = users.map(u => u._id);

    const payrolls = await Payroll.find({ worker_id: { $in: userIds } })
      .sort({ year: -1, month: -1 })
      .populate('worker_id', 'name')
      .lean();

    const workers = await Worker.find({ user_id: { $in: userIds } }).lean();
    const workerMap = workers.reduce((acc, w) => {
      acc[w.user_id.toString()] = w;
      return acc;
    }, {});

    const result = payrolls.map(p => ({
      ...p,
      id: p._id,
      worker_name: p.worker_id?.name,
      job_role: workerMap[p.worker_id?._id?.toString()]?.job_role
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const generatePayroll = async (req, res) => {
  const { month, year, overtime_rate = 150 } = req.body;
  const { company_id } = req.user;

  try {
    const users = await User.find({ company_id, role: 'worker' }).lean();
    const userIds = users.map(u => u._id);

    const workers = await Worker.find({ user_id: { $in: userIds }, status: 'active' }).lean();
    const activeUserIds = workers.map(w => w.user_id);

    const existingPayrolls = await Payroll.find({ month, year, worker_id: { $in: activeUserIds } }).lean();
    const existingWorkerIds = new Set(existingPayrolls.map(p => p.worker_id.toString()));

    // Target month date range
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const attendances = await Attendance.find({
      worker_id: { $in: activeUserIds },
      date: { $gte: startDate, $lte: endDate }
    }).lean();

    // Group attendances by worker
    const attendanceByWorker = attendances.reduce((acc, a) => {
      const wId = a.worker_id.toString();
      if (!acc[wId]) acc[wId] = [];
      acc[wId].push(a);
      return acc;
    }, {});

    let generatedCount = 0;
    const newPayrolls = [];

    for (const worker of workers) {
      const wIdStr = worker.user_id.toString();
      if (existingWorkerIds.has(wIdStr)) continue;

      const baseSalary = worker.base_salary || 25000;
      const workerAttendances = attendanceByWorker[wIdStr] || [];

      let presentDays = 0;
      let overtimeHours = 0;

      workerAttendances.forEach(a => {
        if (a.status === 'present' || a.status === 'late') presentDays++;
        if (a.overtime_status === 'approved') overtimeHours += (a.overtime_hours || 0);
      });

      const overtimePay = Math.round(overtimeHours * Number(overtime_rate || 0));

      let netPay = baseSalary;
      if (presentDays > 0) {
        netPay = Math.round((baseSalary / 26) * presentDays);
      } else if (workerAttendances.length > 0) {
        netPay = 0;
      }

      newPayrolls.push({
        worker_id: worker.user_id,
        month,
        year,
        base_salary: baseSalary,
        overtime: overtimePay,
        net_pay: netPay + overtimePay,
        status: 'pending'
      });
      generatedCount++;
    }

    if (newPayrolls.length > 0) {
      await Payroll.insertMany(newPayrolls);
    }

    res.status(201).json({ message: `Payroll generated for ${generatedCount} personnel based on operational attendance.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updatePayrollStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await Payroll.findByIdAndUpdate(id, { status });
    res.json({ message: 'Payment status updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getPayroll, generatePayroll, updatePayrollStatus };
