const Shift = require('../models/Shift');
const Notification = require('../models/Notification');

const createShift = async (req, res) => {
  const { worker_id, assignment_id, shift_date, shift_type, start_time, end_time, notes } = req.body;
  try {
    if (!worker_id || !shift_date || !start_time || !end_time || start_time >= end_time) {
      return res.status(400).json({ error: 'Worker, date, and a valid time range are required' });
    }
    const conflict = await Shift.findOne({
      worker_id,
      shift_date,
      status: { $ne: 'cancelled' },
      $not: { $or: [{ end_time: { $lte: start_time } }, { start_time: { $gte: end_time } }] }
    });

    if (conflict) return res.status(409).json({ error: 'Worker already has an overlapping shift' });

    const shift = new Shift({ worker_id, assignment_id, shift_date, shift_type, start_time, end_time, notes });
    await shift.save();

    // Notify worker
    await Notification.create({
      user_id: worker_id,
      type: 'shift_assigned',
      title: 'Shift Assigned',
      message: `${shift_type} shift on ${shift_date} from ${start_time} to ${end_time}`
    });

    res.status(201).json({ message: 'Shift created', shiftId: shift._id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const bulkCreateShifts = async (req, res) => {
  const { worker_ids, assignment_id, shift_date, shift_type, start_time, end_time, notes } = req.body;
  if (!Array.isArray(worker_ids) || !worker_ids.length) return res.status(400).json({ error: 'Select at least one worker' });

  const created = [];
  const skipped = [];

  try {
    for (const workerId of worker_ids) {
      const conflict = await Shift.findOne({
        worker_id: workerId,
        shift_date,
        status: { $ne: 'cancelled' },
        $not: { $or: [{ end_time: { $lte: start_time } }, { start_time: { $gte: end_time } }] }
      });

      if (conflict) {
        skipped.push(workerId);
        continue;
      }

      await Shift.create({
        worker_id: workerId,
        assignment_id: assignment_id || undefined,
        shift_date,
        shift_type: shift_type || 'General',
        start_time,
        end_time,
        notes
      });
      created.push(workerId);

      await Notification.create({
        user_id: workerId,
        type: 'shift_assigned',
        title: 'Shift Assigned',
        message: `${shift_type || 'General'} shift on ${shift_date}`
      });
    }
    res.status(201).json({ message: `${created.length} shift(s) created`, created, skipped });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getShifts = async (req, res) => {
  try {
    const { worker_id, assignment_id, date_from, date_to } = req.query;
    let query = {};

    if (worker_id) query.worker_id = worker_id;
    if (assignment_id) query.assignment_id = assignment_id;
    if (date_from || date_to) {
      query.shift_date = {};
      if (date_from) query.shift_date.$gte = new Date(date_from);
      if (date_to) query.shift_date.$lte = new Date(date_to);
    }

    const shiftsRaw = await Shift.find(query).sort({ shift_date: -1 }).populate('worker_id', 'name').lean();

    const shifts = shiftsRaw.map(s => ({
      ...s,
      id: s._id,
      name: s.worker_id?.name
    }));

    res.json(shifts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateShift = async (req, res) => {
  const { shiftId } = req.params;
  const { shift_type, start_time, end_time, status, notes } = req.body;
  try {
    await Shift.findByIdAndUpdate(shiftId, { shift_type, start_time, end_time, status, notes });
    res.json({ message: 'Shift updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteShift = async (req, res) => {
  const { shiftId } = req.params;
  try {
    const shift = await Shift.findById(shiftId);
    if (!shift) return res.status(404).json({ error: 'Shift not found' });

    await Shift.findByIdAndDelete(shiftId);

    // Notify worker
    await Notification.create({
      user_id: shift.worker_id,
      type: 'shift_cancelled',
      title: 'Shift Cancelled',
      message: `Shift on ${shift.shift_date.toISOString().split('T')[0]} has been cancelled`
    });

    res.json({ message: 'Shift deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getShiftConflicts = async (req, res) => {
  try {
    const { worker_id, shift_date } = req.query;
    // Manual conflict detection for UI highlighting
    const shifts = await Shift.find({ worker_id, shift_date }).lean();
    const conflicts = [];

    for (let i = 0; i < shifts.length; i++) {
      for (let j = i + 1; j < shifts.length; j++) {
        const s1 = shifts[i];
        const s2 = shifts[j];
        if (!(s1.end_time <= s2.start_time || s1.start_time >= s2.end_time)) {
          conflicts.push({
            shift1_id: s1._id,
            shift2_id: s2._id,
            start_time: s1.start_time,
            end_time: s1.end_time,
            shift2_start: s2.start_time,
            shift2_end: s2.end_time
          });
        }
      }
    }

    res.json(conflicts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createShift, bulkCreateShifts, getShifts, updateShift, deleteShift, getShiftConflicts };
