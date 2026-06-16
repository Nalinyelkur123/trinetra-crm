const { Payroll, User, Worker, Attendance } = require('../models');

const getPayroll = async (req, res) => {
  try {
    const payrollRecords = await Payroll.find().sort({ year: -1, month: -1 }).populate('worker_id', 'name').lean();
    
    const formatted = await Promise.all(payrollRecords.map(async (p) => {
      const worker = await Worker.findOne({ user_id: p.worker_id }).lean();
      return {
        ...p,
        id: p._id,
        worker_name: p.worker_id?.name,
        job_role: worker?.job_role
      };
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const generatePayroll = async (req, res) => {
  const { month, year, overtime_rate = 150 } = req.body;
  try {
    const users = await User.find({ company_id: req.user.company_id, role: 'worker' }).lean();
    const userIds = users.map(u => u._id);
    
    const workers = await Worker.find({ user_id: { $in: userIds }, status: 'active' }).lean();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    let generatedCount = 0;
    
    for (const worker of workers) {
      const existing = await Payroll.findOne({ worker_id: worker.user_id, month, year }).lean();
      if (existing) continue;

      const baseSalary = worker.base_salary || 25000;
      
      const attendances = await Attendance.find({ 
        worker_id: worker.user_id, 
        date: { $gte: startDate, $lte: endDate } 
      }).lean();

      let presentDays = 0;
      let overtimeHours = 0;

      attendances.forEach(a => {
        if (['present', 'late'].includes(a.status)) presentDays++;
        if (a.overtime_status === 'approved') overtimeHours += (a.overtime_hours || 0);
      });

      const overtimePay = Math.round(overtimeHours * Number(overtime_rate || 0));
      
      let netPay = baseSalary;
      if (presentDays > 0) {
         netPay = Math.round((baseSalary / 26) * presentDays);
      } else if (presentDays === 0 && attendances.length > 0) {
         netPay = 0;
      }

      await Payroll.create({
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
