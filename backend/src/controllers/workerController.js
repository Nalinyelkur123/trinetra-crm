const { User, Worker, Document, Attendance, AuditLog, Payroll, Task, Shift, Leave } = require('../models');
const bcrypt = require('bcryptjs');

const addWorker = async (req, res) => {
  const { 
    name, phone, email, password, address, emergency_contact, skills, job_role, joined_date, company_id,
    father_name, mother_name, dob, gender, blood_group,
    pan_number, aadhaar_number, uan_number,
    bank_name, bank_branch, bank_account, bank_ifsc, bank_holder_name,
    qualification, experience_years, status,
    client_id, assignment_id, base_salary,
    shift_start, shift_end, working_hours
  } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(password || 'worker123', 10);
    
    const user = await User.create({
      name, phone, email, password: hashedPassword, role: 'worker', company_id: company_id || req.user.company_id
    });
    
    await Worker.create({
      user_id: user._id, address, emergency_contact, skills, job_role, joined_date,
      father_name, mother_name, dob, gender, blood_group,
      pan_number, aadhaar_number, uan_number,
      bank_name, bank_branch, bank_account, bank_ifsc, bank_holder_name,
      qualification, experience_years, status: status || 'active', client_id: client_id || null, assignment_id: assignment_id || null, base_salary: base_salary || 0,
      shift_start: shift_start || null, shift_end: shift_end || null, working_hours: working_hours || null
    });

    if (req.files) {
      if (req.files.aadhaar_file) {
        await Document.create({ worker_id: user._id, type: 'aadhaar', file_url: req.files.aadhaar_file[0].path });
      }
      if (req.files.pan_file) {
        await Document.create({ worker_id: user._id, type: 'pan', file_url: req.files.pan_file[0].path });
      }
    }

    await AuditLog.create({ user_id: req.user.id, action: 'ADD_WORKER', target_type: 'worker', target_id: user._id });

    res.status(201).json({ message: 'Worker added successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateWorker = async (req, res) => {
  const { id } = req.params;
  const { 
    name, phone, email, address, emergency_contact, skills, job_role, joined_date,
    father_name, mother_name, dob, gender, blood_group,
    pan_number, aadhaar_number, uan_number,
    bank_name, bank_branch, bank_account, bank_ifsc, bank_holder_name,
    qualification, experience_years, status, client_id, assignment_id, base_salary,
    shift_start, shift_end, working_hours
  } = req.body;

  try {
    await User.findByIdAndUpdate(id, { name, phone, email });

    await Worker.findOneAndUpdate({ user_id: id }, {
      address, emergency_contact, skills, job_role, joined_date,
      father_name, mother_name, dob, gender, blood_group,
      pan_number, aadhaar_number, uan_number,
      bank_name, bank_branch, bank_account, bank_ifsc, bank_holder_name,
      qualification, experience_years, status, client_id: client_id || null, assignment_id: assignment_id || null, base_salary: base_salary || 0,
      shift_start: shift_start || null, shift_end: shift_end || null, working_hours: working_hours || null
    });

    if (req.files) {
      if (req.files.aadhaar_file) {
        await Document.deleteMany({ worker_id: id, type: 'aadhaar' });
        await Document.create({ worker_id: id, type: 'aadhaar', file_url: req.files.aadhaar_file[0].path });
      }
      if (req.files.pan_file) {
        await Document.deleteMany({ worker_id: id, type: 'pan' });
        await Document.create({ worker_id: id, type: 'pan', file_url: req.files.pan_file[0].path });
      }
    }

    await AuditLog.create({ user_id: req.user.id, action: 'UPDATE_WORKER', target_type: 'worker', target_id: id });

    res.json({ message: 'Worker updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteWorker = async (req, res) => {
  const { id } = req.params;
  try {
    await Attendance.deleteMany({ worker_id: id });
    await Document.deleteMany({ worker_id: id });
    await Payroll.deleteMany({ worker_id: id });
    await Task.deleteMany({ worker_id: id });
    await Shift.deleteMany({ worker_id: id });
    await Leave.deleteMany({ worker_id: id });
    
    await Worker.deleteOne({ user_id: id });
    await User.findByIdAndDelete(id);

    await AuditLog.create({ user_id: req.user.id, action: 'DELETE_WORKER', target_type: 'worker', target_id: id });
    res.json({ message: 'Worker deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getWorkers = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    let company_id = req.user?.company_id || null;
    if (company_id && !mongoose.Types.ObjectId.isValid(company_id)) {
      company_id = null; // Prevent CastError if token has legacy integer ID
    }
    
    // Find all users who are workers in this company
    const users = await User.find(company_id ? { company_id, role: 'worker' } : { role: 'worker' }).sort({ _id: -1 }).lean();
    
    // Map them with their worker details
    const workersList = await Promise.all(users.map(async (u) => {
      const w = await Worker.findOne({ user_id: u._id }).populate('client_id').lean();
      return {
        id: u._id,
        name: u.name,
        phone: u.phone,
        email: u.email,
        address: w?.address,
        job_role: w?.job_role,
        status: w?.status,
        joined_date: w?.joined_date,
        client_name: w?.client_id?.name || null
      };
    }));

    res.json(workersList);
  } catch (error) {
    console.error('Personnel fetch error:', error);
    res.status(500).json({ error: 'System Integrity Error: Unable to retrieve personnel registry. ' + error.message });
  }
};

const getWorkerDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const u = await User.findById(id).lean();
    if (!u) return res.status(404).json({ error: 'Worker not found' });

    const w = await Worker.findOne({ user_id: id }).lean();
    const documents = await Document.find({ worker_id: id }).lean();
    const attendance = await Attendance.find({ worker_id: id }).sort({ date: -1 }).limit(30).lean();
    
    res.json({ name: u.name, phone: u.phone, email: u.email, ...w, documents, attendance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { addWorker, updateWorker, deleteWorker, getWorkers, getWorkerDetails };
