const SiteMonitoring = require('../models/SiteMonitoring');
const ClientAssignment = require('../models/ClientAssignment');

const createSiteMonitoring = async (req, res) => {
  const {
    assignment_id, supervisor_id, supervisor_notes, worker_count,
    safety_score, quality_score, monitoring_date, latitude, longitude, client_feedback
  } = req.body;

  try {
    const monitoring = new SiteMonitoring({
      assignment_id,
      supervisor_id: supervisor_id || req.user.id,
      supervisor_notes,
      worker_count,
      safety_score,
      quality_score,
      monitoring_date,
      latitude: latitude || undefined,
      longitude: longitude || undefined,
      client_feedback: client_feedback || undefined
    });

    await monitoring.save();
    res.status(201).json({ message: 'Site monitoring record created', monitoringId: monitoring._id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getSiteMonitoring = async (req, res) => {
  try {
    const { assignment_id, date_from, date_to } = req.query;
    let query = {};

    if (assignment_id) query.assignment_id = assignment_id;
    if (date_from || date_to) {
      query.monitoring_date = {};
      if (date_from) query.monitoring_date.$gte = new Date(date_from);
      if (date_to) query.monitoring_date.$lte = new Date(date_to);
    }

    const monitoringRaw = await SiteMonitoring.find(query)
      .sort({ monitoring_date: -1 })
      .populate('assignment_id', 'name')
      .populate('supervisor_id', 'name')
      .lean();

    const monitoring = monitoringRaw.map(m => ({
      ...m,
      id: m._id,
      client_name: m.assignment_id?.name, // It's named client_name in original but populated from assignment
      supervisor_name: m.supervisor_id?.name
    }));

    res.json(monitoring);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getSiteQualityReport = async (req, res) => {
  try {
    const { assignment_id, month, year } = req.query;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const reportRaw = await SiteMonitoring.aggregate([
      {
        $match: {
          assignment_id: new require('mongoose').Types.ObjectId(assignment_id),
          monitoring_date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$monitoring_date" } },
          avg_safety: { $avg: "$safety_score" },
          avg_quality: { $avg: "$quality_score" },
          avg_workers: { $avg: "$worker_count" },
          total_inspections: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    const report = reportRaw.map(r => ({
      monitoring_date: r._id,
      avg_safety: r.avg_safety,
      avg_quality: r.avg_quality,
      avg_workers: r.avg_workers,
      total_inspections: r.total_inspections
    }));

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createSiteMonitoring, getSiteMonitoring, getSiteQualityReport };
