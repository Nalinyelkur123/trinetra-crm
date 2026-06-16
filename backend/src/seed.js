require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { initDb } = require('./config/db');
const { Company, User, Worker } = require('./models');

async function seed() {
  try {
    await initDb();

    const adminPassword = await bcrypt.hash(process.env.ADMIN_SEED_PASSWORD || 'ChangeMe@123', 10);
    const workerPassword = await bcrypt.hash(process.env.WORKER_SEED_PASSWORD || 'ChangeMe@456', 10);

    const existingAdmin = await User.findOne({ email: 'admin@trinetra.com' });
    if (existingAdmin) {
      console.log('Database already seeded.');
      process.exit(0);
    }

    // Create a dummy company
    const company = await Company.create({
      name: 'Trinetra Solutions',
      details: 'HR & Manpower Management'
    });
    const companyId = company._id;

    // Create Admin
    await User.create({
      name: 'System Admin',
      phone: '9999999999',
      email: 'admin@trinetra.com',
      password: adminPassword,
      role: 'admin',
      company_id: companyId
    });

    // Create a Worker
    const workerUser = await User.create({
      name: 'Suresh Narayan',
      phone: '9876543210',
      email: 'suresh@trinetra.com',
      password: workerPassword,
      role: 'worker',
      company_id: companyId
    });
    
    await Worker.create({
      user_id: workerUser._id,
      job_role: 'Senior Electrician',
      status: 'active',
      joined_date: new Date('2023-10-01')
    });

    console.log('Seeding successful!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
