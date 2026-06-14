import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Search, Filter, ShieldCheck, User, Eye, RefreshCw, Loader2, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import axios from 'axios';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import Pagination from '../components/Pagination';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Delete States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/documents');
      setDocuments(res.data);
    } catch (err) {
      console.error('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`/api/documents/${id}/status`, { status });
      fetchDocuments();
    } catch (err) {
      alert('Failed to update verification status');
    }
  };

  const initiateDelete = (doc) => {
    setItemToDelete(doc);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/api/documents/${itemToDelete.id}`);
      fetchDocuments();
      setShowDeleteModal(false);
    } catch (err) {
      alert('Deletion failed');
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.worker_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage);
  const paginatedDocs = filteredDocs.slice(
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
          <h1 className="text-3xl font-black tracking-tight text-foreground">Compliance Vault</h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">Statutory Personnel Assets & Identity Records</p>
        </div>
        <div className="flex gap-3">
          <div className="relative group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
             <input 
               type="text" 
               placeholder="Filter by name or type..." 
               className="input-field pl-12 py-3 text-xs w-64 shadow-sm"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <button 
            onClick={fetchDocuments}
            className="p-3 bg-card border border-border rounded-xl text-muted-foreground hover:text-primary transition-all shadow-sm"
          >
             <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="p-8 border-b border-border bg-secondary/20 flex justify-between items-center">
           <div className="flex items-center gap-3">
              <ShieldCheck className="text-primary" size={20} />
              <h3 className="text-sm font-black uppercase tracking-widest">Document Auditing Matrix</h3>
           </div>
           <button className="btn-secondary gap-3 px-8 text-xs">
              <Download size={18} /> Bulk Statutory Export
           </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-secondary/10 border-b border-border">
                <th className="px-8 py-5 caption">Personnel</th>
                <th className="px-8 py-5 caption">Statutory Asset</th>
                <th className="px-8 py-5 caption text-center">Integrity Status</th>
                <th className="px-8 py-5 caption">Ingestion Date</th>
                <th className="px-8 py-5 text-right caption">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="5" className="px-8 py-8 bg-secondary/5" />
                  </tr>
                ))
              ) : paginatedDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-secondary/30 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                       <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                          {doc.worker_name ? doc.worker_name[0] : '?'}
                       </div>
                       <span className="text-sm font-bold text-foreground">{doc.worker_name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                       <FileText size={18} className="text-primary" />
                       <div>
                          <p className="text-xs font-bold text-foreground uppercase tracking-wider">{doc.type}</p>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase mt-0.5">Statutory Filing</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex justify-center">
                       <select 
                         value={doc.status}
                         onChange={(e) => updateStatus(doc.id, e.target.value)}
                         className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-transparent outline-none cursor-pointer ${
                           doc.status === 'verified' ? 'bg-emerald-500/10 text-emerald-600' : 
                           doc.status === 'rejected' ? 'bg-rose-500/10 text-rose-600' : 'bg-amber-500/10 text-amber-600'
                         }`}
                       >
                          <option value="pending">Pending</option>
                          <option value="verified">Verified</option>
                          <option value="rejected">Rejected</option>
                       </select>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <a href={doc.file_url} target="_blank" rel="noreferrer" className="p-2.5 bg-secondary rounded-xl text-muted-foreground hover:text-primary transition-all shadow-sm">
                          <Eye size={18} />
                       </a>
                        <button 
                          onClick={() => initiateDelete(doc)}
                          className="p-2.5 bg-secondary rounded-xl text-muted-foreground hover:text-rose-500 transition-all shadow-sm"
                        >
                           <Trash2 size={18} />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredDocs.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-20 text-center text-muted-foreground text-[10px] font-black uppercase tracking-widest">No compliance records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {!loading && filteredDocs.length > 0 && (
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
            totalItems={filteredDocs.length}
          />
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        itemName={`${itemToDelete?.worker_name}'s ${itemToDelete?.type}`}
        loading={isDeleting}
        title="Purge Statutory Asset"
        description="Are you sure you want to permanently erase this statutory record from the secure vault? This action is irreversible."
      />
    </div>
  );
};

export default Documents;
