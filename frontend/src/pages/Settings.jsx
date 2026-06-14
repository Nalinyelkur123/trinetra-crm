import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Bell, Building, Save, Loader2, Database, 
  Globe, Mail, Clock, ShieldCheck, Lock, Cloud,
  RefreshCw, CheckCircle2
} from 'lucide-react';
import axios from 'axios';
import SuccessModal from '../components/SuccessModal';
import ActionConfirmationModal from '../components/ActionConfirmationModal';

const Settings = () => {
  const [settings, setSettings] = useState({
    company_name: '',
    timezone: 'IST (UTC+5:30)',
    auto_attendance: true,
    registry_lock: false,
    retention_period: '365 Days',
    notification_email: '',
    backup_frequency: 'Daily',
    security_2fa: false
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [activeSection, setActiveSection] = useState('general');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get('/api/settings');
        if (res.data && Object.keys(res.data).length > 0) {
          setSettings(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setShowConfirmModal(false);
    setSaving(true);
    try {
      await axios.post('/api/settings', settings);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Failed to update settings');
    } finally {
      setTimeout(() => setSaving(false), 800);
    }
  };

  const sections = [
    { id: 'general', title: 'Organization', icon: Building, color: 'text-primary', bg: 'bg-primary/10' },
    { id: 'security', title: 'Governance', icon: Shield, color: 'text-amber-600', bg: 'bg-amber-500/10' },
    { id: 'notifications', title: 'Communication', icon: Bell, color: 'text-rose-600', bg: 'bg-rose-500/10' },
    { id: 'cloud', title: 'Cloud & Data', icon: Cloud, color: 'text-indigo-600', bg: 'bg-indigo-500/10' },
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <Loader2 className="animate-spin text-primary" size={48} />
      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Initializing Protocols...</p>
    </div>
  );

  return (
    <div className="space-y-10 max-w-[1100px] mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Governance Hub</h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">Global System Configuration & Protocol Management</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end mr-4">
            <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Protocol Status</p>
            <p className="text-xs font-medium text-muted-foreground">Encrypted & Synchronized</p>
          </div>
          <button 
            onClick={() => setShowConfirmModal(true)}
            disabled={saving}
            className="flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={16} /> Synchronizing...
              </>
            ) : (
              <>
                <Save size={16} /> Commit Configuration
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-3">
           {sections.map((s) => (
             <button 
               key={s.id} 
               onClick={() => setActiveSection(s.id)}
               className={`w-full flex items-center gap-4 p-5 rounded-3xl transition-all border ${
                 activeSection === s.id 
                 ? 'bg-card border-border shadow-lg shadow-black/5 text-primary scale-[1.02]' 
                 : 'bg-transparent border-transparent text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
               }`}
             >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                  activeSection === s.id ? s.bg : 'bg-secondary'
                }`}>
                  <s.icon size={20} />
                </div>
                <span className="text-xs font-black uppercase tracking-widest">{s.title}</span>
             </button>
           ))}
           
           <div className="mt-10 p-6 rounded-[2rem] bg-secondary/20 border border-border/50">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Core Metadata</p>
              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-muted-foreground">Version</span>
                    <span className="text-[10px] font-black text-foreground">v2.4.1-Stable</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-muted-foreground">Last Audit</span>
                    <span className="text-[10px] font-black text-foreground">2h ago</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {activeSection === 'general' && (
                <div className="card-premium p-10 space-y-12">
                  <div className="flex items-center gap-4 pb-6 border-b border-border/50">
                    <div className="w-14 h-14 bg-primary/10 text-primary rounded-[1.5rem] flex items-center justify-center shadow-inner">
                      <Building size={28} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black tracking-tight">Organization Profile</h3>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-0.5">Primary Entity Credentials</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <label className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                        <Building size={12} className="text-primary" /> Company Entity Name
                      </label>
                      <input 
                        type="text" 
                        className="w-full input-field py-4 px-6 text-sm font-bold"
                        placeholder="Trinetra Workforce Solutions"
                        value={settings.company_name}
                        onChange={(e) => setSettings({...settings, company_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                        <Globe size={12} className="text-primary" /> Operational Timezone
                      </label>
                      <div className="relative group">
                        <select 
                          className="w-full input-field py-4 px-6 text-sm font-bold appearance-none bg-transparent cursor-pointer"
                          value={settings.timezone}
                          onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                        >
                          <option value="IST (UTC+5:30)">IST (UTC+5:30) - Mumbai, Delhi</option>
                          <option value="GMT (UTC+0:00)">GMT (UTC+0:00) - London, Reykjavik</option>
                          <option value="EST (UTC-5:00)">EST (UTC-5:00) - New York, Toronto</option>
                        </select>
                        <Clock className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none group-hover:text-primary transition-colors" size={18} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'security' && (
                <div className="card-premium p-10 space-y-10">
                  <div className="flex items-center gap-4 pb-6 border-b border-border/50">
                    <div className="w-14 h-14 bg-amber-500/10 text-amber-600 rounded-[1.5rem] flex items-center justify-center shadow-inner">
                      <ShieldCheck size={28} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black tracking-tight">Governance Protocols</h3>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-0.5">Administrative Guardrails</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {[
                      { id: 'auto_attendance', label: 'Automated Attendance Protocol', desc: 'Enable location-based automated personnel logging via Trinetra Core.', state: settings.auto_attendance, icon: Clock },
                      { id: 'registry_lock', label: 'Workforce Registry Lock', desc: 'Restrict manual personnel record modifications to prevent ledger tampering.', state: settings.registry_lock, icon: Lock },
                      { id: 'security_2fa', label: 'Dual-Factor Authentication', desc: 'Enforce high-security biometric or OTP verification for administrative access.', state: settings.security_2fa, icon: Shield },
                    ].map((toggle) => (
                      <div key={toggle.id} className="flex items-center justify-between p-8 rounded-3xl bg-secondary/20 border border-border/50 hover:border-primary/30 transition-all group">
                        <div className="flex items-center gap-6">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${toggle.state ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                            <toggle.icon size={22} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-foreground uppercase tracking-wider">{toggle.label}</p>
                            <p className="text-xs text-muted-foreground mt-1 font-medium leading-relaxed max-w-md">{toggle.desc}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setSettings({...settings, [toggle.id]: !toggle.state})}
                          className={`w-16 h-9 rounded-full p-1.5 transition-all relative ${toggle.state ? 'bg-primary' : 'bg-secondary'}`}
                        >
                          <div className={`w-6 h-6 bg-white rounded-full transition-all shadow-lg ${toggle.state ? 'translate-x-7' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === 'notifications' && (
                <div className="card-premium p-10 space-y-10">
                   <div className="flex items-center gap-4 pb-6 border-b border-border/50">
                    <div className="w-14 h-14 bg-rose-500/10 text-rose-600 rounded-[1.5rem] flex items-center justify-center shadow-inner">
                      <Bell size={28} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black tracking-tight">Communication Nodes</h3>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-0.5">System Alert Distribution</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-4">
                      <label className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                        <Mail size={12} className="text-rose-600" /> Primary Notification Node
                      </label>
                      <input 
                        type="email" 
                        className="w-full input-field py-4 px-6 text-sm font-bold"
                        placeholder="admin@trinetraworkforce.com"
                        value={settings.notification_email || ''}
                        onChange={(e) => setSettings({...settings, notification_email: e.target.value})}
                      />
                      <p className="text-[10px] text-muted-foreground font-medium italic">Receives critical system failures and security audit logs.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'cloud' && (
                <div className="card-premium p-10 space-y-10">
                   <div className="flex items-center gap-4 pb-6 border-b border-border/50">
                    <div className="w-14 h-14 bg-indigo-500/10 text-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-inner">
                      <Database size={28} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black tracking-tight">Infrastructure Assets</h3>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-0.5">Ledger Persistence & Backups</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <label className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                        <RefreshCw size={12} className="text-indigo-600" /> Backup Synchronicity
                      </label>
                      <select 
                        className="w-full input-field py-4 px-6 text-sm font-bold"
                        value={settings.backup_frequency || 'Daily'}
                        onChange={(e) => setSettings({...settings, backup_frequency: e.target.value})}
                      >
                        <option value="Real-time">Real-time (High Load)</option>
                        <option value="Daily">Daily Operational (Default)</option>
                        <option value="Weekly">Weekly Strategic</option>
                      </select>
                    </div>
                    <div className="space-y-4">
                      <label className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                        <Database size={12} className="text-indigo-600" /> Audit Retention Protocol
                      </label>
                      <select 
                        className="w-full input-field py-4 px-6 text-sm font-bold"
                        value={settings.retention_period}
                        onChange={(e) => setSettings({...settings, retention_period: e.target.value})}
                      >
                        <option value="90 Days">90 Days (Statutory Min)</option>
                        <option value="365 Days">365 Days (Standard)</option>
                        <option value="5 Years">5 Years (Compliance Max)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-12 p-8 rounded-[2.5rem] bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-6">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shadow-inner">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <p className="text-sm font-black text-emerald-600 uppercase tracking-[0.2em]">Governance Integrity Verified</p>
              <p className="text-xs text-emerald-600/70 font-medium mt-1 leading-relaxed">
                The current configuration is aligned with Trinetra Strategic Protocols. Last synchronized: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <SuccessModal 
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
      />

      <ActionConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleSave}
        title="Update Global Protocols"
        description="Are you sure you want to commit these changes to the global system settings? This will affect all operational modules."
        confirmText="Commit Changes"
        variant="primary"
      />
    </div>
  );
};

export default Settings;
