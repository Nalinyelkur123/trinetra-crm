const bcrypt = require('bcryptjs');
const { db, initDb } = require('./config/db');

async function seed() {
  initDb();

  const adminPassword = await bcrypt.hash(process.env.ADMIN_SEED_PASSWORD || 'ChangeMe@123', 10);
  const workerPassword = await bcrypt.hash(process.env.WORKER_SEED_PASSWORD || 'ChangeMe@456', 10);

  try {
    // Create a dummy company
    const company = db.prepare('INSERT INTO companies (name, details) VALUES (?, ?)').run('Trinetra Solutions', 'HR & Manpower Management');
    const companyId = company.lastInsertRowid;

    // Create Admin
    db.prepare('INSERT INTO users (name, phone, email, password, role, company_id) VALUES (?, ?, ?, ?, ?, ?)')
      .run('System Admin', '9999999999', 'admin@trinetra.com', adminPassword, 'admin', companyId);

    // Create a Worker
    const workerUser = db.prepare('INSERT INTO users (name, phone, email, password, role, company_id) VALUES (?, ?, ?, ?, ?, ?)')
      .run('Suresh Narayan', '9876543210', 'suresh@trinetra.com', workerPassword, 'worker', companyId);
    
    db.prepare('INSERT INTO workers (user_id, job_role, status, joined_date) VALUES (?, ?, ?, ?)')
      .run(workerUser.lastInsertRowid, 'Senior Electrician', 'active', '2023-10-01');

    console.log('Seeding successful!');
    process.exit(0);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      console.log('Database already seeded.');
    } else {
      console.error('Seeding failed:', err);
    }
    process.exit(1);
  }
}

seed();
