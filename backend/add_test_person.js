const { db } = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function addFullPerson() {
  const name = "Arjun Singh";
  const phone = "+91 99001 12233";
  const email = "arjun.s@trinetra.io";
  const password = "arjun123";
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.transaction(() => {
      // 1. Add User
      const userStmt = db.prepare('INSERT INTO users (name, phone, email, password, role, company_id) VALUES (?, ?, ?, ?, ?, ?)');
      const userInfo = userStmt.run(name, phone, email, hashedPassword, 'worker', 1);
      const workerId = userInfo.lastInsertRowid;
      
      // 2. Add Worker Details
      const workerStmt = db.prepare(`
        INSERT INTO workers (
          user_id, address, emergency_contact, skills, job_role, joined_date,
          father_name, mother_name, dob, gender, blood_group,
          pan_number, aadhaar_number, uan_number,
          bank_name, bank_branch, bank_account, bank_ifsc, bank_holder_name,
          qualification, experience_years, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      workerStmt.run(
        workerId, 
        "Suite 404, Cyber Hub, Gurgaon", 
        "Vikram Singh: +91 90000 11111", 
        "Operations, Logistics, Security Management", 
        "Strategic Operations Lead", 
        "2026-05-01",
        "Vikram Singh", 
        "Anjali Singh", 
        "1985-06-15", 
        "Male", 
        "B+",
        "XYZPQ9876R", 
        "9876 5432 1098", 
        "100112233445",
        "ICICI Bank", 
        "Cyber Hub Branch", 
        "6789012345", 
        "ICIC0006789", 
        "Arjun Singh",
        "M.Tech Management", 
        12, 
        "active"
      );

      // 3. Add Mock Documents
      db.prepare('INSERT INTO documents (worker_id, type, file_url) VALUES (?, ?, ?)').run(workerId, 'aadhaar', '/uploads/mock_aadhaar.pdf');
      db.prepare('INSERT INTO documents (worker_id, type, file_url) VALUES (?, ?, ?)').run(workerId, 'pan', '/uploads/mock_pan.jpg');

      // 4. Audit Log
      db.prepare('INSERT INTO audit_logs (user_id, action, target_type, target_id) VALUES (?, ?, ?, ?)')
        .run(1, 'ADD_WORKER_TEST', 'worker', workerId);
        
      console.log("Successfully registered Arjun Singh with all details.");
    })();
  } catch (err) {
    console.error("Failed to add test person:", err);
  }
}

addFullPerson();
