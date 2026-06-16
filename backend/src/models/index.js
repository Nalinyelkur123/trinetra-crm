const mongoose = require('mongoose');

// Company
const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true },
  details: String,
  createdAt: { type: Date, default: Date.now }
});
const Company = mongoose.model('Company', CompanySchema);

// User
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, unique: true, required: true },
  email: { type: String },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'worker'], required: true },
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

// Worker
const WorkerSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  address: String,
  emergency_contact: String,
  skills: String,
  job_role: String,
  status: { type: String, default: 'active' },
  joined_date: Date,
  father_name: String,
  mother_name: String,
  dob: Date,
  gender: String,
  blood_group: String,
  pan_number: String,
  aadhaar_number: String,
  uan_number: String,
  bank_name: String,
  bank_branch: String,
  bank_account: String,
  bank_ifsc: String,
  bank_holder_name: String,
  qualification: String,
  experience_years: Number,
  base_salary: Number,
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  assignment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ClientAssignment' },
  shift_start: String,
  shift_end: String,
  working_hours: Number
});
const Worker = mongoose.model('Worker', WorkerSchema);

// Client
const ClientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  phone: String,
  contact_person: String,
  address: String,
  contract_terms: String,
  billing_rate: Number,
  gst_number: String,
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  agreement_start: Date,
  agreement_end: Date,
  payment_terms: String,
  status: { type: String, default: 'active' },
  shift_start: String,
  shift_end: String,
  working_hours: Number,
  createdAt: { type: Date, default: Date.now }
});
const Client = mongoose.model('Client', ClientSchema);

// ClientAssignment
const ClientAssignmentSchema = new mongoose.Schema({
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  name: { type: String, required: true },
  description: String,
  location: String,
  manager_name: String,
  contact_phone: String,
  start_date: Date,
  end_date: Date,
  status: { type: String, default: 'On-track' },
  progress: { type: Number, default: 0 },
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  shift_start: String,
  shift_end: String,
  working_hours: Number,
  createdAt: { type: Date, default: Date.now }
});
const ClientAssignment = mongoose.model('ClientAssignment', ClientAssignmentSchema);

// Attendance
const AttendanceSchema = new mongoose.Schema({
  worker_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['present', 'absent', 'half-day', 'late'], required: true },
  check_in_time: Date,
  check_out_time: Date,
  location: String,
  shift_type: { type: String, default: 'General' },
  overtime_hours: { type: Number, default: 0 },
  overtime_status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});
AttendanceSchema.index({ worker_id: 1, date: 1 }, { unique: true });
const Attendance = mongoose.model('Attendance', AttendanceSchema);

// Invoice
const InvoiceSchema = new mongoose.Schema({
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  assignment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ClientAssignment' },
  amount: { type: Number, required: true },
  gst_amount: Number,
  total_amount: { type: Number, required: true },
  status: { type: String, enum: ['paid', 'pending', 'cancelled'], default: 'pending' },
  issue_date: { type: Date, default: Date.now },
  due_date: Date,
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  createdAt: { type: Date, default: Date.now }
});
const Invoice = mongoose.model('Invoice', InvoiceSchema);

// Expense
const ExpenseSchema = new mongoose.Schema({
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  assignment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ClientAssignment' },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  description: String,
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  createdAt: { type: Date, default: Date.now }
});
const Expense = mongoose.model('Expense', ExpenseSchema);

// Payroll
const PayrollSchema = new mongoose.Schema({
  worker_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  base_salary: Number,
  overtime: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  net_pay: Number,
  status: { type: String, enum: ['paid', 'pending'], default: 'pending' },
  payslip_url: String,
  createdAt: { type: Date, default: Date.now }
});
const Payroll = mongoose.model('Payroll', PayrollSchema);

// Document
const DocumentSchema = new mongoose.Schema({
  worker_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  file_url: { type: String, required: true },
  status: { type: String, default: 'pending' },
  expiry_date: Date,
  createdAt: { type: Date, default: Date.now }
});
const Document = mongoose.model('Document', DocumentSchema);

// Leave
const LeaveSchema = new mongoose.Schema({
  worker_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  reason: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewed_at: Date,
  rejection_reason: String,
  createdAt: { type: Date, default: Date.now }
});
const Leave = mongoose.model('Leave', LeaveSchema);

// LeaveBalance
const LeaveBalanceSchema = new mongoose.Schema({
  worker_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  year: Number,
  casual_leaves: { type: Number, default: 12 },
  sick_leaves: { type: Number, default: 8 },
  annual_leaves: { type: Number, default: 20 },
  leaves_used_casual: { type: Number, default: 0 },
  leaves_used_sick: { type: Number, default: 0 },
  leaves_used_annual: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});
