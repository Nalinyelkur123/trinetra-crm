const { Worker, Attendance, Client, Payroll, Document, User } = require('../models');

const getReportStats = async (req, res) => {
  try {
    const workforceCount = await Worker.countDocuments({ status: 'active' });
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    const attendanceToday = await Attendance.countDocuments({
      date: { $gte: todayStart, $lte: todayEnd },
      status: { $in: ['present', 'late'] }
    });

    const totalClients = await Client.countDocuments();
    const pendingPayroll = await Payroll.countDocuments({ status: 'pending' });

    res.json({
      workforce: workforceCount,
      attendance: attendanceToday,
      clients: totalClients,
      payroll: pendingPayroll,
      lastUpdated: new Date().toLocaleTimeString()
    });
  } catch (error) {
    console.error('Report Stats Error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

const getReportDetail = async (req, res) => {
  const { type } = req.params;
  try {
    let headers = [];
    let rows = [];
    let summary = '';

    switch (type) {
      case 'Monthly Payroll Summary':
        headers = ['Worker Name', 'Month/Year', 'Base Salary', 'OT', 'Deductions', 'Net Pay', 'Status'];
        const payrolls = await Payroll.find().sort({ year: -1, month: -1 }).limit(100).populate('worker_id', 'name').lean();
        rows = payrolls.map(p => [
          p.worker_id?.name || 'Unknown', 
          `${p.month}/${p.year}`, 
          p.base_salary, 
          p.overtime, 
          p.deductions, 
          p.net_pay, 
          p.status
        ]);
        summary = 'Strategic payroll disbursement matrix reconciled against active workforce ledger.';
        break;

      case 'Daily Attendance Matrix':
        headers = ['Operator', 'Date', 'Status', 'Check-In', 'OT Hours', 'Location'];
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const attendances = await Attendance.find({ date: { $gte: sevenDaysAgo } }).sort({ date: -1 }).limit(100).populate('worker_id', 'name').lean();
        rows = attendances.map(a => [
          a.worker_id?.name || 'Unknown', 
          new Date(a.date).toLocaleDateString(), 
          a.status, 
          a.check_in_time ? new Date(a.check_in_time).toLocaleTimeString() : '--:--', 
          a.overtime_hours || 0, 
          a.location
        ]);
        summary = 'Personnel deployment verification log synchronized with real-time clock-in data.';
        break;

      case 'Worker Deployment Log':
        headers = ['Worker Name', 'Job Role', 'Assigned Site', 'Joined Date', 'Status'];
        const workers = await Worker.find().sort({ joined_date: -1 }).populate('user_id', 'name').populate('client_id', 'name').lean();
        rows = workers.map(w => [
          w.user_id?.name || 'Unknown', 
          w.job_role || 'General', 
          w.client_id?.name || 'Unassigned', 
          w.joined_date ? new Date(w.joined_date).toLocaleDateString() : 'Unknown', 
          w.status
        ]);
        summary = 'Tactical distribution of personnel across active operational sites and client portfolios.';
        break;

      case 'Compliance Audit Report':
        headers = ['Worker', 'Document Type', 'Expiry Date', 'Status', 'Uploaded At'];
        const documents = await Document.find().sort({ createdAt: -1 }).populate('worker_id', 'name').lean();
        rows = documents.map(d => [
          d.worker_id?.name || 'Unknown', 
          d.type, 
          d.expiry_date ? new Date(d.expiry_date).toLocaleDateString() : 'N/A', 
          d.status, 
          new Date(d.createdAt).toLocaleDateString()
        ]);
        summary = 'Statutory audit of personnel documentation and regulatory compliance lifecycle.';
        break;

      case 'Identity Verification Trace':
        headers = ['Worker Name', 'PAN Number', 'Aadhaar Number', 'UAN Number', 'Blood Group'];
        const identityWorkers = await Worker.find({ aadhaar_number: { $ne: null } }).populate('user_id', 'name').lean();
        rows = identityWorkers.map(w => [
          w.user_id?.name || 'Unknown', 
          w.pan_number || 'N/A', 
          w.aadhaar_number || 'N/A', 
          w.uan_number || 'N/A', 
          w.blood_group || 'N/A'
        ]);
        summary = 'End-to-end traceability of personnel identity records and verification metadata.';
        break;

      case 'Site Distribution Analytics':
        headers = ['Client Partner', 'Contact Person', 'Personnel Deployed', 'GST Number', 'Status'];
        const clients = await Client.find().lean();
        rows = await Promise.all(clients.map(async c => {
          const workerCount = await Worker.countDocuments({ client_id: c._id });
          return [
            c.name, 
            c.contact_person || 'N/A', 
            workerCount, 
            c.gst_number || 'N/A', 
            c.status || 'Active'
          ];
        }));
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
