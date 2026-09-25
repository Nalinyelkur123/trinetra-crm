import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, Plus, Search, RefreshCw, CheckCircle2, 
  Clock, AlertCircle, Download, FileSpreadsheet, Filter, ArrowUpRight,
  X, Users, Activity, Calendar, Trash2, Calculator, Edit3, DollarSign
} from 'lucide-react';
import axios from 'axios';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

const Billing = () => {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isManual, setIsManual] = useState(false);
  const [formData, setFormData] = useState({
    client_id: '', assignment_id: '', issue_date: '', due_date: '',
    amount: 0, gst_amount: 0, total_amount: 0, status: 'pending'
  });

  const [searchTerm, setSearchTerm] = useState('');
  
  // Delete States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, clientRes, assignmentRes] = await Promise.all([
        axios.get('/api/invoices'),
        axios.get('/api/clients'),
        axios.get('/api/assignments')
      ]);
      setInvoices(invRes.data);
      setClients(clientRes.data);
      setAssignments(assignmentRes.data);
    } catch (err) {
      console.error('Failed to fetch billing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredInvoices = invoices.filter(inv => 
    inv.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.id?.toString().includes(searchTerm)
  );

  const handleCalculate = async () => {
    if (!formData.client_id || !formData.issue_date || !formData.due_date) {
      alert('Please select client and dates first');
      return;
    }
    try {
      const client = clients.find(c => (c.id === formData.client_id || c._id === formData.client_id));
      const rate = client?.billing_rate || 1000;
      
      const d1 = new Date(formData.issue_date);
      const d2 = new Date(formData.due_date);
      const diffTime = Math.abs(d2 - d1);
      const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      const days = diffDays > 0 && diffDays < 365 ? diffDays : 30;
      const workerCount = client?.worker_count || 1;
      
      const amount = (formData.amount && isManual) ? parseFloat(formData.amount) : (rate * days * workerCount);
      const gst = Math.round(amount * 0.18);
      setFormData({
        ...formData,
        amount: amount,
        gst_amount: gst,
        total_amount: amount + gst
      });
    } catch (err) {
      alert('Calculation failed');
    }
  };

  const handleFinalize = async (e) => {
    e.preventDefault();
    if (!formData.client_id) {
      alert('Please select a client');
      return;
    }
    try {
      await axios.post('/api/invoices', {
        ...formData,
        client_id: formData.client_id,
        assignment_id: formData.assignment_id || null,
        amount: parseFloat(formData.amount) || 0,
        gst_amount: parseFloat(formData.gst_amount) || 0,
        total_amount: parseFloat(formData.total_amount) || 0
      });
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Invoice finalization failed');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`/api/invoices/${id}/status`, { status });
      fetchData();
    } catch (err) {
      alert('Status update failed');
    }
  };

  const initiateDelete = (invoice) => {
    setItemToDelete(invoice);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/api/invoices/${itemToDelete.id}`);
      fetchData();
      setShowDeleteModal(false);
    } catch (err) {
      alert('Deletion failed');
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  const exportToCSV = () => {
    const headers = ['Invoice ID', 'Client', 'Assignment', 'Amount', 'GST', 'Total', 'Status', 'Date'];
    const rows = invoices.map(inv => [
      `INV-${inv.id}`, inv.client_name, inv.assignment_name || 'Global',
      inv.amount, inv.gst_amount, inv.total_amount, inv.status, inv.issue_date
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + 
      headers.join(",") + "\n" + 
      rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `billing_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const downloadInvoice = (inv) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice #INV-${inv.id}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 40px; }
            .brand { font-size: 24px; font-weight: 900; color: #2563eb; }
            .invoice-details { text-align: right; }
            .section { margin-bottom: 30px; }
            .label { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #64748b; letter-spacing: 1px; }
            .value { font-size: 16px; font-weight: 700; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 40px; }
            th { text-align: left; background: #f8fafc; padding: 12px; font-size: 10px; font-weight: 900; text-transform: uppercase; }
            td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
            .total-section { margin-top: 40px; float: right; width: 300px; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .grand-total { border-top: 2px solid #2563eb; margin-top: 10px; padding-top: 10px; font-size: 18px; font-weight: 900; color: #2563eb; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">TRINETRA COMMAND</div>
            <div class="invoice-details">
              <div class="label">Invoice ID</div>
              <div class="value">#INV-${inv.id}</div>
              <div class="label" style="margin-top: 10px;">Issue Date</div>
              <div class="value">${inv.issue_date}</div>
            </div>
          </div>
          
          <div class="section">
            <div class="label">Bill To</div>
            <div class="value">${inv.client_name}</div>
            <div class="value" style="font-weight: 500; font-size: 12px; color: #64748b;">${inv.assignment_name || 'Operational Deployment'}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Cycle</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Operational Manpower Provisioning</td>
                <td>Monthly Billing Cycle</td>
                <td style="text-align: right;">₹ ${inv.amount.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row">
              <span class="label">Subtotal</span>
              <span class="value">₹ ${inv.amount.toLocaleString()}</span>
            </div>
            <div class="total-row">
              <span class="label">GST (18%)</span>
              <span class="value">₹ ${inv.gst_amount.toLocaleString()}</span>
            </div>
            <div class="total-row grand-total">
              <span>Total Payable</span>
              <span>₹ ${inv.total_amount.toLocaleString()}</span>
            </div>
          </div>
          <script>
            window.onload = () => { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Billing Hub</h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">Automated Client Invoicing & Revenue Tracking</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              setIsManual(false);
              setFormData({
                client_id: '', assignment_id: '', issue_date: '', due_date: '',
                amount: 0, gst_amount: 0, total_amount: 0, status: 'pending'
              });
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} /> New Invoice
          </button>
          <button 
            onClick={exportToCSV}
            className="p-3 bg-card border border-border rounded-xl text-muted-foreground hover:text-primary transition-all shadow-sm"
          >
             <FileSpreadsheet size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {[
           { label: 'Total Billed', value: `₹ ${(invoices.reduce((a,b) => a + (b.total_amount || 0), 0) || 0).toLocaleString()}`, icon: FileText, color: 'from-blue-600 to-blue-400', textColor: 'text-blue-600' },
           { label: 'Settled Amount', value: `₹ ${(invoices.filter(i => i.status === 'paid').reduce((a,b) => a + (b.total_amount || 0), 0) || 0).toLocaleString()}`, icon: CheckCircle2, color: 'from-emerald-600 to-emerald-400', textColor: 'text-emerald-600' },
           { label: 'Outstanding', value: `₹ ${(invoices.filter(i => i.status === 'pending').reduce((a,b) => a + (b.total_amount || 0), 0) || 0).toLocaleString()}`, icon: Clock, color: 'from-amber-600 to-amber-400', textColor: 'text-amber-600' },
           { label: 'Loss Recovery', value: '₹ 0', icon: AlertCircle, color: 'from-rose-600 to-rose-400', textColor: 'text-rose-600' },
         ].map((stat, i) => (
           <div key={i} className="card-premium p-8 group overflow-hidden relative">
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-5 blur-2xl group-hover:opacity-10 transition-all`} />
              <div className="flex items-center justify-between mb-4">
                 <div className={`p-2.5 rounded-xl bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all`}>
                    <stat.icon size={20} />
                 </div>
                 <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{stat.label}</span>
              </div>
              <h3 className={`text-3xl font-black ${stat.textColor} tracking-tighter`}>{stat.value}</h3>
              <div className="mt-4 flex items-center gap-2">
                 <div className="h-1 flex-1 bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${stat.color}`} style={{ width: '65%' }} />
                 </div>
                 <span className="text-[10px] font-black text-muted-foreground">ACTUAL</span>
              </div>
           </div>
         ))}
      </div>

      <div className="card-premium overflow-hidden">
        <div className="p-8 border-b border-border bg-secondary/20 flex justify-between items-center">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                 <FileSpreadsheet size={24} />
              </div>
              <div>
                 <h3 className="text-xl font-black">Invoice Reconciliation Ledger</h3>
                 <p className="caption mt-0.5">Automated Financial Settlement Trace</p>
              </div>
           </div>
           <div className="flex gap-3">
               <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search invoices..." 
                    className="input-field pl-12 py-3 text-xs w-64 bg-background" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
              <button 
                onClick={exportToCSV}
                className="btn-secondary gap-3 px-8 text-xs"
              >
                <Download size={18} /> Export Records
              </button>
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-secondary/10 border-b border-border">
                <th className="px-8 py-6 caption">Legal ID</th>
                <th className="px-8 py-6 caption">Client / Operational Site</th>
                <th className="px-8 py-6 caption">Financial Breakdown</th>
                <th className="px-8 py-6 caption text-center">Status Badge</th>
                <th className="px-8 py-6 text-right caption">Operational Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                [1,2,3].map(i => <tr key={i}><td colSpan="5" className="px-8 py-8 animate-pulse bg-secondary/5" /></tr>)
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-secondary/30 transition-all group">
                    <td className="px-8 py-6">
                       <span className="text-xs font-black text-primary bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10">#INV-{inv.id?.toString().slice(-6).toUpperCase()}</span>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-black text-foreground">{inv.client_name}</p>
                      <p className="text-[10px] text-muted-foreground font-black uppercase mt-1 tracking-wider">{inv.assignment_name || 'Global Assignment'}</p>
                    </td>
                    <td className="px-8 py-6">
                       <div className="space-y-1">
                          <div className="flex justify-between w-48 text-[10px] font-black uppercase text-muted-foreground">
                             <span>Base</span>
                             <span className="text-foreground">₹{(inv.amount || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between w-48 text-[10px] font-black uppercase text-muted-foreground">
                             <span>GST (18%)</span>
                             <span className="text-foreground">₹{(inv.gst_amount || 0).toLocaleString()}</span>
                          </div>
                          <div className="h-0.5 w-48 bg-border my-1" />
                          <div className="flex justify-between w-48 text-sm font-black text-primary">
                             <span>Total</span>
                             <span>₹{(inv.total_amount || 0).toLocaleString()}</span>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex justify-center">
                          <select 
                            value={inv.status}
                            onChange={(e) => updateStatus(inv.id, e.target.value)}
                            className={`text-[9px] font-black uppercase tracking-[0.15em] px-4 py-2 rounded-xl outline-none border-2 transition-all cursor-pointer shadow-sm ${
                              inv.status === 'paid' ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/20' : 
                              inv.status === 'pending' ? 'bg-amber-500/5 text-amber-600 border-amber-500/20' : 
                              'bg-rose-500/5 text-rose-600 border-rose-500/20'
                            }`}
                          >
                             <option value="pending">Pending Settlement</option>
                             <option value="paid">Settled/Verified</option>
                             <option value="cancelled">Voided/Disputed</option>
                          </select>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => downloadInvoice(inv)}
                            className="p-3 bg-secondary rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all shadow-sm"
                          >
                             <Download size={18} />
                          </button>
                          <button 
                            onClick={() => initiateDelete(inv)}
                            className="p-3 bg-secondary rounded-xl text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-all shadow-sm"
                          >
                             <Trash2 size={18} />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {!loading && invoices.length === 0 && (
            <div className="py-20 text-center">
               <FileText className="mx-auto text-muted-foreground/20 mb-4" size={48} />
               <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">No Invoice Records</p>
            </div>
          )}
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
                  <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                     <Plus size={28} />
                  </div>
                  <div>
                     <h2 className="text-2xl font-black tracking-tight">{isManual ? 'Manual Invoice' : 'Generate Proforma'}</h2>
                     <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] mt-1">Operational Revenue Calculation Engine</p>
                  </div>
               </div>
               <button onClick={() => setShowModal(false)} className="p-3 hover:bg-secondary rounded-xl transition-colors">
                  <X size={20} className="text-muted-foreground" />
               </button>
            </div>

            <form onSubmit={handleFinalize} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-2xl">
                 <div className="flex items-center gap-3">
                    <Edit3 size={18} className="text-primary" />
                    <span className="text-xs font-black uppercase tracking-widest">Manual Override Mode</span>
                 </div>
                 <input 
                   type="checkbox" 
                   checked={isManual} 
                   onChange={(e) => setIsManual(e.target.checked)}
                   className="w-5 h-5 accent-primary cursor-pointer"
                 />
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Users size={14} className="text-primary" /> Target Client Partner
                  </label>
                  <select 
                    required 
                    className="input-field bg-secondary/50 border-2 focus:border-primary/50 transition-all py-4" 
                    value={formData.client_id} 
                    onChange={e => setFormData({...formData, client_id: e.target.value})}
                  >
                    <option value="">Choose a partner...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Activity size={14} className="text-primary" /> Operational Site
                  </label>
                  <select 
                    required 
                    className="input-field bg-secondary/50 border-2 focus:border-primary/50 transition-all py-4" 
                    value={formData.assignment_id} 
                    onChange={e => setFormData({...formData, assignment_id: e.target.value})}
                  >
                    <option value="">All active sites...</option>
                    {assignments.filter(a => a.client_id == formData.client_id).map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-6 bg-secondary/20 border border-border rounded-3xl space-y-6">
                <div className="flex items-center justify-between mb-2">
                   <div className="flex items-center gap-3">
                      <Calendar size={16} className="text-primary" />
                      <span className="text-xs font-black uppercase tracking-widest text-primary">Billing Cycle Parameters</span>
                   </div>
                   {!isManual && (
                      <button 
                        type="button"
                        onClick={handleCalculate}
                        className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-4 py-2 rounded-xl hover:bg-primary/20 transition-all flex items-center gap-2"
                      >
                         <Calculator size={14} /> Auto-Calculate
                      </button>
                   )}
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Cycle Start Date</label>
                    <input 
                      type="date" 
                      required 
                      className="input-field bg-background py-4" 
                      value={formData.issue_date} 
                      onChange={e => setFormData({...formData, issue_date: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Settlement Due Date</label>
                    <input 
                      type="date" 
                      required 
                      className="input-field bg-background py-4" 
                      value={formData.due_date} 
                      onChange={e => setFormData({...formData, due_date: e.target.value})} 
                    />
                  </div>
                </div>
              </div>

              <div className="p-8 bg-primary/5 border border-primary/10 rounded-[2rem] space-y-8">
                 <div className="flex items-center gap-3 mb-2">
                    <DollarSign size={16} className="text-primary" />
                    <span className="text-xs font-black uppercase tracking-widest text-primary">Financial Breakdown (Editable)</span>
                 </div>
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Base Amount (₹)</label>
                       <input 
                         type="number" 
                         required 
                         className="input-field bg-background py-4 font-black text-lg" 
                         value={formData.amount} 
                         onChange={e => {
                            const amt = parseFloat(e.target.value) || 0;
                            const gst = amt * 0.18;
                            setFormData({...formData, amount: amt, gst_amount: gst, total_amount: amt + gst});
                         }} 
                       />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">GST (18%) (₹)</label>
                       <input 
                         type="number" 
                         required 
                         className="input-field bg-background py-4 font-black text-lg" 
                         value={formData.gst_amount} 
                         onChange={e => {
                            const gst = parseFloat(e.target.value) || 0;
                            setFormData({...formData, gst_amount: gst, total_amount: formData.amount + gst});
                         }} 
                       />
                    </div>
                 </div>
                 <div className="pt-6 border-t border-primary/10 flex justify-between items-center">
                    <span className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">Net Payable</span>
                    <span className="text-3xl font-black text-primary tracking-tighter">₹ {formData.total_amount.toLocaleString()}</span>
                 </div>
              </div>

              <div className="pt-6 border-t border-border flex justify-end gap-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-8 py-4 text-sm font-black text-muted-foreground hover:text-foreground transition-colors"
                >
                  Discard
                </button>
                <button 
                  type="submit" 
                  className="btn-primary px-12 py-4 shadow-xl shadow-primary/20"
                >
                  {isManual ? 'Create Invoice' : 'Finalize & Issue'}
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
        itemName={`INV-${itemToDelete?.id}`}
        loading={isDeleting}
        title="Confirm Invoice Deletion"
        description="Are you sure you want to permanently void and delete this invoice record? This action cannot be undone."
      />
    </div>
  );
};

export default Billing;
