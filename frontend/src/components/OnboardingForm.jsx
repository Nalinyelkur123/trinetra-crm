import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Briefcase, Phone, Mail, Calendar, MapPin, 
  CreditCard, Shield, Landmark, Award, BookOpen, 
  ChevronRight, ChevronLeft, Check, UploadCloud, X, DollarSign, MapPin as MapPinIcon
} from 'lucide-react';
import axios from 'axios';

const OnboardingForm = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [projects, setProjects] = useState([]);
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', job_role: '',
    joined_date: new Date().toISOString().split('T')[0],
    project_id: '', base_salary: '',
    father_name: '', mother_name: '', dob: '',
    gender: '', blood_group: '', pan_number: '',
    aadhaar_number: '', uan_number: '', bank_name: '',
    bank_branch: '', bank_account: '', bank_ifsc: '',
    bank_holder_name: '', qualification: '',
    experience_years: '', skills: '', address: '',
    emergency_contact: ''
  });

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axios.get('/api/projects');
        setProjects(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to load projects for dropdown');
      }
    };
    fetchProjects();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitting Data:', formData);
    setTimeout(() => {
      onSuccess?.();
      onClose();
    }, 800);
  };

  if (!isOpen) return null;

  const steps = [
    { id: 1, title: 'Identity', icon: User },
    { id: 2, title: 'Personal', icon: Shield },
    { id: 3, title: 'Financial', icon: Landmark },
    { id: 4, title: 'Professional', icon: Award },
  ];

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <InputField label="Full Legal Name" name="name" icon={User} value={formData.name} onChange={handleChange} placeholder="John Doe" />
              <InputField label="Contact Number" name="phone" icon={Phone} value={formData.phone} onChange={handleChange} placeholder="+91 XXXXX XXXXX" />
              <InputField label="Email Address" name="email" icon={Mail} value={formData.email} onChange={handleChange} placeholder="john@example.com" />
              <InputField label="Job Role" name="job_role" icon={Briefcase} value={formData.job_role} onChange={handleChange} placeholder="Site Supervisor" />
              <InputField label="Joining Date" name="joined_date" type="date" icon={Calendar} value={formData.joined_date} onChange={handleChange} />
              <div className="space-y-3">
                <label className="caption ml-1">Assigned Project Site</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <MapPinIcon size={18} />
                  </div>
                  <select 
                    name="project_id" 
                    value={formData.project_id} 
                    onChange={handleChange}
                    className="w-full input-field appearance-none cursor-pointer pl-12"
                  >
                    <option value="">Select Project Site</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <InputField label="Current Residential Address" name="address" icon={MapPin} value={formData.address} onChange={handleChange} placeholder="Full address details" />
              <InputField label="Emergency Contact" name="emergency_contact" icon={Phone} value={formData.emergency_contact} onChange={handleChange} placeholder="Name & Number" />
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <InputField label="Father's Name" name="father_name" icon={User} value={formData.father_name} onChange={handleChange} />
              <InputField label="Mother's Name" name="mother_name" icon={User} value={formData.mother_name} onChange={handleChange} />
              <InputField label="Date of Birth" name="dob" type="date" icon={Calendar} value={formData.dob} onChange={handleChange} />
              <div className="space-y-3">
                <label className="caption ml-1">Gender</label>
                <select 
                  name="gender" 
                  value={formData.gender} 
                  onChange={handleChange}
                  className="w-full input-field appearance-none cursor-pointer"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <InputField label="Blood Group" name="blood_group" icon={Shield} value={formData.blood_group} onChange={handleChange} placeholder="e.g. O+" />
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <InputField label="PAN Number" name="pan_number" icon={CreditCard} value={formData.pan_number} onChange={handleChange} placeholder="ABCDE1234F" />
              <InputField label="Aadhaar Number" name="aadhaar_number" icon={Shield} value={formData.aadhaar_number} onChange={handleChange} placeholder="1234 5678 9012" />
              <InputField label="UAN Number" name="uan_number" icon={Shield} value={formData.uan_number} onChange={handleChange} placeholder="100XXXXXXXXX" />
              <InputField label="Base Salary (₹)" name="base_salary" type="number" icon={DollarSign} value={formData.base_salary} onChange={handleChange} placeholder="0.00" />
            </div>
            <div className="pt-8 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-8">
              <InputField label="Bank Name" name="bank_name" icon={Landmark} value={formData.bank_name} onChange={handleChange} />
              <InputField label="Account Holder" name="bank_holder_name" icon={User} value={formData.bank_holder_name} onChange={handleChange} />
              <InputField label="Account Number" name="bank_account" icon={CreditCard} value={formData.bank_account} onChange={handleChange} />
              <InputField label="IFSC Code" name="bank_ifsc" icon={Landmark} value={formData.bank_ifsc} onChange={handleChange} />
              <InputField label="Branch Location" name="bank_branch" icon={MapPin} value={formData.bank_branch} onChange={handleChange} />
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <InputField label="Highest Qualification" name="qualification" icon={BookOpen} value={formData.qualification} onChange={handleChange} placeholder="e.g. Bachelor of Technology" />
              <InputField label="Years of Experience" name="experience_years" type="number" icon={Award} value={formData.experience_years} onChange={handleChange} />
            </div>
            <div className="space-y-3">
              <label className="caption ml-1">Specialized Skills</label>
              <textarea 
                name="skills" 
                value={formData.skills} 
                onChange={handleChange}
                placeholder="List skills separated by commas..."
                className="w-full input-field h-32 resize-none py-4"
              />
            </div>
            <div className="p-10 border-2 border-dashed border-border rounded-[2.5rem] flex flex-col items-center justify-center text-center group cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
              <UploadCloud className="text-muted-foreground group-hover:text-primary mb-4 transition-colors" size={40} />
              <p className="text-sm font-bold text-foreground">Upload Supporting Documents</p>
              <p className="caption mt-2">PAN, Aadhaar, Certificates (PDF/JPG)</p>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        className="modal-content max-w-4xl"
      >
        {/* Header */}
        <div className="p-8 md:p-10 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-foreground">Add Worker</h2>
            <p className="caption mt-2">Step {step} of 4</p>
          </div>
          <button onClick={onClose} className="p-3 bg-secondary rounded-2xl hover:bg-destructive/10 hover:text-destructive transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-10 py-6 bg-secondary/30 flex items-center justify-between gap-4">
          {steps.map((s) => (
            <div key={s.id} className="flex items-center gap-4">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                step >= s.id ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-secondary text-muted-foreground'
              }`}>
                {step > s.id ? <Check size={20} /> : <s.icon size={20} />}
              </div>
              <span className={`text-[11px] font-black uppercase tracking-widest hidden lg:block ${
                step >= s.id ? 'text-primary' : 'text-muted-foreground'
              }`}>{s.title}</span>
              {s.id < 4 && <div className="w-12 h-px bg-border hidden xl:block" />}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="p-8 md:p-12 max-h-[60vh] overflow-y-auto custom-scrollbar bg-background/50">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-8 md:p-10 border-t border-border flex items-center justify-between bg-secondary/20">
          <button 
            onClick={prevStep}
            disabled={step === 1}
            className={`btn-secondary gap-3 ${step === 1 ? 'opacity-0 pointer-events-none' : ''}`}
          >
            <ChevronLeft size={18} /> Back
          </button>
          
          {step < 4 ? (
            <button onClick={nextStep} className="btn-primary gap-3 px-10">
              Continue <ChevronRight size={18} />
            </button>
          ) : (
            <button onClick={handleSubmit} className="btn-primary bg-emerald-600 shadow-emerald-600/20 gap-3 px-10">
              Add Worker <Check size={18} />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const InputField = ({ label, name, icon: Icon, value, onChange, placeholder, type = 'text' }) => (
  <div className="space-y-3">
    <label className="caption ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
        <Icon size={18} />
      </div>
      <input 
        type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full input-field pl-12"
      />
    </div>
  </div>
);

export default OnboardingForm;
