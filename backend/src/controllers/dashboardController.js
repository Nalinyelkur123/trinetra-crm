const { Worker, Attendance, AuditLog, Client, ClientAssignment, Leave, Note } = require('../models');

const getDashboardStats = async (req, res) => {
  try {
    const totalWorkers = await Worker.countDocuments();
    const activeWorkers = await Worker.countDocuments({ status: 'active' });

    const today = new Date(new Date().toISOString().split('T')[0]);
    
    const attendances = await Attendance.find({ date: today }).lean();
    const attendanceStats = { present: 0, absent: 0, late: 0, half_day: 0 };
    attendances.forEach(a => {
      if (attendanceStats[a.status] !== undefined) attendanceStats[a.status]++;
      else attendanceStats[a.status] = 1;
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const trendDataRaw = await Attendance.aggregate([
      { $match: { date: { $gte: sevenDaysAgo }, status: { $in: ['present', 'late', 'half-day'] } } },
      { $group: { _id: "$date", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    const trendData = trendDataRaw.map(t => ({ date: t._id, count: t.count }));

    const recentLogs = await AuditLog.find().sort({ timestamp: -1 }).limit(10).populate('user_id', 'name').lean();
    const formattedLogs = recentLogs.map(l => ({
      action: l.action,
      timestamp: l.timestamp,
      user_name: l.user_id?.name
    }));

    const clients = await Client.find().lean();
    const assignments = await ClientAssignment.find().lean();
    
    const assignmentStats = await Promise.all(assignments.map(async (ca) => {
      const client = clients.find(c => c._id.toString() === ca.client_id?.toString());
      const worker_count = await Worker.countDocuments({ assignment_id: ca._id });
      return {
        client_name: client?.name,
        assignment_name: ca.name,
        worker_count
      };
    })).then(res => res.filter(a => a.worker_count > 0));

    const pendingLeaves = await Leave.find({ status: 'pending' }).sort({ createdAt: -1 }).limit(5).populate('worker_id', 'name').lean();
    const formattedLeaves = pendingLeaves.map(l => ({
      ...l,
      worker_name: l.worker_id?.name
    }));

    const recentNotes = await Note.find({ is_completed: false }).sort({ createdAt: -1 }).limit(5).lean();

    res.json({
      summary: {
        totalWorkers,
        activeWorkers,
        deploymentRate: totalWorkers > 0 ? ((activeWorkers / totalWorkers) * 100).toFixed(1) : 0,
        todayAttendance: {
          present: attendanceStats.present || 0,
          absent: attendanceStats.absent || 0,
          late: attendanceStats.late || 0,
          totalMarked: Object.values(attendanceStats).reduce((a, b) => a + b, 0)
        }
      },
      trend: trendData,
      recentLogs: formattedLogs,
      assignments: assignmentStats,
      leaves: formattedLeaves,
      notes: recentNotes
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
};

const createNote = async (req, res) => {
  const { content, priority } = req.body;
  const user_id = req.user.id;
  try {
    await Note.create({ user_id, content, priority: priority || 'normal' });
    res.status(201).json({ message: 'Note saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getDashboardStats, createNote };
