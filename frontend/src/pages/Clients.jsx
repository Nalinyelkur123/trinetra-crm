import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, Mail, Phone, User, MapPin, Search, Plus, 
  RefreshCw, MoreVertical, Edit2, Trash2, ShieldCheck, Globe, DollarSign,
  Users, Clock, AlertCircle
} from 'lucide-react';
import axios from 'axios';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', contact_person: '',
    address: '', contract_terms: '', billing_rate: '', gst_number: '',
    agreement_start: '', agreement_end: '', payment_terms: 'Net 30', status: 'active',
    shift_start: '09:00', shift_end: '18:00', working_hours: 8.0
  });
  const [selectedWorkforce, setSelectedWorkforce] = useState([]);
  const [showWorkforceModal, setShowWorkforceModal] = useState(false);
  const [activeClientName, setActiveClientName] = useState('');
  
  // Delete States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/clients');
      setClients(res.data);
    } catch (err) {
      console.error('Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await axios.put(`/api/clients/${editingClient.id}`, formData);
      } else {
        await axios.post('/api/clients', formData);
      }
      setShowModal(false);
      setEditingClient(null);
      setFormData({ name: '', email: '', phone: '', contact_person: '', address: '', contract_terms: '', billing_rate: '', gst_number: '' });
      fetchClients();
    } catch (err) {
      alert('Operation failed');
    }
  };

  const fetchWorkforce = async (clientId, clientName) => {
    try {
      const res = await axios.get(`/api/clients/${clientId}/workforce`);
      setSelectedWorkforce(res.data);
      setActiveClientName(clientName);
      setShowWorkforceModal(true);
    } catch (err) {
      console.error('Failed to fetch workforce');
    }
  };

  const initiateDelete = (client) => {
    setItemToDelete(client);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/api/clients/${itemToDelete.id}`);
      fetchClients();
      setShowDeleteModal(false);
    } catch (err) {
      alert('Termination failed. Ensure all dependencies are cleared.');
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.contact_person.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* ... header ... */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">Client Ledger</h1>
          <p className="text-sm text-muted-foreground mt-2 font-medium">Global Contract Architecture & Strategic Partners</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search strategic partners..." 
              className="bg-secondary/40 border border-border/50 rounded-2xl pl-12 pr-6 py-4 text-sm w-80 focus:bg-white dark:focus:bg-secondary focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => { setEditingClient(null); setShowModal(true); }}
            className="flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={20} /> Initialize Partnership
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-80 card-premium animate-pulse" />)
        ) : (
          filteredClients.map((client) => (
            <motion.div 
              key={client.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -8, shadow: '0 25px 50px -12px rgba(0,0,0,0.1)' }}
              className="group relative bg-white dark:bg-card border border-border/60 rounded-[2.5rem] p-10 transition-all duration-500 overflow-hidden"
            >
              {/* Decorative Background Blob */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
              
              {/* Action Toolbar (Hover Only) */}
              <div className="absolute top-8 right-8 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                 <button onClick={() => { setEditingClient(client); setFormData(client); setShowModal(true); }} className="p-3 bg-white dark:bg-secondary rounded-2xl shadow-xl shadow-black/5 hover:text-primary hover:scale-110 transition-all">
                    <Edit2 size={16} />
                 </button>
                  <button 
                    onClick={() => initiateDelete(client)}
                    className="p-3 bg-white dark:bg-secondary rounded-2xl shadow-xl shadow-black/5 hover:text-destructive hover:scale-110 transition-all"
                  >
                     <Trash2 size={16} />
                  </button>
              </div>

              <div className="flex items-start gap-6 mb-10">
                <div className="w-20 h-20 rounded-[2rem] bg-primary/5 text-primary flex items-center justify-center font-black text-3xl shadow-inner border border-primary/10">
                   {client.name[0]}
                </div>
                <div className="pt-2">
                  <h3 className="text-2xl font-black tracking-tighter text-foreground group-hover:text-primary transition-colors">{client.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                     <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                     <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Active Partnership</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-10">
                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Primary Contact</p>
                    <p className="text-sm font-bold text-foreground/80 truncate">{client.contact_person}</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Deployment</p>
                    <p className="text-sm font-black text-primary">{client.worker_count} Personnel</p>
                 </div>
                 <div className="space-y-1 col-span-2">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Digital HQ</p>
                    <div className="flex items-center gap-2 mt-1">
                       <Mail size={14} className="text-primary/40" />
                       <p className="text-sm font-medium text-foreground/60 truncate">{client.email}</p>
                    </div>
                 </div>
              </div>

              {/* Strategic Capacity visualization */}
              <div className="space-y-3 mb-10">
                 <div className="flex justify-between items-end">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">Strategic Load Capacity</p>
                    <span className="text-xs font-black text-primary">{((client.worker_count / 50) * 100).toFixed(0)}%</span>
                 </div>
                 <div className="h-2.5 w-full bg-secondary/50 rounded-full overflow-hidden border border-border/50 p-0.5">
                    <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${Math.min(((client.worker_count / 50) * 100), 100)}%` }}
                       className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.3)]" 
                    />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => fetchWorkforce(client.id, client.name)}
                  className="flex items-center justify-center gap-3 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Users size={16} /> Workforce
                </button>
                <button className="flex items-center justify-center gap-3 py-4 bg-secondary text-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-border transition-all">
                  <MapPin size={16} /> Site Intel
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Workforce Modal */}
      {showWorkforceModal && (
        <div className="modal-overlay">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            className="modal-content max-w-4xl p-12 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-10 pb-6 border-b border-border">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                     <Users size={24} />
                  </div>
                  <div>
                     <h2 className="text-2xl font-black tracking-tight">{activeClientName} Workforce</h2>
                     <p className="caption mt-0.5">Personnel Schedule & Shift Matrix</p>
                  </div>
               </div>
               <button onClick={() => setShowWorkforceModal(false)} className="p-2 bg-secondary rounded-xl hover:text-rose-500 transition-colors">
                  <Plus className="rotate-45" size={24} />
               </button>
            </div>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar">
               <div className="grid grid-cols-12 px-6 py-3 bg-secondary/50 rounded-xl mb-4">
                  <div className="col-span-4 caption">Employee</div>
                  <div className="col-span-3 caption">Role / Site</div>
                  <div className="col-span-3 caption">Shift Timing</div>
                  <div className="col-span-2 caption text-right">Hrs/Day</div>
               </div>
               {selectedWorkforce.map((worker, i) => (
                  <div key={i} className="grid grid-cols-12 items-center px-6 py-5 bg-card border border-border rounded-2xl hover:bg-secondary/20 transition-all">
                     <div className="col-span-4">
                        <p className="text-sm font-black text-foreground">{worker.name}</p>
                        <p className="text-[10px] font-bold text-muted-foreground">{worker.phone}</p>
                     </div>
                     <div className="col-span-3">
                        <p className="text-xs font-bold text-foreground/80">{worker.job_role}</p>
                        <p className="text-[10px] font-black text-primary uppercase">{worker.assignment_name || 'General'}</p>
                     </div>
                     <div className="col-span-3">
                        <div className="flex items-center gap-2">
                           <Clock className="text-primary" size={14} />
                           <span className="text-xs font-black text-foreground">{worker.shift_start || '09:00'} - {worker.shift_end || '18:00'}</span>
                        </div>
                     </div>
                     <div className="col-span-2 text-right">
                        <span className="text-xs font-black text-primary bg-primary/10 px-3 py-1 rounded-lg">
                           {worker.working_hours || '8.0'} Hrs
                        </span>
                     </div>
                  </div>
               ))}
               {selectedWorkforce.length === 0 && (
                  <div className="py-20 text-center">
                     <AlertCircle className="mx-auto text-muted-foreground/30 mb-4" size={48} />
                     <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No workforce assigned to this strategic partner.</p>
                  </div>
               )}
            </div>

            <div className="mt-10 pt-6 border-t border-border flex justify-end">
               <button onClick={() => setShowWorkforceModal(false)} className="btn-primary px-10">Dismiss Registry</button>
            </div>
          </motion.div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            className="modal-content max-w-2xl p-12 overflow-y-auto max-h-[90vh] custom-scrollbar"
          >
            <div className="flex items-center gap-4 mb-10 pb-6 border-b border-border">
               <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                  <Building2 size={24} />
               </div>
               <div>
                  <h2 className="text-2xl font-black tracking-tight">{editingClient ? 'Refine Partnership' : 'Initialize Partnership'}</h2>
                  <p className="caption mt-0.5">Strategic Account Configuration</p>
               </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="caption ml-1">Client Name</label>
                <div className="relative">
                   <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={18} />
                   <input required className="input-field w-full pl-12" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Corporation Name" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="caption ml-1">Contact Person</label>
                <div className="relative">
                   <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={18} />
                   <input required className="input-field w-full pl-12" value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} placeholder="Primary Liaison" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="caption ml-1">Email Address</label>
                <div className="relative">
                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={18} />
                   <input type="email" required className="input-field w-full pl-12" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="billing@client.com" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="caption ml-1">Phone Number</label>
                <div className="relative">
                   <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={18} />
                   <input required className="input-field w-full pl-12" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+91 00000 00000" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="caption ml-1">Billing Rate (per day)</label>
                <div className="relative">
                   <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={18} />
                   <input type="number" required className="input-field w-full pl-12" value={formData.billing_rate} onChange={e => setFormData({...formData, billing_rate: e.target.value})} placeholder="0.00" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="caption ml-1">GST Number</label>
                <div className="relative">
                   <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={18} />
                   <input className="input-field w-full pl-12" value={formData.gst_number} onChange={e => setFormData({...formData, gst_number: e.target.value})} placeholder="GSTINXXXXXXXXXXX" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="caption ml-1 text-primary">Agreement Start</label>
                <input type="date" required className="input-field w-full" value={formData.agreement_start} onChange={e => setFormData({...formData, agreement_start: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="caption ml-1 text-primary">Agreement End</label>
                <input type="date" required className="input-field w-full" value={formData.agreement_end} onChange={e => setFormData({...formData, agreement_end: e.target.value})} />
              </div>
              <div className="md:col-span-2 mt-6 mb-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary/60 border-b border-primary/10 pb-2 flex items-center gap-2">
                  <Clock size={14} /> Operational Schedule (Client Default)
                </h4>
              </div>
              <div className="space-y-2">
                <label className="caption ml-1">Default Shift Start</label>
                <input type="time" className="input-field w-full" value={formData.shift_start} onChange={e => setFormData({...formData, shift_start: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="caption ml-1">Default Shift End</label>
                <input type="time" className="input-field w-full" value={formData.shift_end} onChange={e => setFormData({...formData, shift_end: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="caption ml-1">Working Hours</label>
                <input type="number" step="0.5" className="input-field w-full" value={formData.working_hours} onChange={e => setFormData({...formData, working_hours: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="caption ml-1">Payment Terms</label>
                <select className="input-field w-full appearance-none" value={formData.payment_terms} onChange={e => setFormData({...formData, payment_terms: e.target.value})}>
                   <option value="Net 15">Net 15</option>
                   <option value="Net 30">Net 30</option>
                   <option value="Net 45">Net 45</option>
                   <option value="Due on Receipt">Due on Receipt</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="caption ml-1">Partnership Status</label>
                <select className="input-field w-full appearance-none" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                   <option value="active">Active</option>
                   <option value="inactive">Inactive</option>
                   <option value="on-hold">On-hold</option>
                </select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="caption ml-1">Headquarters Address</label>
                <div className="relative">
                   <MapPin className="absolute left-4 top-4 text-muted-foreground/50" size={18} />
                   <textarea className="input-field w-full pl-12 min-h-[100px] resize-none pt-4" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Full registered office address..." />
                </div>
              </div>
              <div className="md:col-span-2 flex justify-end gap-4 mt-8 pt-6 border-t border-border">
                <button type="button" onClick={() => setShowModal(false)} className="px-10 py-4 bg-secondary text-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Cancel</button>
                <button type="submit" className="px-12 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all">Establish Contract</button>
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
        title="Confirm Partnership Termination"
        description="Are you sure you want to terminate the partnership with {itemName}? This will affect all associated workforce assignments and site deployments."
      />
    </div>
  );
};

export default Clients;