LeaveBalanceSchema.index({ worker_id: 1, year: 1 }, { unique: true });
const LeaveBalance = mongoose.model('LeaveBalance', LeaveBalanceSchema);

// SystemSetting
const SystemSettingSchema = new mongoose.Schema({
  company_name: { type: String, default: 'Trinetra Workforce' },
  timezone: { type: String, default: 'IST (UTC+5:30)' },
  auto_attendance: { type: Number, default: 1 },
  registry_lock: { type: Number, default: 0 },
  retention_period: { type: String, default: '365 Days' },
  notification_email: String,
  backup_frequency: { type: String, default: 'Daily' },
  security_2fa: { type: Number, default: 0 },
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', unique: true }
});
const SystemSetting = mongoose.model('SystemSetting', SystemSettingSchema);

// Candidate
const CandidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  phone: String,
  job_role: String,
  status: { type: String, default: 'Screening' },
  applied_date: { type: Date, default: Date.now }
});
const Candidate = mongoose.model('Candidate', CandidateSchema);

// Shift
const ShiftSchema = new mongoose.Schema({
  worker_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ClientAssignment' },
  shift_date: { type: Date, required: true },
  shift_type: { type: String, default: 'General' },
  start_time: String,
  end_time: String,
  status: { type: String, default: 'scheduled' },
  notes: String,
  createdAt: { type: Date, default: Date.now }
});
const Shift = mongoose.model('Shift', ShiftSchema);

// Task
const TaskSchema = new mongoose.Schema({
  assignment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ClientAssignment', required: true },
  worker_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  description: String,
  priority: { type: String, default: 'medium' },
  status: { type: String, default: 'pending' },
  start_date: Date,
  due_date: Date,
  completion_date: Date,
  assigned_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});
const Task = mongoose.model('Task', TaskSchema);

// Notification
const NotificationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: String,
  action_url: String,
  is_read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
const Notification = mongoose.model('Notification', NotificationSchema);

// Performance
const PerformanceSchema = new mongoose.Schema({
  worker_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: Number,
  year: Number,
  total_days: Number,
  present_days: Number,
  absent_days: Number,
  late_days: Number,
  attendance_percentage: Number,
  punctuality_score: Number,
  tasks_completed: Number,
  performance_rating: String,
  notes: String,
  createdAt: { type: Date, default: Date.now }
});
PerformanceSchema.index({ worker_id: 1, month: 1, year: 1 }, { unique: true });
const Performance = mongoose.model('Performance', PerformanceSchema);

// SiteMonitoring
const SiteMonitoringSchema = new mongoose.Schema({
  assignment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ClientAssignment', required: true },
  supervisor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  supervisor_notes: String,
  worker_count: Number,
  safety_score: Number,
  quality_score: Number,
  monitoring_date: Date,
  latitude: Number,
  longitude: Number,
  client_feedback: String,
  createdAt: { type: Date, default: Date.now }
});
const SiteMonitoring = mongoose.model('SiteMonitoring', SiteMonitoringSchema);

// Message
const MessageSchema = new mongoose.Schema({
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  group_id: String,
  message_type: { type: String, default: 'personal' },
  content: { type: String, required: true },
  is_read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', MessageSchema);

// Holiday
const HolidaySchema = new mongoose.Schema({
  name: { type: String, required: true },
  holiday_date: { type: Date, required: true },
  category: String,
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  createdAt: { type: Date, default: Date.now }
});
const Holiday = mongoose.model('Holiday', HolidaySchema);

// AuditLog
const AuditLogSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  target_type: String,
  target_id: mongoose.Schema.Types.ObjectId,
  timestamp: { type: Date, default: Date.now }
});
const AuditLog = mongoose.model('AuditLog', AuditLogSchema);

// DisciplineRecord
const DisciplineRecordSchema = new mongoose.Schema({
  worker_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  record_date: { type: Date, required: true },
  category: { type: String, required: true },
  severity: { type: String, default: 'warning' },
  notes: String,
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});
const DisciplineRecord = mongoose.model('DisciplineRecord', DisciplineRecordSchema);

module.exports = {
  Company, User, Worker, Client, ClientAssignment, Attendance, Invoice, Expense,
  Payroll, Document, Leave, LeaveBalance, SystemSetting, Candidate, Shift, Task,
  Notification, Performance, SiteMonitoring, Message, Holiday, AuditLog, DisciplineRecord
};

// Note
const NoteSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  priority: { type: String, default: 'normal' },
  is_completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
const Note = mongoose.model('Note', NoteSchema);

module.exports.Note = Note;

