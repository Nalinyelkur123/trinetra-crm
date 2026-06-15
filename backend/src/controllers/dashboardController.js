const User = require('../models/User');
const Worker = require('../models/Worker');
const Attendance = require('../models/Attendance');
const AuditLog = require('../models/AuditLog');
const Leave = require('../models/Leave');
const Note = require('../models/Note');

const getDashboardStats = async (req, res) => {
  try {
    const { company_id, id: userId } = req.user;

    // Get all workers for this company
    const users = await User.find({ company_id, role: 'worker' }).lean();
    const userIds = users.map(u => u._id);

    // 1. Total Workers Count
    const totalWorkers = userIds.length;

    // 2. Active Workers
    const activeWorkers = await Worker.countDocuments({ user_id: { $in: userIds }, status: 'active' });

    // 3. Today's Attendance Summary
    const todayStr = new Date().toISOString().split('T')[0];
    const todayStart = new Date(todayStr);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const attendances = await Attendance.find({
      worker_id: { $in: userIds },
      date: { $gte: todayStart, $lt: todayEnd }
    }).lean();

    const attendanceStats = { present: 0, absent: 0, late: 0, half_day: 0 };
    attendances.forEach(a => {
      if (attendanceStats[a.status] !== undefined) {
        attendanceStats[a.status]++;
      } else if (a.status === 'half-day') {
        attendanceStats.half_day++;
      }
    });

    // 4. Trend (Last 7 Days)
    const sevenDaysAgo = new Date(todayStart);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentAttendances = await Attendance.find({
      worker_id: { $in: userIds },
      date: { $gte: sevenDaysAgo },
      status: { $in: ['present', 'late', 'half-day'] }
    }).lean();

    const trendMap = {};
    recentAttendances.forEach(a => {
      const dateStr = a.date.toISOString().split('T')[0];
      trendMap[dateStr] = (trendMap[dateStr] || 0) + 1;
    });

    const trendData = Object.keys(trendMap).sort().map(date => ({
      date,
      count: trendMap[date]
    }));

    // 5. Recent Activity Logs
    // We only want logs from users in this company
    const companyUsers = await User.find({ company_id }).lean();
    const companyUserIds = companyUsers.map(u => u._id);

    const recentLogsRaw = await AuditLog.find({ user_id: { $in: companyUserIds } })
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('user_id', 'name')
      .lean();

    const recentLogs = recentLogsRaw.map(log => ({
      action: log.action,
      timestamp: log.timestamp,
      user_name: log.user_id?.name
    }));

    // 6. Client Assignment Distribution
    const assignmentsAggr = await Worker.aggregate([
      { $match: { user_id: { $in: userIds }, assignment_id: { $ne: null } } },
      { $group: { _id: '$assignment_id', worker_count: { $sum: 1 } } }
    ]);

    // In a full implementation we would populate ClientAssignment names
    const assignmentStats = assignmentsAggr.map(a => ({
      assignment_id: a._id,
      worker_count: a.worker_count
    }));

    // 7. Pending Leaves
    const pendingLeavesRaw = await Leave.find({ worker_id: { $in: userIds }, status: 'pending' })
      .sort({ created_at: -1 })
      .limit(5)
      .populate('worker_id', 'name')
      .lean();

    const pendingLeaves = pendingLeavesRaw.map(l => ({
      ...l,
      id: l._id,
      worker_name: l.worker_id?.name
    }));

    // 8. Recent Notes (for current user)
    const recentNotes = await Note.find({ user_id: userId, is_completed: false })
      .sort({ created_at: -1 })
      .limit(5)
      .lean();

    res.json({
      summary: {
        totalWorkers,
        activeWorkers,
        deploymentRate: totalWorkers > 0 ? ((activeWorkers / totalWorkers) * 100).toFixed(1) : 0,
        todayAttendance: {
          present: attendanceStats.present,
          absent: attendanceStats.absent,
          late: attendanceStats.late,
          totalMarked: attendanceStats.present + attendanceStats.absent + attendanceStats.late + attendanceStats.half_day
        }
      },
      trend: trendData,
      recentLogs,
      assignments: assignmentStats,
      leaves: pendingLeaves,
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
