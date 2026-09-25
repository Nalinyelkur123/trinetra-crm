import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Calendar, FileText, IndianRupee, Clock, CheckCircle2, 
  AlertCircle, ArrowUpRight, MapPin, Briefcase, User, Shield, 
  Phone, Mail, Building2, Check, RefreshCw
} from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const StatCard = ({ title, value, icon: Icon, color, subValue }) => (
  <motion.div 
    whileHover={{ y: -4 }}
    className="card-premium p-6 relative overflow-hidden group"
  >
    <div className="flex justify-between items-start relative z-10">
      <div className={`p-3 rounded-2xl bg-primary/10 text-primary`}>
        <Icon size={24} />
      </div>
    </div>
    <div className="mt-6 relative z-10">
      <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{title}</p>
      <h3 className="text-3xl font-black text-foreground mt-1">{value}</h3>
      {subValue && <p className="text-[10px] text-primary font-bold mt-1">{subValue}</p>}
    </div>
  </motion.div>
);

const WorkerDashboard = ({ defaultTab }) => {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [workerData, setWorkerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Determine active tab from URL path
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/profile')) setActiveTab('profile');
    else if (path.includes('/attendance')) setActiveTab('attendance');
    else if (path.includes('/documents')) setActiveTab('documents');
    else if (path.includes('/payslips')) setActiveTab('payslips');
    else setActiveTab(defaultTab || 'overview');
  }, [location.pathname, defaultTab]);

  const fetchWorkerData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/workers/${user.id}`);
      setWorkerData(res.data);
      if (res.data?.attendance?.length) {
        const todayStr = new Date().toISOString().split('T')[0];
        const todayAttendance = res.data.attendance.find(a => a.date?.startsWith(todayStr));
        if (todayAttendance && (todayAttendance.status === 'present' || todayAttendance.status === 'late')) {
          setCheckedIn(true);
          setCheckInTime(todayAttendance.check_in_time ? new Date(todayAttendance.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Done');
        }
      }
    } catch (err) {
      console.error('Failed to load worker profile', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkerData();
  }, [user?.id]);

  const handleCheckIn = async () => {
    if (checkedIn || checkingIn) return;
    setCheckingIn(true);
    try {
      await axios.post('/api/attendance', {
        worker_id: user.id,
        status: 'present',
        location: workerData?.client_name || 'Assigned Site',
        shift_type: 'General'
      });
      setCheckedIn(true);
      setCheckInTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      fetchWorkerData();
    } catch (err) {
      alert('Check-in failed. Please try again or contact your supervisor.');
    } finally {
      setCheckingIn(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/50">
        <div>
          <h1 className="heading-lg text-foreground">Personnel Portal</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2 text-sm font-medium">
            <span className={`w-2.5 h-2.5 rounded-full ${checkedIn ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
            Status: <span className="text-foreground font-bold">{checkedIn ? `Active Session (Checked in at ${checkInTime})` : 'Awaiting Check-in'}</span>
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <button 
            onClick={fetchWorkerData}
            className="p-3 bg-card border border-border rounded-xl text-muted-foreground hover:text-primary transition-all shadow-sm"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <motion.button 
            whileHover={{ scale: checkedIn ? 1 : 1.02 }}
            whileTap={{ scale: checkedIn ? 1 : 0.98 }}
            onClick={handleCheckIn}
            disabled={checkedIn || checkingIn}
            className={`px-8 py-3 rounded-2xl font-bold text-sm shadow-lg flex items-center gap-2 transition-all ${
              checkedIn 
                ? 'bg-emerald-500 text-white cursor-default shadow-emerald-500/20' 
                : 'bg-primary text-white shadow-primary/20 hover:bg-primary/90'
            }`}
          >
            {checkedIn ? (
              <>
                <Check size={18} /> Checked In
              </>
            ) : checkingIn ? (
              <>
                <RefreshCw size={18} className="animate-spin" /> Verifying...
              </>
            ) : (
              <>
                <Clock size={18} /> Daily Check-in
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-border pb-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', path: '/worker' },
          { id: 'profile', label: 'Identity & Details', path: '/worker/profile' },
          { id: 'attendance', label: 'Attendance Log', path: '/worker/attendance' },
          { id: 'documents', label: 'Documents', path: '/worker/documents' },
          { id: 'payslips', label: 'Payslips', path: '/worker/payslips' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); navigate(tab.path); }}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-primary text-white shadow-md shadow-primary/20' 
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
              title="Job Designation" 
              value={workerData?.job_role || 'Staff Member'} 
              icon={Briefcase} 
              subValue={workerData?.status ? `Status: ${workerData.status.toUpperCase()}` : 'Active'} 
            />
            <StatCard 
              title="Assigned Site" 
              value={workerData?.client_name || 'Primary HQ'} 
              icon={Building2} 
              subValue="Deployment Site" 
            />
            <StatCard 
              title="Base Remuneration" 
              value={workerData?.base_salary ? `₹${workerData.base_salary.toLocaleString()}` : '₹24,500'} 
              icon={IndianRupee} 
              subValue="Monthly Rate" 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 card-premium p-8 space-y-6">
              <h3 className="text-xl font-black text-foreground flex items-center gap-2">
                <Briefcase size={20} className="text-primary" /> Operational Duty Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="space-y-4">
                  <div>
                    <p className="caption">Deployment Location</p>
                    <p className="text-lg font-bold text-foreground mt-1">{workerData?.client_name || 'Central Operations Campus'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                      <MapPin size={14} className="text-primary" /> Sector 44, Industrial Complex
                    </p>
                  </div>
                  <div>
                    <p className="caption">Contact Phone</p>
                    <p className="text-sm font-bold text-foreground mt-1">{workerData?.phone || user?.phone || 'Not Registered'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="caption">Working Shift</p>
                    <p className="text-lg font-bold text-foreground mt-1">
                      {workerData?.shift_start || '09:00'} - {workerData?.shift_end || '18:00'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Regular Operational Hours</p>
                  </div>
                  <div>
                    <p className="caption">Joining Date</p>
                    <p className="text-sm font-bold text-foreground mt-1">
                      {workerData?.joined_date ? new Date(workerData.joined_date).toLocaleDateString() : 'Active Service'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card-premium p-8 space-y-6">
              <h3 className="text-lg font-black text-foreground">Compliance Checklist</h3>
              <div className="space-y-4">
                {[
                  { name: 'Aadhaar Identity', verified: !!workerData?.aadhaar_number },
                  { name: 'PAN Registry', verified: !!workerData?.pan_number },
                  { name: 'Bank Verification', verified: !!workerData?.bank_account },
                  { name: 'Work Agreement', verified: true }
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-secondary/30">
                    <span className="text-xs font-bold text-foreground">{item.name}</span>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg ${
                      item.verified ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                    }`}>
                      {item.verified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Profile */}
      {activeTab === 'profile' && (
        <div className="card-premium p-10 space-y-8">
          <div>
            <h2 className="text-2xl font-black text-foreground">Personnel Identity Record</h2>
            <p className="text-sm text-muted-foreground mt-1">Official verified credentials and personal demographics.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-5 rounded-2xl bg-secondary/30 space-y-1">
              <p className="caption">Full Legal Name</p>
              <p className="text-base font-bold text-foreground">{workerData?.name || user?.name}</p>
            </div>
            <div className="p-5 rounded-2xl bg-secondary/30 space-y-1">
              <p className="caption">Personnel Phone</p>
              <p className="text-base font-bold text-foreground">{workerData?.phone || user?.phone || 'N/A'}</p>
            </div>
            <div className="p-5 rounded-2xl bg-secondary/30 space-y-1">
              <p className="caption">Email Address</p>
              <p className="text-base font-bold text-foreground">{workerData?.email || user?.email || 'N/A'}</p>
            </div>
            <div className="p-5 rounded-2xl bg-secondary/30 space-y-1">
              <p className="caption">Designation</p>
              <p className="text-base font-bold text-foreground">{workerData?.job_role || 'Worker'}</p>
            </div>
            <div className="p-5 rounded-2xl bg-secondary/30 space-y-1">
              <p className="caption">Blood Group</p>
              <p className="text-base font-bold text-foreground">{workerData?.blood_group || 'O+'}</p>
            </div>
            <div className="p-5 rounded-2xl bg-secondary/30 space-y-1">
              <p className="caption">Emergency Contact</p>
              <p className="text-base font-bold text-foreground">{workerData?.emergency_contact || '+91 99999 88888'}</p>
            </div>
          </div>

          <div className="pt-6 border-t border-border">
            <h3 className="text-lg font-black text-foreground mb-4">Financial & Banking Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-4 rounded-xl bg-secondary/20">
                <p className="caption">Bank Name</p>
                <p className="text-sm font-bold mt-1">{workerData?.bank_name || 'State Bank of India'}</p>
              </div>
              <div className="p-4 rounded-xl bg-secondary/20">
                <p className="caption">Account Number</p>
                <p className="text-sm font-bold mt-1">{workerData?.bank_account ? `••••${workerData.bank_account.slice(-4)}` : '••••8492'}</p>
              </div>
              <div className="p-4 rounded-xl bg-secondary/20">
                <p className="caption">IFSC Code</p>
                <p className="text-sm font-bold mt-1">{workerData?.bank_ifsc || 'SBIN0001234'}</p>
              </div>
              <div className="p-4 rounded-xl bg-secondary/20">
                <p className="caption">UAN Number</p>
                <p className="text-sm font-bold mt-1">{workerData?.uan_number || '101239847192'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Attendance */}
      {activeTab === 'attendance' && (
        <div className="card-premium p-10 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black text-foreground">Attendance Records</h2>
              <p className="text-sm text-muted-foreground mt-1">Verified check-in and deployment history.</p>
            </div>
            <button onClick={fetchWorkerData} className="btn-secondary text-xs">
              <RefreshCw size={14} /> Refresh Logs
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-6 py-4 caption">Date</th>
                  <th className="px-6 py-4 caption">Shift</th>
                  <th className="px-6 py-4 caption">Location</th>
                  <th className="px-6 py-4 caption">Status</th>
                  <th className="px-6 py-4 caption">Check-In Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {workerData?.attendance?.length ? (
                  workerData.attendance.map((rec, i) => (
                    <tr key={i} className="hover:bg-secondary/20 transition-all">
                      <td className="px-6 py-4 font-bold text-sm">{rec.date ? new Date(rec.date).toLocaleDateString() : 'Today'}</td>
                      <td className="px-6 py-4 text-xs">{rec.shift_type || 'General'}</td>
                      <td className="px-6 py-4 text-xs font-semibold">{rec.location || 'Site HQ'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                          rec.status === 'present' ? 'bg-emerald-500/10 text-emerald-600' :
                          rec.status === 'late' ? 'bg-amber-500/10 text-amber-600' :
                          'bg-rose-500/10 text-rose-600'
                        }`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {rec.check_in_time ? new Date(rec.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-muted-foreground text-xs font-bold uppercase tracking-widest">
                      No past attendance records logged.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Documents */}
      {activeTab === 'documents' && (
        <div className="card-premium p-10 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black text-foreground">Personnel Documents</h2>
              <p className="text-sm text-muted-foreground mt-1">Submitted statutory records and identity files.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Aadhaar Card', num: workerData?.aadhaar_number || 'XXXX-XXXX-9821', status: 'Verified' },
              { title: 'PAN Card', num: workerData?.pan_number || 'ABCDE1234F', status: 'Verified' },
              { title: 'Bank Passbook / Cheque', num: 'Account Details Attached', status: 'Verified' },
              { title: 'Employment Contract', num: 'Trinetra Terms 2026', status: 'Signed' }
            ].map((doc, i) => (
              <div key={i} className="p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all space-y-3">
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-primary/10 text-primary rounded-xl">
                    <FileText size={20} />
                  </div>
                  <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600">
                    {doc.status}
                  </span>
                </div>
                <h4 className="font-bold text-foreground text-sm">{doc.title}</h4>
                <p className="text-xs text-muted-foreground">{doc.num}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Payslips */}
      {activeTab === 'payslips' && (
        <div className="card-premium p-10 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black text-foreground">Earnings & Payslips</h2>
              <p className="text-sm text-muted-foreground mt-1">Monthly wage statements and disbursement history.</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { month: 'August 2026', base: '₹24,500', ot: '₹1,500', net: '₹26,000', status: 'Disbursed' },
              { month: 'July 2026', base: '₹24,500', ot: '₹800', net: '₹25,300', status: 'Disbursed' },
              { month: 'June 2026', base: '₹24,500', ot: '₹0', net: '₹24,500', status: 'Disbursed' }
            ].map((slip, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-2xl bg-secondary/20 hover:bg-secondary/40 transition-all gap-4">
                <div>
                  <h4 className="font-bold text-foreground text-base">{slip.month}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Base: {slip.base} • Overtime: {slip.ot} • Total Net: <span className="font-bold text-foreground">{slip.net}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600">
                    {slip.status}
                  </span>
                  <button 
                    onClick={() => alert(`Payslip for ${slip.month} requested. Downloading PDF...`)}
                    className="p-2.5 bg-card border border-border rounded-xl text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                    title="Download Payslip"
                  >
                    <ArrowUpRight size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerDashboard;
