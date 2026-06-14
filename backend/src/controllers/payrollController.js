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
  const { month, year } = req.body;
  try {
    const workers = db.prepare("SELECT id, user_id, base_salary FROM workers WHERE status = 'active'").all();
    
    const checkStmt = db.prepare("SELECT id FROM payroll WHERE worker_id = ? AND month = ? AND year = ?");
    const insertStmt = db.prepare(`
      INSERT INTO payroll (worker_id, month, year, base_salary, net_pay, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    // Pad month for SQL matching (e.g., '5' becomes '05')
    const paddedMonth = month.toString().padStart(2, '0');
    
    const attendanceStmt = db.prepare(`
      SELECT COUNT(*) as present_days 
      FROM attendance 
      WHERE worker_id = ? 
      AND strftime('%m', date) = ? 
      AND strftime('%Y', date) = ?
      AND status = 'present'
    `);

    let generatedCount = 0;
    const transaction = db.transaction((workersList) => {
      for (const worker of workersList) {
        const existing = checkStmt.get(worker.user_id, month, year);
        if (existing) continue;

        const baseSalary = worker.base_salary || 25000;
        
        // Calculate based on attendance
        const attendanceData = attendanceStmt.get(worker.user_id, paddedMonth, year.toString());
        const presentDays = attendanceData ? attendanceData.present_days : 0;
        
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

        insertStmt.run(worker.user_id, month, year, baseSalary, netPay, 'pending');
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
