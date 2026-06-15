const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Worker = require('../models/Worker');
const Document = require('../models/Document');
const AuditLog = require('../models/AuditLog');
const Attendance = require('../models/Attendance');
const Payroll = require('../models/Payroll');
const Task = require('../models/Task');
const Shift = require('../models/Shift');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

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

    const user = new User({
      name, phone, email, password: hashedPassword, role: 'worker', company_id: company_id || req.user.company_id
    });
    await user.save();

    const workerId = user._id;

    const worker = new Worker({
      user_id: workerId, address, emergency_contact, skills, job_role, joined_date,
      father_name, mother_name, dob, gender, blood_group,
      pan_number, aadhaar_number, uan_number,
      bank_name, bank_branch, bank_account, bank_ifsc, bank_holder_name,
      qualification, experience_years, status: status || 'active',
      client_id: client_id || undefined, assignment_id: assignment_id || undefined, base_salary: base_salary || 0,
      shift_start, shift_end, working_hours
    });
    await worker.save();

    // Handle File Uploads with Cloudinary
    if (req.files) {
      if (req.files.aadhaar_file) {
        const result = await cloudinary.uploader.upload(req.files.aadhaar_file[0].path, { folder: 'trinetra/documents' });
        await Document.create({ worker_id: workerId, type: 'aadhaar', file_url: result.secure_url });
        fs.unlinkSync(req.files.aadhaar_file[0].path); // Remove local file
      }
      if (req.files.pan_file) {
        const result = await cloudinary.uploader.upload(req.files.pan_file[0].path, { folder: 'trinetra/documents' });
        await Document.create({ worker_id: workerId, type: 'pan', file_url: result.secure_url });
        fs.unlinkSync(req.files.pan_file[0].path); // Remove local file
      }
    }

    // Audit Log
    await AuditLog.create({ user_id: req.user.id, action: 'ADD_WORKER', target_type: 'worker', target_id: workerId });

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
      qualification, experience_years, status, client_id, assignment_id, base_salary: base_salary || 0,
      shift_start, shift_end, working_hours
    });

    // Handle New File Uploads with Cloudinary
    if (req.files) {
      if (req.files.aadhaar_file) {
        const result = await cloudinary.uploader.upload(req.files.aadhaar_file[0].path, { folder: 'trinetra/documents' });
        await Document.findOneAndDelete({ worker_id: id, type: 'aadhaar' });
        await Document.create({ worker_id: id, type: 'aadhaar', file_url: result.secure_url });
        fs.unlinkSync(req.files.aadhaar_file[0].path); // Remove local file
      }
      if (req.files.pan_file) {
        const result = await cloudinary.uploader.upload(req.files.pan_file[0].path, { folder: 'trinetra/documents' });
        await Document.findOneAndDelete({ worker_id: id, type: 'pan' });
        await Document.create({ worker_id: id, type: 'pan', file_url: result.secure_url });
        fs.unlinkSync(req.files.pan_file[0].path); // Remove local file
      }
    }

    // Audit Log
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
    await Worker.findOneAndDelete({ user_id: id });
    await User.findByIdAndDelete(id);

    // Audit Log
    await AuditLog.create({ user_id: req.user.id, action: 'DELETE_WORKER', target_type: 'worker', target_id: id });

    res.json({ message: 'Worker deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getWorkers = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    // Find all users who are workers in this company
    const users = await User.find({ company_id, role: 'worker' }).lean();
    const userIds = users.map(u => u._id);

    const workers = await Worker.find({ user_id: { $in: userIds } })
      .populate('user_id', 'name phone email')
      .populate('client_id', 'name')
      .lean();

    // Transform into expected shape
    const formatted = workers.map(w => ({
      id: w.user_id._id,
      name: w.user_id.name,
      phone: w.user_id.phone,
      email: w.user_id.email,
      address: w.address,
      job_role: w.job_role,
      status: w.status,
      joined_date: w.joined_date,
      client_name: w.client_id ? w.client_id.name : null
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Personnel fetch error:', error);
    res.status(500).json({ error: 'System Integrity Error: Unable to retrieve personnel registry. ' + error.message });
  }
};

const getWorkerDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id).lean();
    if (!user) return res.status(404).json({ error: 'Worker not found' });

    const worker = await Worker.findOne({ user_id: id }).lean();
    if (!worker) return res.status(404).json({ error: 'Worker details not found' });

    const documents = await Document.find({ worker_id: id }).lean();
    const attendance = await Attendance.find({ worker_id: id }).sort({ date: -1 }).limit(30).lean();

    res.json({
      name: user.name,
      phone: user.phone,
      email: user.email,
      ...worker,
      documents,
      attendance
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { addWorker, updateWorker, deleteWorker, getWorkers, getWorkerDetails };
