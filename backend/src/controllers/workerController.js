const { db } = require('../config/db');
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
    
    db.transaction(() => {
      const userStmt = db.prepare('INSERT INTO users (name, phone, email, password, role, company_id) VALUES (?, ?, ?, ?, ?, ?)');
      const userInfo = userStmt.run(name, phone, email, hashedPassword, 'worker', company_id || req.user.company_id);
      const workerId = userInfo.lastInsertRowid;
      
      const workerStmt = db.prepare(`
        INSERT INTO workers (
          user_id, address, emergency_contact, skills, job_role, joined_date,
          father_name, mother_name, dob, gender, blood_group,
          pan_number, aadhaar_number, uan_number,
          bank_name, bank_branch, bank_account, bank_ifsc, bank_holder_name,
          qualification, experience_years, status, client_id, assignment_id, base_salary,
          shift_start, shift_end, working_hours
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      workerStmt.run(
        workerId, address, emergency_contact, skills, job_role, joined_date,
        father_name, mother_name, dob, gender, blood_group,
        pan_number, aadhaar_number, uan_number,
        bank_name, bank_branch, bank_account, bank_ifsc, bank_holder_name,
        qualification, experience_years, status || 'active', client_id || null, assignment_id || null, base_salary || 0,
        shift_start || null, shift_end || null, working_hours || null
      );

      // Handle File Uploads
      if (req.files) {
        if (req.files.aadhaar_file) {
          db.prepare('INSERT INTO documents (worker_id, type, file_url) VALUES (?, ?, ?)')
            .run(workerId, 'aadhaar', req.files.aadhaar_file[0].path);
        }
        if (req.files.pan_file) {
          db.prepare('INSERT INTO documents (worker_id, type, file_url) VALUES (?, ?, ?)')
            .run(workerId, 'pan', req.files.pan_file[0].path);
        }
      }

      // Audit Log
      db.prepare('INSERT INTO audit_logs (user_id, action, target_type, target_id) VALUES (?, ?, ?, ?)')
        .run(req.user.id, 'ADD_WORKER', 'worker', workerId);
    })();

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
    db.transaction(() => {
      // Update User table
      db.prepare('UPDATE users SET name = ?, phone = ?, email = ? WHERE id = ?')
        .run(name, phone, email, id);

      // Update Workers table
      db.prepare(`
        UPDATE workers SET 
          address = ?, emergency_contact = ?, skills = ?, job_role = ?, joined_date = ?,
          father_name = ?, mother_name = ?, dob = ?, gender = ?, blood_group = ?,
          pan_number = ?, aadhaar_number = ?, uan_number = ?,
          bank_name = ?, bank_branch = ?, bank_account = ?, bank_ifsc = ?, bank_holder_name = ?,
          qualification = ?, experience_years = ?, status = ?, client_id = ?, assignment_id = ?, base_salary = ?,
          shift_start = ?, shift_end = ?, working_hours = ?
        WHERE user_id = ?
      `).run(
        address, emergency_contact, skills, job_role, joined_date,
        father_name, mother_name, dob, gender, blood_group,
        pan_number, aadhaar_number, uan_number,
        bank_name, bank_branch, bank_account, bank_ifsc, bank_holder_name,
        qualification, experience_years, status, client_id || null, assignment_id || null, base_salary || 0,
        shift_start || null, shift_end || null, working_hours || null, id
      );

      // Handle New File Uploads
      if (req.files) {
        if (req.files.aadhaar_file) {
          db.prepare('DELETE FROM documents WHERE worker_id = ? AND type = ?').run(id, 'aadhaar');
          db.prepare('INSERT INTO documents (worker_id, type, file_url) VALUES (?, ?, ?)')
            .run(id, 'aadhaar', req.files.aadhaar_file[0].path);
        }
        if (req.files.pan_file) {
          db.prepare('DELETE FROM documents WHERE worker_id = ? AND type = ?').run(id, 'pan');
          db.prepare('INSERT INTO documents (worker_id, type, file_url) VALUES (?, ?, ?)')
            .run(id, 'pan', req.files.pan_file[0].path);
        }
      }

      // Audit Log
      db.prepare('INSERT INTO audit_logs (user_id, action, target_type, target_id) VALUES (?, ?, ?, ?)')
        .run(req.user.id, 'UPDATE_WORKER', 'worker', id);
    })();

    res.json({ message: 'Worker updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteWorker = (req, res) => {
  const { id } = req.params;
  try {
    db.transaction(() => {
      db.prepare('DELETE FROM attendance WHERE worker_id = ?').run(id);
      db.prepare('DELETE FROM documents WHERE worker_id = ?').run(id);
      db.prepare('DELETE FROM payroll WHERE worker_id = ?').run(id);
      db.prepare('DELETE FROM work_assignments WHERE worker_id = ?').run(id);
      db.prepare('DELETE FROM workers WHERE user_id = ?').run(id);
      db.prepare('DELETE FROM users WHERE id = ?').run(id);

      // Audit Log
      db.prepare('INSERT INTO audit_logs (user_id, action, target_type, target_id) VALUES (?, ?, ?, ?)')
        .run(req.user.id, 'DELETE_WORKER', 'worker', id);
    })();
    res.json({ message: 'Worker deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getWorkers = (req, res) => {
  try {
    const company_id = req.user?.company_id || 1; // Fallback to 1 for safety
    const workers = db.prepare(`
      SELECT u.id, u.name, u.phone, u.email, w.address, w.job_role, w.status, w.joined_date, c.name as client_name
      FROM users u
      JOIN workers w ON u.id = w.user_id
      LEFT JOIN clients c ON w.client_id = c.id
      WHERE u.company_id = ? AND u.role = 'worker'
      ORDER BY u.id DESC
    `).all(company_id);
    res.json(workers || []);
  } catch (error) {
    console.error('Personnel fetch error:', error);
    res.status(500).json({ error: 'System Integrity Error: Unable to retrieve personnel registry. ' + error.message });
  }
};

const getWorkerDetails = (req, res) => {
  const { id } = req.params;
  try {
    const worker = db.prepare(`
      SELECT u.name, u.phone, u.email, w.* 
      FROM users u
      JOIN workers w ON u.id = w.user_id
      WHERE u.id = ?
    `).get(id);
    
    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    const documents = db.prepare('SELECT * FROM documents WHERE worker_id = ?').all(id);
    const attendance = db.prepare('SELECT * FROM attendance WHERE worker_id = ? ORDER BY date DESC LIMIT 30').all(id);
    
    res.json({ ...worker, documents, attendance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { addWorker, updateWorker, deleteWorker, getWorkers, getWorkerDetails };
