const Worker = require('../models/Worker');
const Attendance = require('../models/Attendance');
const Client = require('../models/Client');
const Payroll = require('../models/Payroll');
const Document = require('../models/Document');
const User = require('../models/User');

const getReportStats = async (req, res) => {
  try {
    const workforceCount = await Worker.countDocuments({ status: 'active' });

    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendanceToday = await Attendance.countDocuments({
      date: { $gte: today, $lt: tomorrow },
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
        rows = payrolls.map(r => [r.worker_id?.name || 'N/A', `${r.month}/${r.year}`, r.base_salary, r.overtime, r.deductions || 0, r.net_pay, r.status]);
        summary = 'Strategic payroll disbursement matrix reconciled against active workforce ledger.';
        break;

      case 'Daily Attendance Matrix':
        headers = ['Operator', 'Date', 'Status', 'Check-In', 'OT Hours', 'Location'];
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const attendances = await Attendance.find({ date: { $gte: sevenDaysAgo } }).sort({ date: -1 }).limit(100).populate('worker_id', 'name').lean();
        rows = attendances.map(r => [r.worker_id?.name || 'N/A', r.date.toISOString().split('T')[0], r.status, r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString() : '--:--', r.overtime_hours || 0, r.location || 'Main HQ']);
        summary = 'Personnel deployment verification log synchronized with real-time clock-in data.';
        break;

      case 'Worker Deployment Log':
        headers = ['Worker Name', 'Job Role', 'Assigned Site', 'Joined Date', 'Status'];
        const workers = await Worker.find().sort({ joined_date: -1 }).populate('user_id', 'name').populate('client_id', 'name').lean();
        rows = workers.map(r => [r.user_id?.name || 'N/A', r.job_role || 'General', r.client_id?.name || 'Unassigned', r.joined_date ? new Date(r.joined_date).toISOString().split('T')[0] : 'N/A', r.status]);
        summary = 'Tactical distribution of personnel across active operational sites and client portfolios.';
        break;

      case 'Compliance Audit Report':
        headers = ['Worker', 'Document Type', 'Expiry Date', 'Status', 'Uploaded At'];
        const documents = await Document.find().sort({ created_at: -1 }).populate('worker_id', 'name').lean();
        rows = documents.map(r => [r.worker_id?.name || 'N/A', r.type, r.expiry_date ? new Date(r.expiry_date).toISOString().split('T')[0] : 'N/A', r.status || 'Pending', new Date(r.createdAt).toLocaleDateString()]);
        summary = 'Statutory audit of personnel documentation and regulatory compliance lifecycle.';
        break;

      case 'Identity Verification Trace':
        headers = ['Worker Name', 'PAN Number', 'Aadhaar Number', 'UAN Number', 'Blood Group'];
        const verifiedWorkers = await Worker.find({ aadhaar_number: { $ne: null } }).populate('user_id', 'name').lean();
        rows = verifiedWorkers.map(r => [r.user_id?.name || 'N/A', r.pan_number || 'N/A', r.aadhaar_number || 'N/A', r.uan_number || 'N/A', r.blood_group || 'N/A']);
        summary = 'End-to-end traceability of personnel identity records and verification metadata.';
        break;

      case 'Site Distribution Analytics':
        headers = ['Client Partner', 'Contact Person', 'Personnel Deployed', 'GST Number', 'Status'];
        const clients = await Client.find().lean();
        const clientIds = clients.map(c => c._id);
        const workerCountsRaw = await Worker.aggregate([
          { $match: { client_id: { $in: clientIds } } },
          { $group: { _id: '$client_id', count: { $sum: 1 } } }
        ]);
        const countMap = workerCountsRaw.reduce((acc, curr) => { acc[curr._id.toString()] = curr.count; return acc; }, {});
        rows = clients.map(r => [r.name, r.contact_person || 'N/A', countMap[r._id.toString()] || 0, r.gst_number || 'N/A', r.status || 'Active']);
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
