const { db } = require('../config/db');

const getReportStats = (req, res) => {
  try {
    const workforceCount = db.prepare("SELECT COUNT(*) as count FROM workers WHERE status = 'active'").get();
    const attendanceToday = db.prepare("SELECT COUNT(*) as count FROM attendance WHERE date = date('now') AND status IN ('present', 'late')").get();
    const totalClients = db.prepare('SELECT COUNT(*) as count FROM clients').get();
    const pendingPayroll = db.prepare("SELECT COUNT(*) as count FROM payroll WHERE status = 'pending'").get();

    console.log('--- DEBUG: Report Stats ---');
    console.log('Workforce Row:', workforceCount);
    console.log('Attendance Row:', attendanceToday);
    console.log('Clients Row:', totalClients);
    console.log('Payroll Row:', pendingPayroll);
    console.log('---------------------------');

    console.log('Report Stats Fetched:', {
      workforce: workforceCount.count,
      attendance: attendanceToday.count,
      clients: totalClients.count,
      payroll: pendingPayroll.count
    });

    res.json({
      workforce: workforceCount.count,
      attendance: attendanceToday.count,
      clients: totalClients.count,
      payroll: pendingPayroll.count,
      lastUpdated: new Date().toLocaleTimeString()
    });
  } catch (error) {
    console.error('Report Stats Error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

const getReportDetail = (req, res) => {
  const { type } = req.params;
  try {
    let headers = [];
    let rows = [];
    let summary = '';

    switch (type) {
      case 'Monthly Payroll Summary':
        headers = ['Worker Name', 'Month/Year', 'Base Salary', 'OT', 'Deductions', 'Net Pay', 'Status'];
        rows = db.prepare(`
          SELECT u.name, p.month || '/' || p.year as period, p.base_salary, p.overtime, p.deductions, p.net_pay, p.status
          FROM payroll p
          JOIN users u ON p.worker_id = u.id
          ORDER BY p.year DESC, p.month DESC
          LIMIT 100
        `).all().map(r => [r.name, r.period, r.base_salary, r.overtime, r.deductions, r.net_pay, r.status]);
        summary = 'Strategic payroll disbursement matrix reconciled against active workforce ledger.';
        break;

      case 'Daily Attendance Matrix':
        headers = ['Operator', 'Date', 'Status', 'Check-In', 'OT Hours', 'Location'];
        rows = db.prepare(`
          SELECT u.name, a.date, a.status, a.check_in_time, a.overtime_hours, a.location
          FROM attendance a
          JOIN users u ON a.worker_id = u.id
          WHERE a.date >= date('now', '-7 days')
          ORDER BY a.date DESC
          LIMIT 100
        `).all().map(r => [r.name, r.date, r.status, r.check_in_time || '--:--', r.overtime_hours || 0, r.location]);
        summary = 'Personnel deployment verification log synchronized with real-time clock-in data.';
        break;

      case 'Worker Deployment Log':
        headers = ['Worker Name', 'Job Role', 'Assigned Site', 'Joined Date', 'Status'];
        rows = db.prepare(`
          SELECT u.name, w.job_role, c.name as client_name, w.joined_date, w.status
          FROM workers w
          JOIN users u ON w.user_id = u.id
          LEFT JOIN clients c ON w.client_id = c.id
          ORDER BY w.joined_date DESC
        `).all().map(r => [r.name, r.job_role || 'General', r.client_name || 'Unassigned', r.joined_date, r.status]);
        summary = 'Tactical distribution of personnel across active operational sites and client portfolios.';
        break;

      case 'Compliance Audit Report':
        headers = ['Worker', 'Document Type', 'Expiry Date', 'Status', 'Uploaded At'];
        rows = db.prepare(`
          SELECT u.name, d.type, d.expiry_date, d.status, d.created_at
          FROM documents d
          JOIN users u ON d.worker_id = u.id
          ORDER BY d.created_at DESC
        `).all().map(r => [r.name, r.type, r.expiry_date || 'N/A', r.status, new Date(r.created_at).toLocaleDateString()]);
        summary = 'Statutory audit of personnel documentation and regulatory compliance lifecycle.';
        break;

      case 'Identity Verification Trace':
        headers = ['Worker Name', 'PAN Number', 'Aadhaar Number', 'UAN Number', 'Blood Group'];
        rows = db.prepare(`
          SELECT u.name, w.pan_number, w.aadhaar_number, w.uan_number, w.blood_group
          FROM workers w
          JOIN users u ON w.user_id = u.id
          WHERE w.aadhaar_number IS NOT NULL
        `).all().map(r => [r.name, r.pan_number || 'N/A', r.aadhaar_number || 'N/A', r.uan_number || 'N/A', r.blood_group || 'N/A']);
        summary = 'End-to-end traceability of personnel identity records and verification metadata.';
        break;

      case 'Site Distribution Analytics':
        headers = ['Client Partner', 'Contact Person', 'Personnel Deployed', 'GST Number', 'Status'];
        rows = db.prepare(`
          SELECT c.name, c.contact_person, (SELECT COUNT(*) FROM workers WHERE client_id = c.id) as worker_count, c.gst_number, c.status
          FROM clients c
        `).all().map(r => [r.name, r.contact_person || 'N/A', r.worker_count, r.gst_number || 'N/A', r.status || 'Active']);
        summary = 'Site-level operational efficiency analytics and partner deployment demographics.';
        break;

      default:
        return res.status(404).json({ error: 'Report type not found' });
    }

    res.json({ headers, rows, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getReportStats, getReportDetail };
