import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Clock, Search, Download, RefreshCw, AlertCircle } from 'lucide-react';
import axios from 'axios';
import Pagination from '../components/Pagination';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/audit');
      setLogs(res.data);
    } catch (err) {
      setError('Failed to retrieve system logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight">System Transparency</h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">Immutable Operational Trace Ledger</p>
        </div>
        <div className="flex gap-4">
           <button onClick={fetchLogs} className="p-3 bg-card border border-border rounded-xl hover:text-primary transition-all">
             <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
           </button>
           <button className="btn-secondary gap-3 px-8 text-xs">
            <Download size={18} /> Export Audit Trail
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-600 text-sm font-bold flex items-center gap-3">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <div className="card-premium overflow-hidden">
        <div className="p-8 border-b border-border bg-secondary/20 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                <Shield size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-foreground">Activity Ledger</h3>
                <p className="caption mt-1">Global Administrative Operations Hub</p>
              </div>
           </div>
           <div className="relative group w-full md:w-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Filter logs by action or user..." 
                  className="input-field pl-12 w-full md:w-96 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
        
        <div className="overflow-x-auto">
           <table className="w-full text-left">
              <thead>
                 <tr className="bg-secondary/10 border-b border-border">
                    <th className="px-8 py-6 caption">Initiator</th>
                    <th className="px-8 py-6 caption">Operational Action</th>
                    <th className="px-8 py-6 caption">Target Object</th>
                    <th className="px-8 py-6 caption text-center">Integrity Status</th>
                    <th className="px-8 py-6 text-right caption">Timestamp</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-border">
                 {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan="5" className="px-8 py-8 bg-secondary/5" />
                      </tr>
                    ))
                 ) : paginatedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-secondary/30 transition-all group">
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                             <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-primary/20">
                                {log.user_name ? log.user_name[0] : 'S'}
                             </div>
                             <span className="font-bold text-foreground text-sm">{log.user_name || 'System Admin'}</span>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <span className="text-[10px] font-black bg-secondary px-3 py-1.5 rounded-lg text-muted-foreground border border-border uppercase tracking-widest">
                             {log.action}
                          </span>
                       </td>
                       <td className="px-8 py-6 text-sm font-semibold text-foreground/60">{log.target_type} #{log.target_id}</td>
                       <td className="px-8 py-6">
                          <div className="flex items-center justify-center gap-3">
                             <div className={`w-2 h-2 rounded-full ${
                                log.status === 'SUCCESS' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 
                                log.status === 'WARN' ? 'bg-amber-500 shadow-lg shadow-amber-500/30' : 'bg-rose-500 shadow-lg shadow-rose-500/30'
                             }`} />
                             <span className={`text-[10px] font-black uppercase tracking-widest ${
                                log.status === 'SUCCESS' ? 'text-emerald-600' : 
                                log.status === 'WARN' ? 'text-amber-600' : 'text-rose-600'
                             }`}>{log.status}</span>
                          </div>
                       </td>
                       <td className="px-8 py-6 text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest">{log.time}</td>
                    </tr>
                 ))}
              </tbody>
           </table>
           {!loading && filteredLogs.length === 0 && (
             <div className="py-20 text-center">
                <Shield className="mx-auto text-muted-foreground/20 mb-4" size={48} />
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No Activity Records Found</p>
             </div>
           )}
         </div>
         {!loading && filteredLogs.length > 0 && (
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
            totalItems={filteredLogs.length}
          />
         )}
      </div>
    </div>
  );
};

export default AuditLogs;
