import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, User, Shield, Landmark, Award, Phone, Mail, 
  MapPin, Calendar, CreditCard, BookOpen, Briefcase,
  FileText, Download, CheckCircle2, Clock
} from 'lucide-react';

const WorkerDetailsModal = ({ isOpen, onClose, worker }) => {
  if (!isOpen || !worker) return null;

  const sections = [
    { 
      id: 'basic', 
      title: 'Strategic Profile', 
      icon: User,
      fields: [
        { label: 'Full Legal Name', value: worker.name, icon: User },
        { label: 'Identity Code', value: worker.id, icon: Shield },
        { label: 'Strategic Role', value: worker.job_role || worker.role, icon: Briefcase },
        { label: 'Deployment Status', value: worker.status, icon: CheckCircle2, isStatus: true },
        { label: 'Verified Phone', value: worker.phone, icon: Phone },
        { label: 'Electronic Mail', value: worker.email || 'N/A', icon: Mail },
        { label: 'Onboarding Date', value: worker.joined_date, icon: Calendar },
      ]
    },
    { 
      id: 'personal', 
      title: 'Personal Identity', 
      icon: Shield,
      fields: [
        { label: "Father's Name", value: worker.father_name || 'N/A' },
        { label: "Mother's Name", value: worker.mother_name || 'N/A' },
        { label: 'Date of Birth', value: worker.dob || 'N/A' },
        { label: 'Gender Identity', value: worker.gender || 'N/A' },
        { label: 'Blood Group', value: worker.blood_group || 'N/A' },
        { label: 'Residential Address', value: worker.address || 'N/A', fullWidth: true },
      ]
    },
    { 
      id: 'financial', 
      title: 'Financial Records', 
      icon: Landmark,
      fields: [
        { label: 'PAN Number', value: worker.pan_number || 'N/A' },
        { label: 'Aadhaar Number', value: worker.aadhaar_number || 'N/A' },
        { label: 'UAN Number', value: worker.uan_number || 'N/A' },
        { label: 'Bank Name', value: worker.bank_name || 'N/A' },
        { label: 'Account Holder', value: worker.bank_holder_name || 'N/A' },
        { label: 'Account Number', value: worker.bank_account || 'N/A' },
        { label: 'IFSC Protocol', value: worker.bank_ifsc || 'N/A' },
        { label: 'Branch Location', value: worker.bank_branch || 'N/A' },
      ]
    },
    { 
      id: 'professional', 
      title: 'Professional Background', 
      icon: Award,
      fields: [
        { label: 'Highest Qualification', value: worker.qualification || 'N/A' },
        { label: 'Operational Experience', value: `${worker.experience_years || 0} Years` },
        { label: 'Specialized Skills', value: worker.skills || 'N/A', fullWidth: true },
      ]
    }
  ];

  return (
    <div className="modal-overlay">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        className="modal-content max-w-5xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-8 md:p-12 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-6 bg-secondary/20 shrink-0 relative">
          <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8 mt-6 md:mt-0">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-[2rem] bg-primary flex items-center justify-center text-4xl font-black text-white shadow-2xl shadow-primary/30 shrink-0">
              {worker.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-4">
                <h2 className="text-3xl font-black tracking-tighter text-foreground">{worker.name}</h2>
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                   <Award size={14} />
                   <span className="text-[10px] font-black uppercase tracking-widest">Score: 94%</span>
                </div>
                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] ${
                  worker.status === 'Authorized' || worker.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                }`}>
                  {worker.status}
                </span>
              </div>
              <p className="caption mt-3 flex items-center gap-2">
                <Briefcase size={12} className="text-primary" /> {worker.job_role || worker.role} • <span className="text-foreground/60">{worker.id}</span> • <span className="text-emerald-600 font-bold">Reliability: High</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 absolute top-6 right-6 md:static">
            <button className="btn-secondary gap-3 px-6 hidden md:flex">
              <Download size={18} /> Export Dossier
            </button>
            <button 
              onClick={onClose}
              className="p-3 bg-card border border-border rounded-xl text-muted-foreground hover:bg-secondary transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-10 md:p-12 custom-scrollbar space-y-16 bg-background/30">
          {sections.map((section) => (
            <div key={section.id} className="space-y-8">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                  <section.icon size={22} />
                </div>
                <h3 className="text-sm font-black tracking-[0.25em] uppercase text-foreground/40">{section.title}</h3>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {section.fields.map((field, i) => (
                  <div key={i} className={`${field.fullWidth ? 'md:col-span-2 lg:col-span-3' : ''} space-y-3`}>
                    <label className="caption ml-1">{field.label}</label>
                    <div className="flex items-center gap-4 p-5 bg-secondary/40 rounded-[1.5rem] border border-transparent hover:border-primary/20 transition-all group shadow-sm">
                      {field.icon && <field.icon size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />}
                      <span className="text-sm font-bold text-foreground/90">{field.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Documents Section */}
          <div className="space-y-8">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shadow-sm">
                <FileText size={22} />
              </div>
              <h3 className="text-sm font-black tracking-[0.25em] uppercase text-foreground/40">Verified Documents</h3>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { name: 'PAN Card Copy', type: 'IMAGE/JPG', size: '1.2 MB', date: 'Oct 12, 2023' },
                { name: 'Aadhaar Verification', type: 'PDF', size: '2.4 MB', date: 'Oct 12, 2023' },
                { name: 'Experience Certificate', type: 'PDF', size: '4.1 MB', date: 'Oct 14, 2023' },
                { name: 'Bank Passbook Front', type: 'IMAGE/PNG', size: '0.8 MB', date: 'Oct 15, 2023' },
              ].map((doc, i) => (
                <div key={i} className="p-6 bg-card border border-border rounded-[2rem] flex items-center justify-between group hover:border-primary/30 transition-all shadow-sm">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-secondary rounded-[1.25rem] flex items-center justify-center shadow-inner">
                      <FileText size={24} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-foreground">{doc.name}</p>
                      <p className="caption mt-1">{doc.type} • {doc.size}</p>
                    </div>
                  </div>
                  <button className="p-3 bg-secondary rounded-2xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all shadow-sm">
                    <Download size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-10 border-t border-border flex items-center justify-between bg-secondary/20 shrink-0">
          <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            <Clock size={16} className="text-primary/60" />
            Last modification: 2 hours ago • System Admin
          </div>
          <button 
            onClick={onClose}
            className="btn-primary px-12 py-4 shadow-xl"
          >
            Close Dossier
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default WorkerDetailsModal;
