const { Performance, Attendance, Task, DisciplineRecord, User } = require('../models');

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
    let present_days = 0;
    let absent_days = 0;
    let late_days = 0;

    attendances.forEach(a => {
      if (a.status === 'present') present_days++;
      else if (a.status === 'late') { present_days++; late_days++; }
      else if (a.status === 'absent') absent_days++;
    });

    const tasks = await Task.find({
      worker_id,
      completion_date: { $gte: startDate, $lte: endDate }
    }).lean();

    const completed_tasks = tasks.filter(t => t.status === 'completed').length;

    const attendance_pct = total_days > 0 ? Number(((present_days / total_days) * 100).toFixed(2)) : 0;
    const punctuality = total_days > 0 ? Number((100 - ((late_days / total_days) * 100)).toFixed(2)) : 100;
    
    let rating = 'Average';
    if (attendance_pct >= 95 && punctuality >= 95) rating = 'Excellent';
    else if (attendance_pct >= 85 && punctuality >= 85) rating = 'Good';
    else if (attendance_pct < 75) rating = 'Poor';

    await Performance.findOneAndUpdate(
      { worker_id, month, year },
      {
        total_days, present_days, absent_days, late_days,
        attendance_percentage: attendance_pct,
        punctuality_score: punctuality,
        tasks_completed: completed_tasks,
        performance_rating: rating
      },
      { upsert: true, new: true }
    );

    res.json({ message: 'Performance calculated', performance: { attendance_pct, punctuality, rating } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPerformance = async (req, res) => {
  try {
    const { worker_id, month, year } = req.query;

    const users = await User.find({ company_id: req.user.company_id }).lean();
    const userIds = users.map(u => u._id);

    const filter = { worker_id: { $in: userIds } };
    if (worker_id) filter.worker_id = worker_id;
    if (month) filter.month = month;
    if (year) filter.year = year;

    const performances = await Performance.find(filter).populate('worker_id', 'name').sort({ year: -1, month: -1 }).lean();
    
    const formatted = await Promise.all(performances.map(async p => {
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

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const addDisciplineRecord = async (req, res) => {
  const { worker_id, record_date, category, severity, notes } = req.body;
  if (!worker_id || !record_date || !category) return res.status(400).json({ error: 'Worker, date, and category are required' });
  try {
    const record = await DisciplineRecord.create({
      worker_id, record_date, category, severity: severity || 'warning', notes: notes || null, created_by: req.user.id
    });
    res.status(201).json({ id: record._id, message: 'Discipline record added' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getDisciplineRecords = async (req, res) => {
  try {
    const users = await User.find({ company_id: req.user.company_id }).lean();
    const userIds = users.map(u => u._id);

    const records = await DisciplineRecord.find({ worker_id: { $in: userIds } }).populate('worker_id', 'name').sort({ record_date: -1 }).lean();
    const formatted = records.map(r => ({
      ...r,
      id: r._id,
      worker_name: r.worker_id?.name
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getWorkerRankings = async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;

    const performances = await Performance.find({ year, month }).populate('worker_id', 'name').sort({ attendance_percentage: -1, punctuality_score: -1 }).limit(20).lean();

    const rankings = performances.map(p => ({
      id: p.worker_id?._id,
      name: p.worker_id?.name,
      attendance_percentage: p.attendance_percentage,
      punctuality_score: p.punctuality_score,
      performance_rating: p.performance_rating,
      tasks_completed: p.tasks_completed
    }));
    
    res.json(rankings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { calculatePerformance, getPerformance, getWorkerRankings, addDisciplineRecord, getDisciplineRecords };
