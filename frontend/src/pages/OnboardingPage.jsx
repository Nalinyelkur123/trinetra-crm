import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, Phone, Mail, MapPin, Briefcase, Calendar, 
  ShieldCheck, Landmark, GraduationCap, ArrowLeft, Loader2, Save, 
  Activity, Smartphone, Upload, FileText, AlertCircle
} from 'lucide-react';
import axios from 'axios';

const OnboardingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', password: '', 
    address: '', emergency_contact: '', skills: '', job_role: '', joined_date: new Date().toISOString().split('T')[0],
    father_name: '', mother_name: '', dob: '', gender: 'Male', blood_group: 'O+',
    pan_number: '', aadhaar_number: '', uan_number: '',
    bank_name: '', bank_branch: '', bank_account: '', bank_ifsc: '', bank_holder_name: '',
    qualification: '', experience_years: 0, status: 'active',
    client_id: '', assignment_id: '', base_salary: '',
    shift_start: '', shift_end: '', working_hours: ''
  });

  const [clients, setClients] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [files, setFiles] = useState({
    aadhaar_file: null,
    pan_file: null
  });

  useEffect(() => {
    if (isEdit) {
      const fetchDetails = async () => {
        try {
          const res = await axios.get(`/api/workers/${id}`);
          setFormData(prev => ({ ...prev, ...res.data }));
        } catch (err) {
          setError('Failed to load personnel details');
        } finally {
          setLoading(false);
        }
      };
      fetchDetails();
    }

    const fetchData = async () => {
      try {
        const [clientsRes, assignmentsRes] = await Promise.all([
          axios.get('/api/clients'),
          axios.get('/api/assignments')
        ]);
        setClients(Array.isArray(clientsRes.data) ? clientsRes.data : []);
        setAssignments(Array.isArray(assignmentsRes.data) ? assignmentsRes.data : []);
      } catch (err) {
        console.error('Failed to load strategic entities');
      }
    };
    fetchData();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    setFiles(prev => ({ ...prev, [name]: selectedFiles[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const submitData = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== undefined) {
        submitData.append(key, formData[key]);
      }
    });
    if (files.aadhaar_file) submitData.append('aadhaar_file', files.aadhaar_file);
    if (files.pan_file) submitData.append('pan_file', files.pan_file);

    try {
      if (isEdit) {
        await axios.put(`/api/workers/${id}`, submitData);
      } else {
        await axios.post('/api/workers', submitData);
      }
      navigate('/admin/workers');
    } catch (err) {
      const errData = err.response?.data?.error;
      setError((typeof errData === 'object' ? errData?.message : errData) || 'Operation failed. Ensure all required fields are populated.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-24">
      {/* Top Navigation & Header */}
      <div className="flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md py-6 z-20 border-b border-border -mx-8 px-8">
        <div className="flex items-center gap-5">
          <button 
            onClick={() => navigate('/admin/workers')}
            className="p-3 bg-card border border-border rounded-2xl hover:bg-secondary transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black tracking-tighter">
              {isEdit ? 'Edit Worker' : 'Initialize Onboarding'}
            </h1>
            <p className="caption mt-1 flex items-center gap-2">
              <ShieldCheck size={12} className="text-primary" /> {isEdit ? `Modifying TRN-${id}` : 'Worker Registration'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button onClick={() => navigate('/admin/workers')} className="btn-secondary px-8 py-3.5">Cancel</button>
          <button 
            onClick={handleSubmit} 
            disabled={saving} 
            className="btn-primary px-10 py-3.5 shadow-xl shadow-primary/20"
          >
            {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save size={18} className="mr-2" />}
            {isEdit ? 'Save Changes' : 'Register Worker'}
          </button>
        </div>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-sm font-bold flex items-center gap-3"
        >
          <AlertCircle size={18} /> {error}
        </motion.div>
      )}

      {/* Main Unified Form */}
      <form onSubmit={handleSubmit} className="space-y-10">
        
        {/* SECTION 1: IDENTITY */}
        <section className="card-premium p-10">
          <div className="flex items-center gap-4 mb-10 pb-4 border-b border-border">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <User size={22} />
            </div>
            <div>
              <h3 className="text-xl font-black">Core Identity Details</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Primary legal and contact information</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="caption ml-1">Full Legal Name</label>
              <input name="name" required value={formData.name} onChange={handleChange} className="input-field w-full py-4 px-6" placeholder="Suresh Narayan" />
            </div>
            <div className="space-y-2">
              <label className="caption ml-1">Verified Phone</label>
              <div className="relative">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input name="phone" required value={formData.phone} onChange={handleChange} className="input-field pl-12 w-full py-4" placeholder="+91 00000 00000" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="caption ml-1">Official Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input name="email" value={formData.email} onChange={handleChange} className="input-field pl-12 w-full py-4" placeholder="name@domain.com" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="caption ml-1">System Access Key</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} className="input-field w-full py-4 px-6" placeholder={isEdit ? '••••••••' : 'Default: worker123'} disabled={isEdit} />
            </div>
          </div>
          
          <div className="mt-8 space-y-2">
            <label className="caption ml-1">Residential Address</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-4 text-muted-foreground" size={16} />
              <textarea name="address" rows="3" value={formData.address} onChange={handleChange} className="input-field pl-12 w-full py-4 resize-none" placeholder="Complete address with PIN" />
            </div>
          </div>
        </section>

        {/* SECTION 2: PERSONAL */}
        <section className="card-premium p-10">
          <div className="flex items-center gap-4 mb-10 pb-4 border-b border-border">
            <div className="w-10 h-10 bg-rose-500/10 text-rose-600 rounded-xl flex items-center justify-center">
              <Activity size={22} />
            </div>
            <div>
              <h3 className="text-xl font-black">Personal Particulars</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Confidential records and demographics</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="caption ml-1">Father's Name</label>
              <input name="father_name" value={formData.father_name} onChange={handleChange} className="input-field w-full" placeholder="Legal name" />
            </div>
            <div className="space-y-2">
              <label className="caption ml-1">Mother's Name</label>
              <input name="mother_name" value={formData.mother_name} onChange={handleChange} className="input-field w-full" placeholder="Legal name" />
            </div>
            <div className="space-y-2">
              <label className="caption ml-1">Date of Birth</label>
              <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="input-field w-full" />
            </div>
            <div className="space-y-2">
              <label className="caption ml-1">Emergency Contact</label>
              <input name="emergency_contact" value={formData.emergency_contact} onChange={handleChange} className="input-field w-full" placeholder="Relation & Phone" />
            </div>
            <div className="space-y-2">
              <label className="caption ml-1">Gender Identity</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="input-field w-full appearance-none">
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="caption ml-1">Blood Group</label>
              <select name="blood_group" value={formData.blood_group} onChange={handleChange} className="input-field w-full appearance-none">
                {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(bg => <option key={bg}>{bg}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* SECTION 3: PROFESSIONAL */}
        <section className="card-premium p-10">
          <div className="flex items-center gap-4 mb-10 pb-4 border-b border-border">
            <div className="w-10 h-10 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center">
              <Briefcase size={22} />
            </div>
            <div>
              <h3 className="text-xl font-black">Professional Deployment</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Role assignment and academic history</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="caption ml-1">Designated Job Role</label>
              <input name="job_role" value={formData.job_role} onChange={handleChange} className="input-field w-full" placeholder="e.g. Lead Technician" />
            </div>
            <div className="space-y-2">
              <label className="caption ml-1">Deployment Date</label>
              <input type="date" name="joined_date" value={formData.joined_date} onChange={handleChange} className="input-field w-full" />
            </div>
            <div className="space-y-2">
              <label className="caption ml-1">Highest Qualification</label>
              <div className="relative">
                <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input name="qualification" value={formData.qualification} onChange={handleChange} className="input-field pl-12 w-full" placeholder="e.g. Graduate" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="caption ml-1">Years of Experience</label>
              <input type="number" name="experience_years" value={formData.experience_years} onChange={handleChange} className="input-field w-full" />
            </div>
            <div className="space-y-2">
               <label className="caption ml-1">Worker Status</label>
               <select name="status" value={formData.status} onChange={handleChange} className="input-field w-full appearance-none">
                  <option value="active">Active/Authorized</option>
                  <option value="pending">Pending Review</option>
                  <option value="suspended">Suspended</option>
                  <option value="terminated">Terminated</option>
               </select>
            </div>
            <div className="space-y-2">
              <label className="caption ml-1">Core Skill Set</label>
              <input name="skills" value={formData.skills} onChange={handleChange} className="input-field w-full" placeholder="Separated by commas" />
            </div>
            <div className="space-y-2">
              <label className="caption ml-1">Assigned Client</label>
              <select 
                name="client_id" 
                value={formData.client_id || ''} 
                onChange={handleChange} 
                className="input-field w-full appearance-none"
              >
                <option value="">Select Primary Client</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="caption ml-1">Operational Site (Optional)</label>
              <select 
                name="assignment_id" 
                value={formData.assignment_id || ''} 
                onChange={handleChange} 
                className="input-field w-full appearance-none"
                disabled={!formData.client_id}
              >
                <option value="">Select Specific Site</option>
                {assignments.filter(a => a.client_id == formData.client_id).map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="caption ml-1">Base Salary (₹)</label>
              <input type="number" name="base_salary" value={formData.base_salary} onChange={handleChange} className="input-field w-full" placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <label className="caption ml-1 text-primary">Shift Start Time</label>
              <input type="time" name="shift_start" value={formData.shift_start} onChange={handleChange} className="input-field w-full" />
            </div>
            <div className="space-y-2">
              <label className="caption ml-1 text-primary">Shift End Time</label>
              <input type="time" name="shift_end" value={formData.shift_end} onChange={handleChange} className="input-field w-full" />
            </div>
            <div className="space-y-2">
              <label className="caption ml-1 text-primary">Est. Working Hours</label>
              <input type="number" name="working_hours" value={formData.working_hours} onChange={handleChange} className="input-field w-full" placeholder="8.0" />
            </div>
          </div>
        </section>

        {/* SECTION 4: FINANCIAL */}
        <section className="card-premium p-10">
          <div className="flex items-center gap-4 mb-10 pb-4 border-b border-border">
            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center">
              <Landmark size={22} />
            </div>
            <div>
              <h3 className="text-xl font-black">Financial Details</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Banking details for payroll processing</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="caption ml-1">Bank Institution</label>
              <input name="bank_name" value={formData.bank_name} onChange={handleChange} className="input-field w-full" placeholder="e.g. HDFC Bank" />
            </div>
            <div className="space-y-2">
              <label className="caption ml-1">Account Number</label>
              <input name="bank_account" value={formData.bank_account} onChange={handleChange} className="input-field w-full font-mono" />
            </div>
            <div className="space-y-2">
              <label className="caption ml-1">IFSC Code</label>
              <input name="bank_ifsc" value={formData.bank_ifsc} onChange={handleChange} className="input-field w-full font-mono uppercase" placeholder="IFSC0000000" />
            </div>
            <div className="space-y-2">
              <label className="caption ml-1">Account Holder Name</label>
              <input name="bank_holder_name" value={formData.bank_holder_name} onChange={handleChange} className="input-field w-full" />
            </div>
          </div>
        </section>

        {/* SECTION 5: DOCUMENTS */}
        <section className="card-premium p-10">
          <div className="flex items-center gap-4 mb-10 pb-4 border-b border-border">
            <div className="w-10 h-10 bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="text-xl font-black">Identity Records & Documents</h3>
              <p className="text-xs text-muted-foreground mt-0.5">ID Cards and document uploads</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
             {/* Aadhaar Upload */}
             <div className="space-y-6 p-8 bg-secondary/20 rounded-[2rem] border border-border">
                <div className="space-y-3">
                   <label className="caption">Aadhaar Number (UID)</label>
                   <input name="aadhaar_number" value={formData.aadhaar_number} onChange={handleChange} className="input-field w-full font-mono text-center tracking-widest text-lg py-4" placeholder="0000 0000 0000" />
                </div>
                <div className="space-y-3">
                   <label className="caption">Aadhaar Document</label>
                   <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-3xl p-8 cursor-pointer hover:border-primary transition-all group bg-card">
                      <Upload className="text-muted-foreground group-hover:text-primary transition-colors mb-2" size={28} />
                      <span className="text-[10px] font-black uppercase text-muted-foreground">{files.aadhaar_file ? files.aadhaar_file.name : 'Choose Aadhaar (PDF/IMG)'}</span>
                      <input type="file" name="aadhaar_file" onChange={handleFileChange} className="hidden" />
                   </label>
                </div>
             </div>

             {/* PAN Upload */}
             <div className="space-y-6 p-8 bg-secondary/20 rounded-[2rem] border border-border">
                <div className="space-y-3">
                   <label className="caption">PAN Card Number</label>
                   <input name="pan_number" value={formData.pan_number} onChange={handleChange} className="input-field w-full font-mono text-center uppercase text-lg py-4" placeholder="ABCDE1234F" />
                </div>
                <div className="space-y-3">
                   <label className="caption">PAN Card Document</label>
                   <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-3xl p-8 cursor-pointer hover:border-primary transition-all group bg-card">
                      <Upload className="text-muted-foreground group-hover:text-primary transition-colors mb-2" size={28} />
                      <span className="text-[10px] font-black uppercase text-muted-foreground">{files.pan_file ? files.pan_file.name : 'Choose PAN (PDF/IMG)'}</span>
                      <input type="file" name="pan_file" onChange={handleFileChange} className="hidden" />
                   </label>
                </div>
             </div>
          </div>

          <div className="mt-10 pt-10 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-2">
                <label className="caption ml-1">UAN Number (Provident Fund)</label>
                <input name="uan_number" value={formData.uan_number} onChange={handleChange} className="input-field w-full font-mono" placeholder="100XXXXXXXXX" />
             </div>
             <div className="flex items-center gap-4 p-6 bg-primary/5 rounded-2xl border border-primary/10">
                <AlertCircle size={24} className="text-primary shrink-0" />
                <p className="text-[10px] font-bold text-muted-foreground leading-relaxed uppercase">
                   Please ensure all ID numbers match the uploaded documents exactly to prevent payroll issues.
                </p>
             </div>
          </div>
        </section>
      </form>
    </div>
  );
};

export default OnboardingPage;
