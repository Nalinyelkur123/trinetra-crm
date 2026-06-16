const { SiteMonitoring } = require('../models');

const createSiteMonitoring = async (req, res) => {
  const {
    assignment_id, supervisor_id, supervisor_notes, worker_count,
    safety_score, quality_score, monitoring_date, latitude, longitude, client_feedback
  } = req.body;
  
  try {
    const monitoring = await SiteMonitoring.create({
      assignment_id,
      supervisor_id: supervisor_id || req.user.id,
      supervisor_notes,
      worker_count,
      safety_score,
      quality_score,
      monitoring_date,
      latitude: latitude || null,
      longitude: longitude || null,
      client_feedback: client_feedback || null
    });
    res.status(201).json({ message: 'Site monitoring record created', monitoringId: monitoring._id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getSiteMonitoring = async (req, res) => {
  try {
    const { assignment_id, date_from, date_to } = req.query;
    
    const filter = {};
    if (assignment_id) filter.assignment_id = assignment_id;
    if (date_from || date_to) {
      filter.monitoring_date = {};
      if (date_from) filter.monitoring_date.$gte = new Date(date_from);
      if (date_to) filter.monitoring_date.$lte = new Date(date_to);
    }

    const monitoringRecords = await SiteMonitoring.find(filter)
      .populate('assignment_id', 'name')
      .populate('supervisor_id', 'name')
      .sort({ monitoring_date: -1 })
      .lean();

    const formatted = monitoringRecords.map(s => ({
      ...s,
      id: s._id,
      client_name: s.assignment_id?.name, // It's actually assignment_name usually, but mapping to old API expectation if it expected client_name
      supervisor_name: s.supervisor_id?.name
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getSiteQualityReport = async (req, res) => {
  try {
    const { assignment_id, month, year } = req.query;
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const matchStage = {
      assignment_id: require('mongoose').Types.ObjectId.isValid(assignment_id) ? new require('mongoose').Types.ObjectId(assignment_id) : assignment_id,
      monitoring_date: { $gte: startDate, $lte: endDate }
    };

    const report = await SiteMonitoring.aggregate([
      { $match: matchStage },
      { 
        $group: { 
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$monitoring_date" } },
          avg_safety: { $avg: "$safety_score" },
          avg_quality: { $avg: "$quality_score" },
          avg_workers: { $avg: "$worker_count" },
          total_inspections: { $sum: 1 }
        }
      },
      { $sort: { "_id": -1 } }
    ]);

    const formatted = report.map(r => ({
      monitoring_date: r._id,
      avg_safety: r.avg_safety,
      avg_quality: r.avg_quality,
      avg_workers: r.avg_workers,
      total_inspections: r.total_inspections
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createSiteMonitoring, getSiteMonitoring, getSiteQualityReport };
