import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Download, TrendingUp, Calendar, PieChart, BarChart2, 
  Filter, ArrowUpRight, Loader2, Users, CheckCircle2, X, Clock, 
  ChevronRight, Printer, Mail, Share2, ShieldCheck, Activity
} from 'lucide-react';



const Reports = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ workforce: 0, attendance: 0, clients: 0, payroll: 0 });
  const [auditLogs, setAuditLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [downloadFormat, setDownloadFormat] = useState('csv');
  const [isExporting, setIsExporting] = useState(false);



  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/reports/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch report stats', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchAuditLogs = async () => {
      try {
        const res = await axios.get('/api/audit');
        setAuditLogs(res.data);
      } catch (err) {
        console.error('Failed to fetch audit logs', err);
      } finally {
        setLogsLoading(false);
      }
    };

    fetchStats();
    fetchAuditLogs();

    // Poll every 30s for live feel
    const interval = setInterval(fetchAuditLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDownload = async () => {
    setIsExporting(true);
    const title = selectedReport;
    
    try {
      // Fetch real dynamic data from backend
      const res = await axios.get(`/api/reports/detail/${encodeURIComponent(title)}`);
      const content = res.data;

      if (downloadFormat === 'csv') {
        let csvString = `Intelligence Report: ${title}\nGenerated on: ${new Date().toLocaleString()}\n\n`;
        csvString += content.headers.join(',') + '\n';
        content.rows.forEach(row => {
          csvString += row.join(',') + '\n';
        });
        csvString += `\nSummary: ${content.summary}`;
        
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${title.toLowerCase().replace(/ /g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
          <html>
            <head>
              <title>${title}</title>
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
                body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 50px; line-height: 1.5; }
                .header { border-bottom: 4px solid #3b82f6; padding-bottom: 30px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
                .title { font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.02em; color: #0f172a; }
                .meta { font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; }
                
                table { width: 100%; border-collapse: collapse; margin: 30px 0; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
                th { background: #f8fafc; text-align: left; padding: 15px; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #475569; border-bottom: 2px solid #e2e8f0; }
                td { padding: 15px; font-size: 11px; border-bottom: 1px solid #f1f5f9; color: #334155; }
                tr:last-child td { border-bottom: none; }
                
                .summary-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 25px; border-radius: 0 12px 12px 0; margin-top: 40px; }
                .summary-title { font-size: 11px; font-weight: 900; text-transform: uppercase; color: #2563eb; margin-bottom: 8px; }
                .summary-text { font-size: 13px; color: #1e40af; font-weight: 500; }
                
                .footer { margin-top: 80px; font-size: 9px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 30px; text-transform: uppercase; letter-spacing: 0.05em; }
              </style>
            </head>
            <body>
              <div class="header">
                <div>
                  <div class="meta">Trinetra Intelligence Report</div>
                  <div class="title">${title}</div>
                </div>
                <div class="meta" style="text-align: right;">Ref: TRN-${Math.floor(Math.random()*90000) + 10000}<br>${new Date().toLocaleDateString()}</div>
              </div>
              
              <table>
                <thead>
                  <tr>
                    ${content.headers.map(h => `<th>${h}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${content.rows.map(row => `
                    <tr>
                      ${row.map(cell => `<td>${cell}</td>`).join('')}
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              
              <div class="summary-box">
                <div class="summary-title">Operational Context</div>
                <div class="summary-text">${content.summary}</div>
              </div>
              
              <div style="margin-top: 40px; font-size: 11px; color: #64748b;">
                <p>Verified and synchronized data.</p>
              </div>
              
              <div class="footer">
                Confidential Property of Trinetra Workforce Solutions • Unauthorized Distribution Prohibited • © 2026
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 700);
      }
    } catch (err) {
      alert('Failed to generate report. Please try again later.');
    } finally {
      setIsExporting(false);
      setShowDownloadModal(false);
    }
  };

  const reportCategories = [
    { name: 'Total Workers', icon: Users, count: stats.workforce, label: 'Personnel', lastRun: 'Live', path: '/admin/workers' },
    { name: 'Attendance Trends', icon: BarChart2, count: stats.attendance, label: 'Today', lastRun: 'Today', path: '/admin/attendance' },
    { name: 'Total Clients', icon: PieChart, count: stats.clients, label: 'Partners', lastRun: 'Live', path: '/admin/clients' },
    { name: 'Payroll Compliance', icon: TrendingUp, count: stats.payroll, label: 'Pending', lastRun: 'Recent', path: '/admin/payroll' },
  ];

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Intelligence Reports</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1 uppercase tracking-widest">Data-driven Strategic Insights & Analytics</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowFilterModal(true)}
            className="btn-secondary flex items-center gap-2 text-xs font-black uppercase tracking-widest px-6"
          >
            <Filter size={18} /> Filters
          </button>
          <button 
            onClick={() => setShowScheduleModal(true)}
            className="btn-primary flex items-center gap-2 text-xs font-black uppercase tracking-widest px-6"
          >
            <Calendar size={18} /> Schedule Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {reportCategories.map((cat, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -4, scale: 1.01 }}
            onClick={() => navigate(cat.path)}
            className="card-premium p-10 flex items-center justify-between group cursor-pointer hover:border-primary/30 transition-all bg-card/50 backdrop-blur-sm"
          >
            <div className="flex items-center gap-8">
              <div className="w-20 h-20 bg-secondary rounded-[2rem] flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all shadow-xl shadow-black/5">
                <cat.icon size={36} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-foreground mb-2 tracking-tight">{cat.name}</h3>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-3">
                   <span className="text-primary">{cat.count} {cat.label}</span>
                   <span className="w-1 h-1 bg-border rounded-full" />
                   <span className="flex items-center gap-2">
                      <Clock size={14} className="text-primary/60" /> {cat.lastRun}
                   </span>
                </p>
              </div>
            </div>
            <div className="w-14 h-14 bg-secondary/50 rounded-2xl flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all">
              <ArrowUpRight size={24} />
            </div>
          </motion.div>
        ))}
      </div>


      <div className="card-premium overflow-hidden">
        <div className="p-10 border-b border-border bg-secondary/20 flex justify-between items-center">
           <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                 <FileText size={28} />
              </div>
              <div>
                 <h3 className="text-xl font-black tracking-tight">Standard Reports</h3>
                 <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Templates</p>
              </div>
           </div>
           <button className="text-primary text-[10px] font-black tracking-widest uppercase hover:underline py-2 px-4 rounded-lg hover:bg-primary/5 transition-all">Manage Templates</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 divide-x divide-y divide-border border-b border-border">
          {[
            { title: 'Monthly Payroll Summary', desc: 'Detailed payroll summary with salary, overtime, and deductions.' },
            { title: 'Daily Attendance Matrix', desc: 'Daily attendance records with check-in times and locations.' },
            { title: 'Worker Deployment Log', desc: 'Worker assignments across all active clients.' },
            { title: 'Compliance Audit Report', desc: 'Audit of all worker documents and their expiry dates.' },
            { title: 'Identity Verification Trace', desc: 'Verification details for all worker identity records.' },
            { title: 'Site Distribution Analytics', desc: 'Overview of worker distribution and performance across all client sites.' }
          ].map((report, i) => (
            <div key={i} className="p-10 hover:bg-primary/[0.02] transition-all flex flex-col justify-between group relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <TrendingUp size={24} className="text-primary/10" />
               </div>
               <div className="space-y-4 relative z-10">
                  <h4 className="text-lg font-black text-foreground leading-snug tracking-tight">{report.title}</h4>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed">{report.desc}</p>
               </div>
               <button 
                 onClick={() => { setSelectedReport(report.title); setShowDownloadModal(true); }}
                 className="mt-12 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-primary group-hover:gap-5 transition-all"
               >
                  <Download size={18} /> Download Report
               </button>
            </div>
          ))}
        </div>
      </div>

      {/* Live Activity Ledger */}
      <div className="card-premium overflow-hidden">
        <div className="p-8 border-b border-border bg-secondary/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Activity size={22} />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight">Recent Activity</h3>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-0.5">Live updates from across the system</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Live</span>
          </div>
        </div>
        <div className="divide-y divide-border max-h-[520px] overflow-y-auto custom-scrollbar">
          {logsLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-5 flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-secondary" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-48 bg-secondary rounded" />
                  <div className="h-2 w-24 bg-secondary rounded" />
                </div>
                <div className="h-3 w-16 bg-secondary rounded" />
              </div>
            ))
          ) : auditLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <Activity size={40} className="opacity-20" />
              <p className="text-sm font-black uppercase tracking-widest opacity-40">No activity recorded yet</p>
            </div>
          ) : (
            auditLogs.map((log, i) => {
              const statusColor = log.status === 'DANGER'
                ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                : log.status === 'WARN'
                ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
              return (
                <div key={log.id || i} className="px-8 py-5 flex items-center justify-between hover:bg-secondary/20 transition-all group">
                  <div className="flex items-center gap-5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${statusColor} group-hover:scale-110 transition-transform`}>
                      <Clock size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{log.action.replace(/_/g, ' ')}</p>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">
                        By {log.user_name || 'System'}
                        {log.target_type && log.target_type !== 'Unknown' && (
                          <span className="ml-2 text-primary/60">• {log.target_type}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border ${statusColor}`}>
                      {log.status}
                    </span>
                    <span className="text-[10px] font-black text-muted-foreground whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Download Format Modal */}
      <AnimatePresence>
        {showDownloadModal && (
          <div className="modal-overlay">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-8 bg-secondary/30 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                    <Download size={20} />
                  </div>
                  <h2 className="text-lg font-black tracking-tight">Export Format</h2>
                </div>
                <button onClick={() => setShowDownloadModal(false)} className="p-2 hover:bg-secondary rounded-lg transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  Select the target output format for <span className="text-foreground font-black">{selectedReport}</span>. Higher fidelity reports may take longer to compile.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setDownloadFormat('csv')}
                    className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${downloadFormat === 'csv' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}
                  >
                    <FileText size={32} className={downloadFormat === 'csv' ? 'text-primary' : 'text-muted-foreground'} />
                    <span className="text-[10px] font-black uppercase tracking-widest">CSV Data</span>
                  </button>
                  <button 
                    onClick={() => setDownloadFormat('pdf')}
                    className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${downloadFormat === 'pdf' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}
                  >
                    <Printer size={32} className={downloadFormat === 'pdf' ? 'text-primary' : 'text-muted-foreground'} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Professional PDF</span>
                  </button>
                </div>
                <button 
                  onClick={handleDownload}
                  disabled={isExporting}
                  className="w-full py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-3"
                >
                  {isExporting ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                  Execute Export
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Intelligence Filter Modal */}
        {showFilterModal && (
          <div className="modal-overlay">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              className="bg-card border border-border rounded-[2.5rem] shadow-2xl max-w-xl w-full p-10"
            >
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-black">Filters</h2>
                <button onClick={() => setShowFilterModal(false)}><X size={24} /></button>
              </div>
              <div className="space-y-8">
                <div className="space-y-3">
                   <label className="caption">Date Range</label>
                   <div className="grid grid-cols-2 gap-4">
                      <input type="date" className="input-field" />
                      <input type="date" className="input-field" />
                   </div>
                </div>
                <div className="space-y-3">
                   <label className="caption">Business Verticals</label>
                   <div className="flex flex-wrap gap-3">
                      {['Operations', 'Finance', 'Logistics', 'Compliance'].map(v => (
                        <button key={v} className="px-4 py-2 bg-secondary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all">{v}</button>
                      ))}
                   </div>
                </div>
                <button onClick={() => setShowFilterModal(false)} className="btn-primary w-full py-4">Apply Filters</button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Schedule Modal */}
        {showScheduleModal && (
          <div className="modal-overlay">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              className="bg-card border border-border rounded-[2.5rem] shadow-2xl max-w-xl w-full p-10"
            >
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-black">Schedule Report</h2>
                <button onClick={() => setShowScheduleModal(false)}><X size={24} /></button>
              </div>
              <div className="space-y-8">
                <div className="space-y-3">
                   <label className="caption">Frequency</label>
                   <select className="input-field">
                      <option>Daily Operational Digest</option>
                      <option>Weekly Strategic Review</option>
                      <option>Monthly Compliance Audit</option>
                   </select>
                </div>
                <div className="space-y-3">
                   <label className="caption">Distribution Nodes (Emails)</label>
                   <input type="text" placeholder="admin@trinetra.com, ceo@trinetra.com" className="input-field" />
                </div>
                <button onClick={() => setShowScheduleModal(false)} className="btn-primary w-full py-4">Activate Schedule</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Reports;
