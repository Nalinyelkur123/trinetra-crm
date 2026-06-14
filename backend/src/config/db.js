const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../../database.sqlite'));

// Initialize tables
const initDb = () => {
  // Companies table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // Users table (Admin/Worker)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'worker')) NOT NULL,
      company_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id)
    )
  `).run();

  // Workers specific details
  db.prepare(`
    CREATE TABLE IF NOT EXISTS workers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      address TEXT,
      emergency_contact TEXT,
      skills TEXT,
      job_role TEXT,
      status TEXT DEFAULT 'active',
      joined_date DATE,
      
      -- Personal Info
      father_name TEXT,
      mother_name TEXT,
      dob DATE,
      gender TEXT,
      blood_group TEXT,
      
      -- Identity Records
      pan_number TEXT,
      aadhaar_number TEXT,
      uan_number TEXT,
      
      -- Bank Details
      bank_name TEXT,
      bank_branch TEXT,
      bank_account TEXT,
      bank_ifsc TEXT,
      bank_holder_name TEXT,
      
      -- Professional
      qualification TEXT,
      experience_years INTEGER,
      
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `).run();

  // Documents
  db.prepare(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      file_url TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      expiry_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (worker_id) REFERENCES users(id)
    )
  `).run();

  // Clients table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      contact_person TEXT,
      address TEXT,
      contract_terms TEXT,
      billing_rate REAL,
      gst_number TEXT,
      company_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id)
    )
  `).run();

  // Invoices table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      assignment_id INTEGER,
      amount REAL NOT NULL,
      gst_amount REAL,
      total_amount REAL NOT NULL,
      status TEXT CHECK(status IN ('paid', 'pending', 'cancelled')) DEFAULT 'pending',
      issue_date DATE DEFAULT CURRENT_TIMESTAMP,
      due_date DATE,
      company_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (assignment_id) REFERENCES client_assignments(id),
      FOREIGN KEY (company_id) REFERENCES companies(id)
    )
  `).run();

  // Expenses table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      assignment_id INTEGER,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      date DATE DEFAULT CURRENT_TIMESTAMP,
      description TEXT,
      company_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (assignment_id) REFERENCES client_assignments(id),
      FOREIGN KEY (company_id) REFERENCES companies(id)
    )
  `).run();
  // Migrate existing expenses tables that may have been created with old project_id schema
  try { db.prepare("ALTER TABLE expenses ADD COLUMN client_id INTEGER").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE expenses ADD COLUMN assignment_id INTEGER").run(); } catch (e) {}

  // Client Assignments (formerly Projects)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS client_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      location TEXT,
      manager_name TEXT,
      contact_phone TEXT,
      start_date DATE,
      end_date DATE,
      status TEXT DEFAULT 'On-track',
      progress INTEGER DEFAULT 0,
      company_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id),
      FOREIGN KEY (client_id) REFERENCES clients(id)
    )
  `).run();

  // Add missing columns if table already exists
  try { db.prepare("ALTER TABLE client_assignments ADD COLUMN manager_name TEXT").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE client_assignments ADD COLUMN contact_phone TEXT").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE client_assignments ADD COLUMN shift_start TEXT").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE client_assignments ADD COLUMN shift_end TEXT").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE client_assignments ADD COLUMN working_hours REAL").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE client_assignments ADD COLUMN start_date DATE").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE client_assignments ADD COLUMN end_date DATE").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE client_assignments ADD COLUMN location TEXT").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE client_assignments ADD COLUMN status TEXT DEFAULT 'On-track'").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE client_assignments ADD COLUMN progress INTEGER DEFAULT 0").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE client_assignments ADD COLUMN client_id INTEGER").run(); } catch (e) {}

  // Add missing columns for clients
  try { db.prepare("ALTER TABLE clients ADD COLUMN gst_number TEXT").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE clients ADD COLUMN agreement_start DATE").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE clients ADD COLUMN agreement_end DATE").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE clients ADD COLUMN payment_terms TEXT").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE clients ADD COLUMN status TEXT DEFAULT 'active'").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE clients ADD COLUMN shift_start TEXT").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE clients ADD COLUMN shift_end TEXT").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE clients ADD COLUMN working_hours REAL").run(); } catch (e) {}

  // System Settings Table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT DEFAULT 'Trinetra Workforce',
      timezone TEXT DEFAULT 'IST (UTC+5:30)',
      auto_attendance INTEGER DEFAULT 1,
      registry_lock INTEGER DEFAULT 0,
      retention_period TEXT DEFAULT '365 Days',
      notification_email TEXT,
      backup_frequency TEXT DEFAULT 'Daily',
      security_2fa INTEGER DEFAULT 0,
      company_id INTEGER UNIQUE DEFAULT 1
    )
  `).run();

  // Add missing columns if they don't exist (safety for existing DBs)
  try { db.prepare("ALTER TABLE settings ADD COLUMN notification_email TEXT").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE settings ADD COLUMN backup_frequency TEXT DEFAULT 'Daily'").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE settings ADD COLUMN security_2fa INTEGER DEFAULT 0").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE settings ADD COLUMN company_id INTEGER DEFAULT 1").run(); } catch (e) {}
  // Seed company_id=1 for any existing rows that have NULL company_id
  try { db.prepare("UPDATE settings SET company_id = 1 WHERE company_id IS NULL").run(); } catch (e) {}
  try { db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_settings_company ON settings(company_id)").run(); } catch (e) {}

  // Initialize settings if empty
  const settingCount = db.prepare('SELECT COUNT(*) as count FROM settings').get();
  if (settingCount.count === 0) {
    db.prepare('INSERT OR IGNORE INTO settings (company_name, company_id) VALUES (?, ?)').run('Trinetra Workforce', 1);
  }

  // Add missing columns for workers
  try { db.prepare("ALTER TABLE workers ADD COLUMN base_salary REAL").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE workers ADD COLUMN client_id INTEGER").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE workers ADD COLUMN assignment_id INTEGER").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE workers ADD COLUMN shift_start TEXT").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE workers ADD COLUMN shift_end TEXT").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE workers ADD COLUMN working_hours REAL").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE invoices ADD COLUMN assignment_id INTEGER").run(); } catch (e) {}

  // Candidates (Recruitment Hub)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      job_role TEXT,
      status TEXT DEFAULT 'Screening',
      applied_date DATE DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // Work Assignments
  db.prepare(`
    CREATE TABLE IF NOT EXISTS work_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER NOT NULL,
      project_id INTEGER NOT NULL,
      shift_timing TEXT,
      supervisor_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (worker_id) REFERENCES users(id),
      FOREIGN KEY (project_id) REFERENCES projects(id)
    )
  `).run();

  // Attendance
  db.prepare(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER NOT NULL,
      date DATE NOT NULL,
      status TEXT CHECK(status IN ('present', 'absent', 'half-day', 'late')) NOT NULL,
      check_in_time DATETIME,
      check_out_time DATETIME,
      location TEXT,
      shift_type TEXT DEFAULT 'General',
      overtime_hours REAL DEFAULT 0,
      overtime_status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (worker_id) REFERENCES users(id)
    )
  `).run();
  try { db.prepare("ALTER TABLE attendance ADD COLUMN shift_type TEXT DEFAULT 'General'").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE attendance ADD COLUMN overtime_hours REAL DEFAULT 0").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE attendance ADD COLUMN overtime_status TEXT DEFAULT 'pending'").run(); } catch (e) {}
  try { db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_worker_date ON attendance(worker_id, date)").run(); } catch (e) {}

  // Payroll
  db.prepare(`
    CREATE TABLE IF NOT EXISTS payroll (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER NOT NULL,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      base_salary REAL,
      overtime REAL DEFAULT 0,
      deductions REAL DEFAULT 0,
      net_pay REAL,
      status TEXT CHECK(status IN ('paid', 'pending')) DEFAULT 'pending',
      payslip_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (worker_id) REFERENCES users(id)
    )
  `).run();
  // Audit Logs
  db.prepare(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // Leaves Management
  db.prepare(`
    CREATE TABLE IF NOT EXISTS leaves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      reason TEXT,
      status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (worker_id) REFERENCES users(id)
    )
  `).run();
  try { db.prepare("ALTER TABLE leaves ADD COLUMN reviewed_by INTEGER").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE leaves ADD COLUMN reviewed_at DATETIME").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE leaves ADD COLUMN rejection_reason TEXT").run(); } catch (e) {}

  // Notes/Reminders
  db.prepare(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      priority TEXT DEFAULT 'normal',
      is_completed BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `).run();

  // Shifts Scheduling
  db.prepare(`
    CREATE TABLE IF NOT EXISTS shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER NOT NULL,
      assignment_id INTEGER,
      shift_date DATE NOT NULL,
      shift_type TEXT DEFAULT 'General',
      start_time TEXT,
      end_time TEXT,
      status TEXT DEFAULT 'scheduled',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (worker_id) REFERENCES users(id),
      FOREIGN KEY (assignment_id) REFERENCES client_assignments(id)
    )
  `).run();

  // Tasks/Work Orders
  db.prepare(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignment_id INTEGER NOT NULL,
      worker_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'pending',
      start_date DATE,
      due_date DATE,
      completion_date DATE,
      assigned_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assignment_id) REFERENCES client_assignments(id),
      FOREIGN KEY (worker_id) REFERENCES users(id),
      FOREIGN KEY (assigned_by) REFERENCES users(id)
    )
  `).run();

  // Notifications
  db.prepare(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT,
      action_url TEXT,
      is_read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `).run();

  // Performance Tracking
  db.prepare(`
    CREATE TABLE IF NOT EXISTS performance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER NOT NULL,
      month INTEGER,
      year INTEGER,
      total_days INTEGER,
      present_days INTEGER,
      absent_days INTEGER,
      late_days INTEGER,
      attendance_percentage REAL,
      punctuality_score REAL,
      tasks_completed INTEGER,
      performance_rating TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (worker_id) REFERENCES users(id)
    )
  `).run();
  try { db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_performance_worker_period ON performance(worker_id, month, year)").run(); } catch (e) {}

  // Site Monitoring
  db.prepare(`
    CREATE TABLE IF NOT EXISTS site_monitoring (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignment_id INTEGER NOT NULL,
      supervisor_id INTEGER,
      supervisor_notes TEXT,
      worker_count INTEGER,
      safety_score INTEGER,
      quality_score INTEGER,
      monitoring_date DATE,
      latitude REAL,
      longitude REAL,
      client_feedback TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assignment_id) REFERENCES client_assignments(id),
      FOREIGN KEY (supervisor_id) REFERENCES users(id)
    )
  `).run();
  try { db.prepare("ALTER TABLE site_monitoring ADD COLUMN latitude REAL").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE site_monitoring ADD COLUMN longitude REAL").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE site_monitoring ADD COLUMN client_feedback TEXT").run(); } catch (e) {}

  // Messages/Communication Hub
  db.prepare(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER,
      group_id TEXT,
      message_type TEXT DEFAULT 'personal',
      content TEXT NOT NULL,
      is_read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id)
    )
  `).run();

  // Holiday Calendar
  db.prepare(`
    CREATE TABLE IF NOT EXISTS holidays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      holiday_date DATE NOT NULL,
      category TEXT,
      company_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id)
    )
  `).run();

  // Leave Balance
  db.prepare(`
    CREATE TABLE IF NOT EXISTS leave_balance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER NOT NULL,
      year INTEGER,
      casual_leaves INTEGER DEFAULT 12,
      sick_leaves INTEGER DEFAULT 8,
      annual_leaves INTEGER DEFAULT 20,
      leaves_used_casual INTEGER DEFAULT 0,
      leaves_used_sick INTEGER DEFAULT 0,
      leaves_used_annual INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (worker_id) REFERENCES users(id)
    )
  `).run();
  try { db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_leave_balance_worker_year ON leave_balance(worker_id, year)").run(); } catch (e) {}

  // Discipline records used by performance reviews
  db.prepare(`
    CREATE TABLE IF NOT EXISTS discipline_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER NOT NULL,
      record_date DATE NOT NULL,
      category TEXT NOT NULL,
      severity TEXT DEFAULT 'warning',
      notes TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (worker_id) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `).run();
};

module.exports = { db, initDb };
