const Performance = require('../models/Performance');
const DisciplineRecord = require('../models/DisciplineRecord');
const Attendance = require('../models/Attendance');
const Task = require('../models/Task');
const User = require('../models/User');

const calculatePerformance = async (req, res) => {
  const { worker_id, month, year } = req.body;

  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const attendances = await Attendance.find({
      worker_id,
      date: { $gte: startDate, $lte: endDate }
    }).lean();

    const total_days = attendances.length;
    const present_days = attendances.filter(a => a.status === 'present' || a.status === 'late').length;
    const absent_days = attendances.filter(a => a.status === 'absent').length;
    const late_days = attendances.filter(a => a.status === 'late').length;

    const tasks = await Task.find({
      worker_id,
      completion_date: { $gte: startDate, $lte: endDate }
    }).lean();

    const total_tasks = tasks.length;
    const completed_tasks = tasks.filter(t => t.status === 'completed').length;

    const attendance_pct = total_days > 0 ? ((present_days / total_days) * 100).toFixed(2) : 0;
    const punctuality = total_days > 0 ? (100 - ((late_days / total_days) * 100)).toFixed(2) : 100;

    // Determine performance rating
    let rating = 'Average';
    if (attendance_pct >= 95 && punctuality >= 95) rating = 'Excellent';
    else if (attendance_pct >= 85 && punctuality >= 85) rating = 'Good';
    else if (attendance_pct < 75) rating = 'Poor';

    await Performance.findOneAndUpdate(
      { worker_id, month, year },
      {
        total_days,
        present_days,
        absent_days,
        late_days,
        attendance_percentage: attendance_pct,
        punctuality_score: punctuality,
        tasks_completed: completed_tasks,
        performance_rating: rating
      },
      { upsert: true }
    );

    res.json({ message: 'Performance calculated', performance: { attendance_pct, punctuality, rating } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPerformance = async (req, res) => {
  try {
    const { worker_id, month, year } = req.query;
    let query = {};

    if (worker_id) query.worker_id = worker_id;
    if (month) query.month = month;
    if (year) query.year = year;

    const performanceRaw = await Performance.find(query)
      .sort({ year: -1, month: -1 })
      .populate('worker_id', 'name')
      .lean();

    // Count discipline records
    const result = await Promise.all(performanceRaw.map(async (p) => {
      const startDate = new Date(p.year, p.month - 1, 1);
      const endDate = new Date(p.year, p.month, 0, 23, 59, 59);
      const discipline_count = await DisciplineRecord.countDocuments({
        worker_id: p.worker_id?._id,
        record_date: { $gte: startDate, $lte: endDate }
      });
      return {
        ...p,
        id: p._id,
        worker_name: p.worker_id?.name,
        discipline_count
      };
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const addDisciplineRecord = async (req, res) => {
  const { worker_id, record_date, category, severity, notes } = req.body;
  if (!worker_id || !record_date || !category) return res.status(400).json({ error: 'Worker, date, and category are required' });
  try {
    const record = new DisciplineRecord({
      worker_id,
      record_date,
      category,
      severity: severity || 'warning',
      notes: notes || undefined,
      created_by: req.user.id
    });
    await record.save();
    res.status(201).json({ id: record._id, message: 'Discipline record added' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getDisciplineRecords = async (req, res) => {
  try {
    const recordsRaw = await DisciplineRecord.find()
      .sort({ record_date: -1 })
      .populate('worker_id', 'name')
      .lean();

    const records = recordsRaw.map(r => ({
      ...r,
      id: r._id,
      worker_name: r.worker_id?.name
    }));

    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getWorkerRankings = async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;

    const rankingsRaw = await Performance.find({ year, month })
      .sort({ attendance_percentage: -1, punctuality_score: -1 })
      .limit(20)
      .populate('worker_id', 'name')
      .lean();

    const rankings = rankingsRaw.map(r => ({
      id: r.worker_id?._id,
      name: r.worker_id?.name,
      attendance_percentage: r.attendance_percentage,
      punctuality_score: r.punctuality_score,
      performance_rating: r.performance_rating,
      tasks_completed: r.tasks_completed
    }));

    res.json(rankings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { calculatePerformance, getPerformance, getWorkerRankings, addDisciplineRecord, getDisciplineRecords };
