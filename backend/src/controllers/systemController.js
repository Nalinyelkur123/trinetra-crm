const { AuditLog, SystemSetting, ClientAssignment, Client, Worker, User } = require('../models');

const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100).populate('user_id', 'name').lean();
    
    const mappedLogs = logs.map(log => ({
      ...log,
      id: log._id,
      user_name: log.user_id?.name,
      status: log.action.includes('DELETE') ? 'DANGER' : log.action.includes('UPDATE') ? 'WARN' : 'SUCCESS',
      time: new Date(log.timestamp).toLocaleString()
    }));

    res.json(mappedLogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getSystemSettings = async (req, res) => {
  const company_id = req.user?.company_id;
  try {
    const settings = await SystemSetting.findOne({ company_id }).lean();
    if (settings) {
      settings.auto_attendance = !!settings.auto_attendance;
      settings.registry_lock = !!settings.registry_lock;
      settings.security_2fa = !!settings.security_2fa;
    }
    res.json(settings || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getClientAssignments = async (req, res) => {
  const company_id = req.user?.company_id;
  try {
    const assignments = await ClientAssignment.find({ company_id }).populate('client_id', 'name').lean();
    
    const formatted = await Promise.all(assignments.map(async a => {
      const worker_count = await Worker.countDocuments({ assignment_id: a._id, status: 'active' });
      return {
        ...a,
        id: a._id,
        client_name: a.client_id?.name,
        worker_count
      };
    }));
    
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createClientAssignment = async (req, res) => {
  const { client_id, name, location, description, manager_name, contact_phone, start_date, end_date, shift_start, shift_end, working_hours } = req.body;
  try {
    const company_id = req.user.company_id;
    
    const assignment = await ClientAssignment.create({
      client_id, name, location, description, manager_name, contact_phone, start_date, end_date, 
      status: 'On-track', progress: 0, company_id, 
      shift_start: shift_start || '09:00', shift_end: shift_end || '18:00', working_hours: working_hours || 8.0
    });
    
    await AuditLog.create({
      action: 'ASSIGNMENT_CREATED',
      user_id: req.user.id,
      target_type: 'ASSIGNMENT',
      target_id: assignment._id.toString()
    });

    res.status(201).json({ id: assignment._id, name, location });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const assignWorkerToClient = async (req, res) => {
  const { worker_id, client_id, assignment_id } = req.body;
  try {
    const assignment = assignment_id ? await ClientAssignment.findById(assignment_id).lean() : null;
    const client = client_id ? await Client.findById(client_id).lean() : null;
    
    const finalShiftStart = assignment?.shift_start || client?.shift_start || '09:00';
    const finalShiftEnd = assignment?.shift_end || client?.shift_end || '18:00';
    const finalWorkingHours = assignment?.working_hours || client?.working_hours || 8.0;

    await Worker.findOneAndUpdate(
      { user_id: worker_id },
      { client_id, assignment_id, shift_start: finalShiftStart, shift_end: finalShiftEnd, working_hours: finalWorkingHours }
    );
    
    await AuditLog.create({
      action: 'WORKER_DEPLOYED',
      user_id: req.user.id,
      target_type: 'WORKER',
      target_id: worker_id
    });

    res.json({ message: 'Worker deployed to client successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateClientAssignment = async (req, res) => {
  const { id } = req.params;
  const { name, location, description, manager_name, contact_phone, start_date, end_date, status, progress, shift_start, shift_end, working_hours } = req.body;
  try {
    const company_id = req.user.company_id;
    
    await ClientAssignment.findOneAndUpdate(
      { _id: id, company_id },
      { name, location, description, manager_name, contact_phone, start_date, end_date, status, progress, shift_start, shift_end, working_hours }
    );

    await AuditLog.create({
      action: 'ASSIGNMENT_UPDATED',
      user_id: req.user.id,
      target_type: 'ASSIGNMENT',
      target_id: id
    });

    res.json({ message: 'Assignment updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateSystemSettings = async (req, res) => {
  const { 
    company_name, timezone, auto_attendance, 
    registry_lock, retention_period, 
    notification_email, backup_frequency, security_2fa 
  } = req.body;
  const company_id = req.user?.company_id;
  
  try {
    await SystemSetting.findOneAndUpdate(
      { company_id },
      {
        company_name, timezone, 
        auto_attendance: !!auto_attendance, 
        registry_lock: !!registry_lock, 
        retention_period: retention_period || '365 Days', 
        notification_email, 
        backup_frequency: backup_frequency || 'Daily', 
        security_2fa: !!security_2fa
      },
      { upsert: true, new: true }
    );
    
    res.json({ message: 'System configuration updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { 
  getAuditLogs, 
  getSystemSettings, 
  getClientAssignments, 
  createClientAssignment, 
  assignWorkerToClient,
  updateSystemSettings,
  updateClientAssignment
};
