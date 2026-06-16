const { Attendance, Worker, User } = require('../models');

const markAttendance = async (req, res) => {
  const { worker_id, status, location, date: reqDate, shift_type, overtime_hours } = req.body;
  const date = reqDate ? new Date(reqDate) : new Date(new Date().toISOString().split('T')[0]);

  try {
    const workerDetails = await Worker.findOne({ user_id: worker_id }).lean();
    const currentTime = new Date();
    const currentHMS = currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    let finalStatus = status;
    if (status === 'present' && workerDetails?.shift_start) {
      if (currentHMS > workerDetails.shift_start) {
        finalStatus = 'late';
      }
    }

    const existing = await Attendance.findOne({ worker_id, date });

    if (existing) {
      existing.status = finalStatus;
      existing.location = location || 'Main HQ';
      if ((finalStatus === 'present' || finalStatus === 'late') && !existing.check_in_time) {
        existing.check_in_time = currentTime;
      }
      existing.shift_type = shift_type || 'General';
      existing.overtime_hours = overtime_hours || 0;
      await existing.save();
      res.json({ message: 'Attendance updated', status: finalStatus });
    } else {
      await Attendance.create({
        worker_id, date, status: finalStatus, location: location || 'Main HQ',
        check_in_time: (finalStatus === 'present' || finalStatus === 'late') ? currentTime : null,
        shift_type: shift_type || 'General', overtime_hours: overtime_hours || 0
      });
      res.status(201).json({ message: 'Attendance marked', status: finalStatus });
    }
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
  const currentTime = new Date();

  try {
    const operations = worker_ids.map(workerId => {
      const updateData = {
        status,
        location: location || 'Main HQ',
        shift_type: shift_type || 'General'
      };

      if (['present', 'late'].includes(status)) {
        updateData.$setOnInsert = { check_in_time: currentTime };
      } else {
        updateData.$setOnInsert = { check_in_time: null };
      }

      return {
        updateOne: {
          filter: { worker_id: workerId, date: attendanceDate },
          update: { $set: updateData },
          upsert: true
        }
      };
    });

    await Attendance.bulkWrite(operations);
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
  const { date } = req.query;
  const targetDate = date ? new Date(date) : new Date(new Date().toISOString().split('T')[0]);
  const { company_id } = req.user;

  try {
    const users = await User.find({ company_id, role: 'worker' }).sort({ name: 1 }).lean();
    
    const results = await Promise.all(users.map(async (u) => {
      const w = await Worker.findOne({ user_id: u._id }).populate('client_id').lean();
      const a = await Attendance.findOne({ worker_id: u._id, date: targetDate }).lean();
      
      return {
        worker_id: u._id,
        worker_name: u.name,
        phone: u.phone,
        job_role: w?.job_role,
        shift_start: w?.shift_start,
        shift_end: w?.shift_end,
        working_hours: w?.working_hours,
        client_name: w?.client_id?.name,
        status: a?.status,
        location: a?.location,
        check_in_time: a?.check_in_time,
        check_out_time: a?.check_out_time,
        shift_type: a?.shift_type,
        overtime_hours: a?.overtime_hours,
        overtime_status: a?.overtime_status,
        attendance_id: a?._id
      };
    }));
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { markAttendance, bulkMarkAttendance, reviewOvertime, getDailyAttendance };
