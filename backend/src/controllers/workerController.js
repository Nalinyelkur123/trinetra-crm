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
    
    const cleanClientId = (client_id && client_id !== 'null' && client_id !== 'none' && client_id !== '' && client_id !== 'undefined') ? client_id : null;
    const cleanAssignmentId = (assignment_id && assignment_id !== 'null' && assignment_id !== 'none' && assignment_id !== '' && assignment_id !== 'undefined') ? assignment_id : null;

    await Worker.create({
      user_id: user._id, address, emergency_contact, skills, job_role, joined_date,
      father_name, mother_name, dob, gender, blood_group,
      pan_number, aadhaar_number, uan_number,
      bank_name, bank_branch, bank_account, bank_ifsc, bank_holder_name,
      qualification, experience_years, status: status || 'active', 
      client_id: cleanClientId, assignment_id: cleanAssignmentId, base_salary: base_salary || 0,
      shift_start: shift_start || null, shift_end: shift_end || null, working_hours: working_hours || null
    });

    if (req.files) {
      if (req.files.aadhaar_file) {
        await Document.create({ 
          worker_id: user._id, 
          type: 'aadhaar', 
          file_url: `/uploads/${req.files.aadhaar_file[0].filename}` 
        });
      }
      if (req.files.pan_file) {
        await Document.create({ 
          worker_id: user._id, 
          type: 'pan', 
          file_url: `/uploads/${req.files.pan_file[0].filename}` 
        });
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
    const userUpdates = {};
    if (name !== undefined) userUpdates.name = name;
    if (phone !== undefined) userUpdates.phone = phone;
    if (email !== undefined) userUpdates.email = email;
    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(id, userUpdates);
    }

    const workerUpdates = {};
    if (address !== undefined) workerUpdates.address = address;
    if (emergency_contact !== undefined) workerUpdates.emergency_contact = emergency_contact;
    if (skills !== undefined) workerUpdates.skills = skills;
    if (job_role !== undefined) workerUpdates.job_role = job_role;
    if (joined_date !== undefined) workerUpdates.joined_date = joined_date;
    if (father_name !== undefined) workerUpdates.father_name = father_name;
    if (mother_name !== undefined) workerUpdates.mother_name = mother_name;
    if (dob !== undefined) workerUpdates.dob = dob;
    if (gender !== undefined) workerUpdates.gender = gender;
    if (blood_group !== undefined) workerUpdates.blood_group = blood_group;
    if (pan_number !== undefined) workerUpdates.pan_number = pan_number;
    if (aadhaar_number !== undefined) workerUpdates.aadhaar_number = aadhaar_number;
    if (uan_number !== undefined) workerUpdates.uan_number = uan_number;
    if (bank_name !== undefined) workerUpdates.bank_name = bank_name;
    if (bank_branch !== undefined) workerUpdates.bank_branch = bank_branch;
    if (bank_account !== undefined) workerUpdates.bank_account = bank_account;
    if (bank_ifsc !== undefined) workerUpdates.bank_ifsc = bank_ifsc;
    if (bank_holder_name !== undefined) workerUpdates.bank_holder_name = bank_holder_name;
    if (qualification !== undefined) workerUpdates.qualification = qualification;
    if (experience_years !== undefined) workerUpdates.experience_years = experience_years;
    if (status !== undefined) workerUpdates.status = status;
    if (base_salary !== undefined) workerUpdates.base_salary = base_salary;
    if (shift_start !== undefined) workerUpdates.shift_start = shift_start;
    if (shift_end !== undefined) workerUpdates.shift_end = shift_end;
    if (working_hours !== undefined) workerUpdates.working_hours = working_hours;

    if (client_id !== undefined) {
      workerUpdates.client_id = (client_id && client_id !== 'null' && client_id !== 'none' && client_id !== '' && client_id !== 'undefined') ? client_id : null;
    }
    if (assignment_id !== undefined) {
      workerUpdates.assignment_id = (assignment_id && assignment_id !== 'null' && assignment_id !== 'none' && assignment_id !== '' && assignment_id !== 'undefined') ? assignment_id : null;
    }

    const updatedWorker = await Worker.findOneAndUpdate({ user_id: id }, workerUpdates, { new: true })
      .populate('client_id')
      .populate('assignment_id');

    if (req.files) {
      if (req.files.aadhaar_file) {
        await Document.deleteMany({ worker_id: id, type: 'aadhaar' });
        await Document.create({ 
          worker_id: id, 
          type: 'aadhaar', 
          file_url: `/uploads/${req.files.aadhaar_file[0].filename}` 
        });
      }
      if (req.files.pan_file) {
        await Document.deleteMany({ worker_id: id, type: 'pan' });
        await Document.create({ 
          worker_id: id, 
          type: 'pan', 
          file_url: `/uploads/${req.files.pan_file[0].filename}` 
        });
      }
    }

    await AuditLog.create({ user_id: req.user.id, action: 'UPDATE_WORKER', target_type: 'worker', target_id: id });

    res.json({ 
      message: 'Worker updated successfully',
      client_id: updatedWorker?.client_id?._id || null,
      client_name: updatedWorker?.client_id?.name || null,
      assignment_id: updatedWorker?.assignment_id?._id || null,
      assignment_name: updatedWorker?.assignment_id?.name || null
    });
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
      const w = await Worker.findOne({ user_id: u._id }).populate('client_id').populate('assignment_id').lean();
      return {
        id: u._id,
        name: u.name,
        phone: u.phone,
        email: u.email,
        address: w?.address,
        job_role: w?.job_role,
        status: w?.status,
        joined_date: w?.joined_date,
        client_id: w?.client_id?._id || w?.client_id || null,
        client_name: w?.client_id?.name || null,
        assignment_id: w?.assignment_id?._id || w?.assignment_id || null,
        assignment_name: w?.assignment_id?.name || null
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

    const w = await Worker.findOne({ user_id: id }).populate('client_id').populate('assignment_id').lean();
    const documents = await Document.find({ worker_id: id }).lean();
    const attendance = await Attendance.find({ worker_id: id }).sort({ date: -1 }).limit(30).lean();
    
    res.json({ 
      name: u.name, 
      phone: u.phone, 
      email: u.email, 
      ...w, 
      client_id: w?.client_id?._id || w?.client_id || null,
      client_name: w?.client_id?.name || null,
      assignment_id: w?.assignment_id?._id || w?.assignment_id || null,
      assignment_name: w?.assignment_id?.name || null,
      documents, 
      attendance 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { addWorker, updateWorker, deleteWorker, getWorkers, getWorkerDetails };
