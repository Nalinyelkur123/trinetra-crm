import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Download, TrendingUp, Users, Calendar, ArrowUpRight, Loader2, Landmark, RefreshCw, CheckCircle2, X, Shield } from 'lucide-react';
import axios from 'axios';
import Pagination from '../components/Pagination';
import ActionConfirmationModal from '../components/ActionConfirmationModal';

const Payroll = () => {
  const [payrollData, setPayrollData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/payroll');
      setPayrollData(res.data);
    } catch (err) {
      console.error('Failed to fetch payroll');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, []);

  const handleGenerate = async () => {
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();
    
    setIsGenerating(true);
    try {
      const res = await axios.post('/api/payroll/generate', { month, year });
      alert(res.data.message || 'Payroll generated successfully');
      fetchPayroll();
      setShowConfirmModal(false);
    } catch (err) {
      alert('Failed to generate payroll. Check for existing records.');
    } finally {
      setIsGenerating(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`/api/payroll/${id}/status`, { status });
      fetchPayroll();
    } catch (err) {
      alert('Failed to update payment status');
    }
  };

  const totalOutflow = payrollData.reduce((acc, curr) => acc + (curr.net_pay || 0), 0);
  const activeWorkersCount = new Set(payrollData.map(p => p.worker_id)).size;
  const complianceRate = payrollData.length ? Math.round((payrollData.filter(p => p.status === 'paid').length / payrollData.length) * 100) : 100;
  const projectedBurn = totalOutflow * 1.05;

  const stats = [
    { label: 'Total Payroll Cost', value: `₹ ${totalOutflow.toLocaleString()}`, icon: DollarSign, trend: 'Actual' },
    { label: 'Active Workers', value: activeWorkersCount, icon: Users, trend: 'Current' },
    { label: 'Paid Ratio', value: `${complianceRate}%`, icon: Landmark, trend: complianceRate === 100 ? 'Optimal' : 'Pending Actions' },
    { label: 'Estimated Cost', value: `₹ ${Math.round(projectedBurn).toLocaleString()}`, icon: TrendingUp, trend: 'Estimated' },
  ];

  const totalPages = Math.ceil(payrollData.length / itemsPerPage);
  const paginatedPayroll = payrollData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-10 max-w-[1600px] mx-auto pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Payroll</h1>
          <p className="caption mt-1 text-slate-500 font-medium">Monthly Payroll Management</p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={fetchPayroll}
             className="p-3 bg-card border border-border rounded-xl text-muted-foreground hover:text-primary transition-all shadow-sm"
           >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
           </button>
           <button 
             onClick={() => setShowConfirmModal(true)}
             disabled={isGenerating}
             className="btn-primary flex items-center gap-2 text-xs"
           >
              <DollarSign size={18} /> 
              Generate Payroll
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="card-premium p-8 flex items-center justify-between group cursor-default">
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black text-foreground">{stat.value}</h3>
              <p className="text-[10px] font-bold text-emerald-500 mt-1">{stat.trend}</p>
            </div>
            <div className="p-4 bg-primary/10 text-primary rounded-2xl group-hover:scale-105 transition-transform shadow-sm">
              <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      <div className="card-premium overflow-hidden">
        <div className="p-8 border-b border-border bg-secondary/20 flex justify-between items-center">
           <div className="flex items-center gap-3">
              <Landmark className="text-primary" size={20} />
              <h3 className="text-sm font-black uppercase tracking-widest">Payroll Records</h3>
           </div>
           <button className="btn-secondary gap-3 px-8 text-xs">
             <Download size={18} /> Export Payroll
           </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-secondary/10 border-b border-border">
                <th className="px-8 py-6 caption">Worker Details</th>
                <th className="px-8 py-6 caption">Job Role</th>
                <th className="px-8 py-6 caption">Period</th>
                <th className="px-8 py-6 caption text-center">Net Pay</th>
                <th className="px-8 py-6 caption text-center">Status</th>
                <th className="px-8 py-6 text-right caption">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="6" className="px-8 py-8 bg-secondary/5" />
                  </tr>
                ))
              ) : paginatedPayroll.map((record) => (
                <tr key={record.id} className="hover:bg-secondary/30 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-primary/20">
                          {record.worker_name ? record.worker_name[0] : '?'}
                       </div>
                       <div>
                          <p className="text-sm font-bold text-foreground">{record.worker_name}</p>
                          <p className="text-[10px] text-muted-foreground font-bold tracking-tight uppercase">TRN-PY-{record.id}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-xs font-semibold text-foreground/70">{record.job_role || 'Staff'}</td>
                  <td className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {new Date(0, record.month - 1).toLocaleString('default', { month: 'short' })} {record.year}
                  </td>
                  <td className="px-8 py-6 font-black text-center text-foreground">₹ {record.net_pay?.toLocaleString()}</td>
                  <td className="px-8 py-6">
                    <div className="flex justify-center">
                       <select 
                         value={record.status}
                         onChange={(e) => updateStatus(record.id, e.target.value)}
                         className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-transparent outline-none cursor-pointer ${
                           record.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                         }`}
                       >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                       </select>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => setSelectedPayslip(record)}
                      className="p-3 bg-secondary rounded-xl text-muted-foreground hover:text-primary transition-all shadow-sm" 
                      title="View Payslip"
                    >
                       <ArrowUpRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && payrollData.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-20 text-center text-muted-foreground text-[10px] font-black uppercase tracking-widest">No financial records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {!loading && payrollData.length > 0 && (
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
            totalItems={payrollData.length}
          />
        )}
      </div>

      <AnimatePresence>
        {selectedPayslip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPayslip(null)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-xl card-premium p-10 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-blue-400" />
              <div className="absolute top-10 right-10 opacity-[0.03] rotate-12 pointer-events-none">
                 <Shield size={120} className="text-primary" />
              </div>

              <div className="flex justify-between items-start mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                     <Landmark size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-foreground">Official Payslip</h2>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-black mt-1">Payroll Receipt</p>
                  </div>
                </div>
                <button onClick={() => setSelectedPayslip(null)} className="p-3 hover:bg-secondary rounded-2xl transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-10">
                <div className="grid grid-cols-2 gap-10">
                   <div className="space-y-4">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border pb-2">Worker Details</p>
                      <div className="space-y-1">
                         <h3 className="text-lg font-black text-foreground">{selectedPayslip.worker_name}</h3>
                         <p className="text-xs font-bold text-muted-foreground">{selectedPayslip.job_role || 'Staff'}</p>
                         <p className="text-[10px] font-black text-primary uppercase">ID: TRN-PY-{selectedPayslip.id}</p>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border pb-2">Pay Period</p>
                      <div className="space-y-1">
                         <p className="text-lg font-black text-foreground">
                            {new Date(0, selectedPayslip.month - 1).toLocaleString('default', { month: 'long' })} {selectedPayslip.year}
                         </p>
                         <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${selectedPayslip.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${selectedPayslip.status === 'paid' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            {selectedPayslip.status}
                         </div>
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                   <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border pb-2">Earnings Breakdown</p>
                   <div className="space-y-4">
                      <div className="flex justify-between items-center group">
                         <span className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">Base Salary</span>
                         <span className="text-sm font-black text-foreground">₹ {selectedPayslip.base_salary?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center group">
                         <span className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">Allowances</span>
                         <span className="text-sm font-black text-foreground text-emerald-600">+ ₹ 0</span>
                      </div>
                      <div className="flex justify-between items-center group">
                         <span className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">Deductions (EPF/ESI)</span>
                         <span className="text-sm font-black text-foreground text-rose-500">- ₹ 0</span>
                      </div>
                   </div>
                </div>

                <div className="p-8 bg-secondary/30 rounded-3xl border border-border/50 flex justify-between items-center">
                   <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Net Pay</p>
                      <h4 className="text-3xl font-black text-primary tracking-tighter">₹ {selectedPayslip.net_pay?.toLocaleString()}</h4>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Payment Method</p>
                      <p className="text-xs font-black text-foreground uppercase">Bank Transfer</p>
                   </div>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-border flex gap-4">
                 <button onClick={() => window.print()} className="btn-secondary flex-1 py-4 text-xs flex items-center justify-center gap-3">
                   <Download size={18} /> Download PDF
                 </button>
                 <button className="btn-primary flex-1 py-4 text-xs flex items-center justify-center gap-3">
                   <RefreshCw size={18} /> Verify Payment
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ActionConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleGenerate}
        loading={isGenerating}
        title="Generate Payroll"
        description={`Are you sure you want to generate payroll records for ${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}? This will create pending payroll entries for all active workers.`}
        confirmText="Generate Payroll"
        cancelText="Cancel"
        variant="primary"
      />
    </div>
  );
};

export default Payroll;
