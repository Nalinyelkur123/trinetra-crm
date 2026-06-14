const { db } = require('../config/db');

const getPayroll = (req, res) => {
  try {
    const payroll = db.prepare(`
      SELECT p.*, u.name as worker_name, w.job_role
      FROM payroll p
      JOIN users u ON p.worker_id = u.id
      JOIN workers w ON u.id = w.user_id
      ORDER BY p.year DESC, p.month DESC
    `).all();
    res.json(payroll);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const generatePayroll = (req, res) => {
  const { month, year, overtime_rate = 150 } = req.body;
  try {
    const workers = db.prepare(`
      SELECT w.id, w.user_id, w.base_salary FROM workers w
      JOIN users u ON w.user_id = u.id
      WHERE w.status = 'active' AND u.company_id = ?
    `).all(req.user.company_id);
    
    const checkStmt = db.prepare("SELECT id FROM payroll WHERE worker_id = ? AND month = ? AND year = ?");
    // Pad month for SQL matching (e.g., '5' becomes '05')
    const paddedMonth = month.toString().padStart(2, '0');
    
    const attendanceStmt = db.prepare(`
      SELECT
        SUM(CASE WHEN status IN ('present', 'late') THEN 1 ELSE 0 END) as present_days,
        COALESCE(SUM(CASE WHEN overtime_status = 'approved' THEN overtime_hours ELSE 0 END), 0) as approved_overtime
      FROM attendance 
      WHERE worker_id = ? 
      AND strftime('%m', date) = ? 
      AND strftime('%Y', date) = ?
    `);

    let generatedCount = 0;
    const transaction = db.transaction((workersList) => {
      for (const worker of workersList) {
        const existing = checkStmt.get(worker.user_id, month, year);
        if (existing) continue;

        const baseSalary = worker.base_salary || 25000;
        
        // Calculate based on attendance
        const attendanceData = attendanceStmt.get(worker.user_id, paddedMonth, year.toString());
        const presentDays = attendanceData?.present_days || 0;
        const overtimeHours = attendanceData?.approved_overtime || 0;
        const overtimePay = Math.round(overtimeHours * Number(overtime_rate || 0));
        
        // Assume 26 working days for calculation if present days > 0, otherwise base salary (placeholder logic)
        // In production, we'd use actual days in month.
        let netPay = baseSalary;
        if (presentDays > 0) {
           netPay = Math.round((baseSalary / 26) * presentDays);
        } else if (presentDays === 0) {
           // If they have attendance records but 0 present days, pay might be 0.
           // But if they have NO attendance records, we might want to pay full (for now) or 0.
           // Let's check if they HAVE any records for this month.
           const recordCount = db.prepare(`SELECT COUNT(*) as count FROM attendance WHERE worker_id = ? AND strftime('%m', date) = ? AND strftime('%Y', date) = ?`).get(worker.user_id, paddedMonth, year.toString());
           if (recordCount.count > 0) netPay = 0;
        }

        db.prepare(`
          INSERT INTO payroll (worker_id, month, year, base_salary, overtime, net_pay, status)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(worker.user_id, month, year, baseSalary, overtimePay, netPay + overtimePay, 'pending');
        generatedCount++;
      }
    });

    transaction(workers);

    res.status(201).json({ message: `Payroll generated for ${generatedCount} personnel based on operational attendance.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updatePayrollStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    db.prepare('UPDATE payroll SET status = ? WHERE id = ?').run(status, id);
    res.json({ message: 'Payment status updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getPayroll, generatePayroll, updatePayrollStatus };
