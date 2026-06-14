import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, Plus, Search, Filter, TrendingDown, 
  TrendingUp, Activity, PieChart, DollarSign, ArrowDownRight, ArrowUpRight, Trash2,
  Calendar, FileText, Layout, X, Building2, Briefcase
} from 'lucide-react';
import axios from 'axios';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import SuccessModal from '../components/SuccessModal';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [profitability, setProfitability] = useState([]);
  const [clients, setClients] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState({
    client_id: '', assignment_id: '', category: 'Site Operations', amount: '', date: new Date().toISOString().split('T')[0], description: ''
  });

  // Delete States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [expRes, profitRes, clientRes, assignmentRes] = await Promise.all([
        axios.get('/api/expenses'),
        axios.get('/api/expenses/profitability'),
        axios.get('/api/clients'),
        axios.get('/api/assignments')
      ]);
      setExpenses(expRes.data);
      setProfitability(profitRes.data);
      setClients(clientRes.data);
      setAssignments(assignmentRes.data);
    } catch (err) {
      console.error('Failed to fetch expense data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        client_id: formData.client_id ? parseInt(formData.client_id) : null,
        assignment_id: formData.assignment_id ? parseInt(formData.assignment_id) : null,
        amount: parseFloat(formData.amount)
      };
      
      await axios.post('/api/expenses', payload);
      setShowModal(false);
      setShowSuccessModal(true);
      setFormData({
        client_id: '', assignment_id: '', category: 'Site Operations', amount: '', 
        date: new Date().toISOString().split('T')[0], description: ''
      });
      fetchData();
    } catch (err) {
      console.error('Failed to record expense');
    }
  };

  const initiateDelete = (expense) => {
    setItemToDelete(expense);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/api/expenses/${itemToDelete.id}`);
      fetchData();
      setShowDeleteModal(false);
    } catch (err) {
      console.error('Deletion failed');
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Operational Expenses</h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">Tracking Burn Rates & Profitability across Global Nodes</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} /> Log Disbursement
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="card-premium p-6 border-rose-500/10 bg-rose-500/5">
                  <p className="caption mb-2 text-rose-600">Monthly Burn</p>
                  <h3 className="text-2xl font-black text-rose-700">₹ {expenses.reduce((a,b) => a+b.amount, 0).toLocaleString()}</h3>
                  <p className="text-[10px] font-black uppercase text-rose-500 mt-1 flex items-center gap-1">
                     <ArrowUpRight size={12} /> Actual Outflow
                  </p>
               </div>
               <div className="card-premium p-6 border-emerald-500/10 bg-emerald-500/5">
                  <p className="caption mb-2 text-emerald-600">Net Revenue</p>
                  <h3 className="text-2xl font-black text-emerald-700">₹ {profitability.reduce((a,b) => a+b.revenue, 0).toLocaleString()}</h3>
                  <p className="text-[10px] font-black uppercase text-emerald-500 mt-1 flex items-center gap-1">
                     <TrendingUp size={12} /> Invoiced Capital
                  </p>
               </div>
               <div className="card-premium p-6 border-primary/10 bg-primary/5">
                  <p className="caption mb-2 text-primary">Est. Profit</p>
                  <h3 className="text-2xl font-black text-primary">₹ {profitability.reduce((a,b) => a+b.profit, 0).toLocaleString()}</h3>
                  <p className="text-[10px] font-black uppercase text-primary mt-1 flex items-center gap-1">
                     <Activity size={12} /> Efficiency Rate
                  </p>
               </div>
            </div>

            <div className="card-premium overflow-hidden">
               <div className="p-6 border-b border-border bg-secondary/10 flex justify-between items-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Recent Disbursements</p>
               </div>
               <div className="divide-y divide-border">
                  {expenses.map((exp) => (
                    <div key={exp.id} className="p-6 flex items-center justify-between hover:bg-secondary/20 transition-all group">
                       <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-secondary text-rose-600">
                             <TrendingDown size={20} />
                          </div>
                           <div>
                              <p className="text-sm font-black text-foreground">{exp.category}</p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase">{exp.client_name || 'Global Overhead'}</p>
                           </div>
                       </div>
                       <div className="flex items-center gap-6">
                          <div className="text-right">
                             <p className="text-sm font-black text-rose-600">- ₹ {exp.amount.toLocaleString()}</p>
                             <p className="text-[10px] font-bold text-muted-foreground uppercase">{new Date(exp.date).toLocaleDateString()}</p>
                          </div>
                          <button 
                            onClick={() => initiateDelete(exp)}
                            className="p-3 bg-secondary rounded-xl text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                          >
                             <Trash2 size={16} />
                          </button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>

         <div className="lg:col-span-4 space-y-8">
            <div className="card-premium p-8 group overflow-hidden relative">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-all" />
               <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                  <PieChart className="text-primary" size={20} /> Client Profitability Matrix
               </h3>
               <div className="space-y-8">
                  {profitability.map((p, i) => (
                    <div key={i} className="space-y-4">
                       <div className="flex justify-between items-end">
                          <div className="space-y-1">
                             <p className="text-sm font-black text-foreground">{p.client_name}</p>
                             <div className="flex items-center gap-4">
                                <p className="text-[10px] font-black text-emerald-600 uppercase">Rev: ₹{p.revenue.toLocaleString()}</p>
                                <p className="text-[10px] font-black text-rose-500 uppercase">Cost: ₹{p.total_costs.toLocaleString()}</p>
                             </div>
                          </div>
                          <div className={`text-right space-y-1`}>
                             <p className={`text-sm font-black ${p.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {p.profit >= 0 ? '+' : ''} ₹{p.profit.toLocaleString()}
                             </p>
                             <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">NET PROFIT</p>
                          </div>
                       </div>
                       <div className="h-2 w-full bg-secondary rounded-full overflow-hidden flex shadow-inner">
                          <div 
                            className={`h-full transition-all duration-1000 ${p.profit >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                            style={{ width: `${Math.min(100, Math.max(5, (p.revenue ? (p.profit / p.revenue) * 100 : 0)))}%` }} 
                          />
                       </div>
                    </div>
                  ))}
                  {profitability.length === 0 && (
                    <p className="text-center py-10 text-xs font-black text-muted-foreground uppercase tracking-widest">No site profitability data available</p>
                  )}
               </div>
            </div>

            <div className="card-premium p-8 bg-primary text-white">
               <h3 className="text-xl font-black mb-4">Strategic Review</h3>
               <p className="text-sm font-medium opacity-80 leading-relaxed mb-8">
                  Your operational burn rate is within the projected 15% margin. Site-wise profitability is showing a positive trend across 4 of 5 active nodes.
               </p>
               <button className="w-full py-4 bg-white text-primary rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20">
                  Generate Q2 Report
               </button>
            </div>
         </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            className="bg-card border border-border rounded-[2.5rem] shadow-2xl max-w-2xl w-full overflow-hidden"
          >
            <div className="p-10 bg-secondary/30 border-b border-border flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                     <TrendingDown size={28} />
                  </div>
                  <div>
                     <h2 className="text-2xl font-black tracking-tight text-foreground">Disbursement Entry</h2>
                     <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] mt-1">Operational Outflow Authorization</p>
                  </div>
               </div>
               <button onClick={() => setShowModal(false)} className="p-3 hover:bg-secondary rounded-xl transition-colors">
                  <X size={20} className="text-muted-foreground" />
               </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Building2 size={14} className="text-primary" /> Linked Client Partner
                  </label>
                  <div className="relative">
                    <select 
                      className="input-field w-full appearance-none bg-secondary/50 border-2 focus:border-primary/50 transition-all py-4 pl-4" 
                      value={formData.client_id} 
                      onChange={e => setFormData({...formData, client_id: e.target.value})}
                    >
                      <option value="">Global/Administrative Overhead</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Briefcase size={14} className="text-primary" /> Operational Site
                  </label>
                  <select 
                    className="input-field w-full appearance-none bg-secondary/50 border-2 focus:border-primary/50 transition-all py-4 pl-4" 
                    value={formData.assignment_id} 
                    onChange={e => setFormData({...formData, assignment_id: e.target.value})}
                    disabled={!formData.client_id}
                  >
                    <option value="">Select a site (Optional)</option>
                    {assignments.filter(a => a.client_id == formData.client_id).map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-8 bg-secondary/20 border border-border rounded-[2rem] space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <Layout size={14} className="text-primary" /> Expense Category
                    </label>
                    <select 
                      required 
                      className="input-field w-full appearance-none bg-background py-4 pl-4" 
                      value={formData.category} 
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                       <option>Site Operations</option>
                       <option>Travel & Logistics</option>
                       <option>Materials & Gear</option>
                       <option>Administrative</option>
                       <option>Emergency Fund</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <DollarSign size={14} className="text-primary" /> Amount (INR)
                    </label>
                    <div className="relative">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-muted-foreground/40 text-lg">₹</span>
                       <input 
                         type="number" 
                         required 
                         className="input-field w-full pl-10 py-4 bg-background font-black text-lg" 
                         placeholder="0.00"
                         value={formData.amount} 
                         onChange={e => setFormData({...formData, amount: e.target.value})} 
                       />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={14} className="text-primary" /> Disbursement Date
                  </label>
                  <input 
                    type="date" 
                    required 
                    className="input-field w-full bg-background py-4 pl-4" 
                    value={formData.date} 
                    onChange={e => setFormData({...formData, date: e.target.value})} 
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <FileText size={14} className="text-primary" /> Strategic Description
                </label>
                <textarea 
                  className="input-field w-full min-h-[120px] bg-secondary/30 py-4 px-4 resize-none" 
                  placeholder="Provide operational context for this outflow..."
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                />
              </div>

              <div className="pt-8 border-t border-border flex justify-end gap-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-8 py-4 text-xs font-black text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest"
                >
                  Discard
                </button>
                <button 
                  type="submit" 
                  className="px-10 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                >
                  Confirm Entry
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
        itemName={`${itemToDelete?.category} - ₹${itemToDelete?.amount.toLocaleString()}`}
        loading={isDeleting}
        title="Confirm Disbursement Deletion"
        description="Are you sure you want to permanently delete this disbursement record? This will affect site profitability metrics."
      />

      <SuccessModal 
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Disbursement Recorded"
        message="The operational expense has been successfully logged and site profitability metrics updated."
      />
    </div>
  );
};

export default Expenses;
