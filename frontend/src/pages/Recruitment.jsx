import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, UploadCloud, ShieldCheck, Mail, Phone, Users, 
  ArrowRight, CheckCircle2, FileText, Briefcase, RefreshCw, Filter, Search, Trash2, Calculator, Edit3
} from 'lucide-react';
import axios from 'axios';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import Pagination from '../components/Pagination';

const Recruitment = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [candidateForm, setCandidateForm] = useState({ name: '', email: '', phone: '', job_role: '' });
  const [isSubmittingCandidate, setIsSubmittingCandidate] = useState(false);

  // Delete States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/recruitment');
      setCandidates(res.data || []);
    } catch (err) {
      console.error('Failed to fetch candidates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleCreateCandidate = async (e) => {
    e.preventDefault();
    if (!candidateForm.name) {
      alert('Please enter a candidate name');
      return;
    }
    setIsSubmittingCandidate(true);
    try {
      await axios.post('/api/recruitment', candidateForm);
      setShowAddModal(false);
      setCandidateForm({ name: '', email: '', phone: '', job_role: '' });
      fetchCandidates();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add candidate');
    } finally {
      setIsSubmittingCandidate(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`/api/recruitment/${id}/status`, { status });
      fetchCandidates();
    } catch (err) {
      alert('Failed to update candidate status');
    }
  };

  const initiateDelete = (candidate) => {
    setItemToDelete(candidate);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/api/recruitment/${itemToDelete.id}`);
      fetchCandidates();
      setShowDeleteModal(false);
    } catch (err) {
      alert('Termination failed');
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  const downloadTemplate = () => {
    const headers = ['Full Name', 'Email', 'Phone', 'Job Role', 'Applied Date'];
    const sampleData = [
      ['Rahul Sharma', 'rahul@example.com', '+919876543210', 'Security Officer', '2026-05-01'],
      ['Priya Singh', 'priya@example.com', '+918765432109', 'Supervisor', '2026-05-02']
    ];
    const csvContent = [headers.join(","), ...sampleData.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "recruitment_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length <= 1) {
        alert('Spreadsheet is empty or only contains header columns.');
        return;
      }
      
      let imported = 0;
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(s => s.trim().replace(/^"|"$/g, ''));
        if (parts.length >= 1 && parts[0]) {
          await axios.post('/api/recruitment', {
            name: parts[0],
            email: parts[1] || '',
            phone: parts[2] || '',
            job_role: parts[3] || 'Staff'
          });
          imported++;
        }
      }
      alert(`Bulk ingestion complete: ${imported} candidate profile(s) deployed to recruitment pipeline.`);
      fetchCandidates();
    } catch (err) {
      alert('Failed to parse spreadsheet file.');
    }
  };

  const filteredCandidates = candidates.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.job_role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
  const paginatedCandidates = filteredCandidates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="space-y-10 max-w-[1400px] mx-auto pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Recruitment Hub</h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">Workforce Scaling & Strategic Integration</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2 text-xs font-black uppercase tracking-widest px-6 shadow-lg shadow-primary/20"
          >
            <UserPlus size={18} /> Add Candidate
          </button>
          <button 
            onClick={() => navigate('/admin/workers/new')}
            className="btn-secondary flex items-center gap-2 text-xs font-black uppercase tracking-widest px-6"
          >
            <Users size={18} /> Onboard Worker
          </button>
          <button 
            onClick={fetchCandidates}
            className="p-3 bg-card border border-border rounded-xl text-muted-foreground hover:text-primary transition-all shadow-sm"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="card-premium overflow-hidden">
             <div className="p-8 border-b border-border bg-secondary/20 flex justify-between items-center">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                      <Users size={20} />
                   </div>
                   <div>
                      <h3 className="text-lg font-black tracking-tight">Active Candidate Pool</h3>
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Operational Personnel Pipeline</p>
                   </div>
                </div>
                <div className="relative group">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
                   <input 
                     type="text" 
                     placeholder="Search personnel..." 
                     className="input-field pl-12 py-3 text-xs w-64 bg-background"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                   />
                </div>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-secondary/10 border-b border-border">
                         <th className="px-8 py-6 caption">Candidate Detail</th>
                         <th className="px-8 py-6 caption">Strategic Role</th>
                         <th className="px-8 py-6 caption text-center">Status Matrix</th>
                         <th className="px-8 py-6 text-right caption">Operational Action</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-border">
                      {loading ? (
                        [...Array(3)].map((_, i) => (
                          <tr key={i} className="animate-pulse">
                            <td colSpan="4" className="px-8 py-8 bg-secondary/5" />
                          </tr>
                        ))
                      ) : paginatedCandidates.map((candidate) => (
                        <tr key={candidate.id} className="hover:bg-secondary/20 transition-all group">
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-black text-sm shadow-lg shadow-primary/20">
                                    {candidate.name[0]}
                                 </div>
                                 <div>
                                    <p className="text-sm font-black text-foreground">{candidate.name}</p>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">{candidate.email}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <div className="inline-flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-lg border border-border">
                                 <Briefcase size={12} className="text-primary" />
                                 <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    {candidate.job_role || 'General Staff'}
                                 </span>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <div className="flex justify-center">
                                 <select 
                                   value={candidate.status}
                                   onChange={(e) => updateStatus(candidate.id, e.target.value)}
                                   className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border-2 transition-all outline-none cursor-pointer shadow-sm ${
                                     candidate.status === 'Hired' ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/20' : 
                                     candidate.status === 'Rejected' ? 'bg-rose-500/5 text-rose-600 border-rose-500/20' : 'bg-amber-500/5 text-amber-600 border-amber-500/20'
                                   }`}
                                 >
                                   <option value="Screening">Screening Phase</option>
                                   <option value="Interview">Strategic Interview</option>
                                   <option value="KYC Pending">Identity Auth</option>
                                   <option value="Hired">Deployed/Active</option>
                                   <option value="Rejected">Rejected/Archived</option>
                                 </select>
                              </div>
                           </td>
                           <td className="px-8 py-6 text-right">
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button 
                                   onClick={() => navigate('/admin/workers/new')}
                                   className="p-3 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
                                   title="Onboard Candidate"
                                 >
                                    <ArrowRight size={18} />
                                 </button>
                                 <button 
                                   onClick={() => initiateDelete(candidate)}
                                   className="p-3 bg-rose-500/10 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                   title="Terminate Application"
                                 >
                                    <Trash2 size={18} />
                                 </button>
                              </div>
                           </td>
                        </tr>
                      ))}
                      {!loading && filteredCandidates.length === 0 && (
                        <tr>
                          <td colSpan="4" className="px-8 py-20 text-center">
                             <Users size={48} className="mx-auto text-muted-foreground/20 mb-4" />
                             <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Zero Personnel Matches Found</p>
                          </td>
                        </tr>
                      )}
                   </tbody>
                </table>
             </div>
              {!loading && filteredCandidates.length > 0 && (
                <div className="p-6 border-t border-border bg-secondary/5">
                   <Pagination 
                     currentPage={currentPage}
                     totalPages={totalPages}
                     onPageChange={setCurrentPage}
                     itemsPerPage={itemsPerPage}
                     onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
                     totalItems={filteredCandidates.length}
                   />
                </div>
              )}
          </div>

          <div className="card-premium p-10">
             <div className="flex items-center gap-3 mb-10">
                <ShieldCheck className="text-primary" size={24} />
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">Compliance Verification Protocol</h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                   { title: 'Identity Extraction', icon: ShieldCheck, desc: 'Real-time Govt ID parsing' },
                   { title: 'Background Scanning', icon: FileText, desc: 'Criminal & Credit check' },
                   { title: 'Financial Asset Verif', icon: CheckCircle2, desc: 'Bank account validation' },
                   { title: 'Operational Readiness', icon: Briefcase, desc: 'Skill-set verification' },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-5 p-4 rounded-2xl bg-secondary/30 border border-border/50 group hover:border-primary/30 transition-all">
                     <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shadow-sm group-hover:bg-emerald-500 group-hover:text-white transition-all">
                        <step.icon size={24} />
                     </div>
                     <div>
                        <p className="text-sm font-black text-foreground">{step.title}</p>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">{step.desc}</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        <div className="space-y-8">
           <div className="card-premium p-10 space-y-10">
              <div className="flex items-center gap-4">
                 <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                    <UploadCloud size={28} />
                 </div>
                 <div>
                    <h4 className="text-xl font-black tracking-tight">Bulk Ingestion</h4>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">High-Volume Scaling</p>
                 </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                 Deploy personnel assets at scale via automated spreadsheet mapping. Our system supports rapid operational deployment.
              </p>
              <button 
                onClick={downloadTemplate}
                className="btn-secondary w-full py-5 text-[10px] font-black uppercase tracking-[0.2em]"
              >
                 Download Sample Template
              </button>
              
              <label className="block w-full">
                 <input 
                   type="file" 
                   className="hidden" 
                   accept=".csv,.xlsx" 
                   onChange={handleFileUpload} 
                 />
                 <div className="border-2 border-dashed border-border rounded-3xl p-10 flex flex-col items-center justify-center text-center hover:bg-primary/5 hover:border-primary/30 transition-all cursor-pointer group">
                    <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                       <UploadCloud size={32} className="text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary">Deploy Spreadsheet</p>
                    <p className="text-[8px] font-black uppercase text-muted-foreground/50 mt-2">CSV or XLSX Files only</p>
                 </div>
              </label>
           </div>

           <div className="card-premium p-10 space-y-8">
              <div className="flex items-center gap-3">
                 <RefreshCw size={16} className="text-primary" />
                 <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Recruitment Intelligence</h4>
              </div>
              <div className="space-y-8">
                 {[
                   { label: 'Active Pipeline', value: candidates.length, color: 'bg-primary' },
                   { label: 'Evaluation Phase', value: candidates.filter(c => c.status === 'Screening' || c.status === 'Interview').length, color: 'bg-amber-500' },
                   { label: 'Asset Finalized', value: candidates.filter(c => c.status === 'Hired').length, color: 'bg-emerald-500' },
                 ].map((stat, i) => (
                   <div key={i} className="space-y-3">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                         <span className="text-muted-foreground">{stat.label}</span>
                         <span className="text-foreground">{stat.value} Personnel</span>
                      </div>
                      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${(stat.value / (candidates.length || 1)) * 100}%` }}
                           className={`h-full ${stat.color} shadow-[0_0_10px_rgba(0,0,0,0.1)]`} 
                         />
                      </div>
                   </div>
                 ))}
              </div>
           </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="modal-content max-w-lg p-8 custom-scrollbar"
          >
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground">Add Candidate</h3>
                  <p className="caption text-muted-foreground">Register candidate in recruitment pipeline</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-xl hover:bg-secondary">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCandidate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="caption">Candidate Full Name</label>
                <input 
                  required
                  placeholder="e.g. Ramesh Chandra"
                  className="input-field w-full py-2.5 text-xs font-bold"
                  value={candidateForm.name}
                  onChange={(e) => setCandidateForm({ ...candidateForm, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="caption">Email Address</label>
                  <input 
                    type="email"
                    placeholder="ramesh@example.com"
                    className="input-field w-full py-2.5 text-xs font-bold"
                    value={candidateForm.email}
                    onChange={(e) => setCandidateForm({ ...candidateForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="caption">Phone Number</label>
                  <input 
                    placeholder="+91 98765 43210"
                    className="input-field w-full py-2.5 text-xs font-bold"
                    value={candidateForm.phone}
                    onChange={(e) => setCandidateForm({ ...candidateForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="caption">Target Job Role</label>
                <input 
                  placeholder="e.g. Security Supervisor / Electrician"
                  className="input-field w-full py-2.5 text-xs font-bold"
                  value={candidateForm.job_role}
                  onChange={(e) => setCandidateForm({ ...candidateForm, job_role: e.target.value })}
                />
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary px-5 py-2.5 text-xs font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmittingCandidate}
                  className="btn-primary px-6 py-2.5 text-xs font-bold"
                >
                  {isSubmittingCandidate ? 'Registering...' : 'Add to Pipeline'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        itemName={itemToDelete?.name}
        loading={isDeleting}
        title="Terminate Application"
        description={`Are you sure you want to permanently terminate the recruitment application for ${itemToDelete?.name}? This action will archive their record.`}
      />
    </div>
  </div>
);
};

export default Recruitment;
