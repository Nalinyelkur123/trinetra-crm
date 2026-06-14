const User = require('../models/User');
const Worker = require('../models/Worker');
const Attendance = require('../models/Attendance');

const markAttendance = async (req, res) => {
  const { worker_id, status, location, date: reqDate, shift_type, overtime_hours } = req.body;
  const date = reqDate || new Date().toISOString().split('T')[0];

  try {
    const workerDetails = await Worker.findOne({ user_id: worker_id }).lean();
    const currentTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    let finalStatus = status;
    if (status === 'present' && workerDetails?.shift_start) {
      if (currentTime > workerDetails.shift_start) {
        finalStatus = 'late';
      }
    }

    const checkInTime = (finalStatus === 'present' || finalStatus === 'late') ? new Date() : null; // Using JS Date for Mongoose

    await Attendance.findOneAndUpdate(
      { worker_id, date: new Date(date) },
      {
        status: finalStatus,
        location: location || 'Main HQ',
        // Only set check_in_time if not already set, achieved via $setOnInsert or in logic:
        $setOnInsert: { check_in_time: checkInTime },
        shift_type: shift_type || 'General',
        overtime_hours: overtime_hours || 0
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // If we wanted to preserve check_in_time on update, $setOnInsert handles it during upsert.
    // But if it exists, we might need a separate logic. For simplicity, we just use Mongoose update.

    res.json({ message: 'Attendance marked/updated', status: finalStatus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const bulkMarkAttendance = async (req, res) => {
  const { worker_ids, status, location, date, shift_type } = req.body;
  if (!Array.isArray(worker_ids) || !worker_ids.length || !['present', 'absent', 'half-day', 'late'].includes(status)) {
    return res.status(400).json({ error: 'Select workers and a valid attendance status' });
  }
  const attendanceDate = date ? new Date(date) : new Date(new Date().toISOString().split('T')[0]);
  const checkInTime = ['present', 'late'].includes(status) ? new Date() : null;

  try {
    const ops = worker_ids.map(workerId => ({
      updateOne: {
        filter: { worker_id: workerId, date: attendanceDate },
        update: {
          $set: {
            status,
            location: location || 'Main HQ',
            shift_type: shift_type || 'General'
          },
          $setOnInsert: {
            check_in_time: checkInTime
          }
        },
        upsert: true
      }
    }));
    await Attendance.bulkWrite(ops);
    res.json({ message: `Attendance updated for ${worker_ids.length} worker(s)` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const reviewOvertime = async (req, res) => {
  const { attendance_ids, status } = req.body;
  if (!Array.isArray(attendance_ids) || !attendance_ids.length || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Select overtime entries and a valid status' });
  }
  try {
    await Attendance.updateMany(
      { _id: { $in: attendance_ids }, overtime_hours: { $gt: 0 } },
      { $set: { overtime_status: status } }
    );
    res.json({ message: `Overtime ${status}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getDailyAttendance = async (req, res) => {
  const { date = new Date().toISOString().split('T')[0] } = req.query;
  const { company_id } = req.user;

  try {
    const targetDate = new Date(date);

    // Get all workers for the company
    const users = await User.find({ company_id, role: 'worker' }).lean();
    const userIds = users.map(u => u._id);

    const workers = await Worker.find({ user_id: { $in: userIds } })
      .populate('client_id')
      .lean();

    const attendances = await Attendance.find({
      worker_id: { $in: userIds },
      date: targetDate
    }).lean();

    // Create lookup maps
    const attendanceMap = attendances.reduce((acc, a) => {
      acc[a.worker_id.toString()] = a;
      return acc;
    }, {});

    const workerMap = workers.reduce((acc, w) => {
      acc[w.user_id.toString()] = w;
      return acc;
    }, {});

    const result = users.map(u => {
      const w = workerMap[u._id.toString()] || {};
      const a = attendanceMap[u._id.toString()] || {};

      return {
        worker_id: u._id,
        worker_name: u.name,
        phone: u.phone,
        job_role: w.job_role,
        shift_start: w.shift_start,
        shift_end: w.shift_end,
        working_hours: w.working_hours,
        client_name: w.client_id?.name || null,
        status: a.status || null,
        location: a.location || null,
        check_in_time: a.check_in_time || null,
        check_out_time: a.check_out_time || null,
        shift_type: a.shift_type || null,
        overtime_hours: a.overtime_hours || 0,
        overtime_status: a.overtime_status || null,
        attendance_id: a._id || null
      };
    });

    res.json(result.sort((a, b) => a.worker_name.localeCompare(b.worker_name)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { markAttendance, bulkMarkAttendance, reviewOvertime, getDailyAttendance };
