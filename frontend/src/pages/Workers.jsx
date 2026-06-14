import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Users, Search, Plus, Eye, Edit2, Trash2, AlertCircle, RefreshCw, Briefcase, ShieldCheck, Mail, Phone, MapPin, Building2
} from 'lucide-react';
import axios from 'axios';
import WorkerDetailsModal from '../components/WorkerDetailsModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import Pagination from '../components/Pagination';

const Workers = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Delete States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchWorkers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/workers');
      setWorkers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to synchronize with the personnel registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handleViewDetails = async (id) => {
    setIsDetailsLoading(true);
    try {
      const res = await axios.get(`/api/workers/${id}`);
      setSelectedWorker(res.data);
    } catch (err) {
      alert('Failed to retrieve full dossier.');
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const initiateDelete = (worker) => {
    setItemToDelete(worker);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/api/workers/${itemToDelete.id}`);
      setWorkers(workers.filter(w => w.id !== itemToDelete.id));
      setShowDeleteModal(false);
    } catch (err) {
      alert('Deletion failed. System integrity protected.');
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  const filteredWorkers = (workers || []).filter(w => 
    w.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.id?.toString().includes(searchTerm) ||
    w.job_role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredWorkers.length / itemsPerPage);
  const paginatedWorkers = filteredWorkers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Workforce Registry</h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">Strategic personnel management</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchWorkers}
            className="p-3 bg-card border border-border rounded-xl text-muted-foreground hover:text-primary transition-all shadow-sm"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input 
              type="text" 
              placeholder="Filter identity..." 
              className="input-field pl-10 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Link to="/admin/workers/new" className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Onboard Staff
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-600 text-sm font-bold flex items-center gap-3">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-8 py-5 caption">Personnel</th>
                <th className="px-8 py-5 caption">Deployment</th>
                <th className="px-8 py-5 caption">Client Portfolio</th>
                <th className="px-8 py-5 caption">Authentication</th>
                <th className="px-8 py-5 caption text-center">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="6" className="px-8 py-8 bg-secondary/5" />
                  </tr>
                ))
              ) : paginatedWorkers.map((worker) => (
                <tr 
                  key={worker.id} 
                  onClick={() => handleViewDetails(worker.id)}
                  className="hover:bg-secondary/20 transition-all group cursor-pointer"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
                          {worker.name ? worker.name[0] : '?'}
                       </div>
                       <div>
                          <p className="text-sm font-bold text-foreground">{worker.name}</p>
                          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-0.5">TRN-{worker.id}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground/80">
                      <Briefcase size={14} className="text-primary" />
                      {worker.job_role || 'General Staff'}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-primary" />
                      <div className="text-sm font-bold">{worker.client_name || 'No Client Assigned'}</div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                       <ShieldCheck size={14} className="text-emerald-500" />
                       <span className="text-[10px] uppercase font-black tracking-tighter">Verified</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex justify-center">
                      <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                        worker.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                      }`}>
                        {worker.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/workers/edit/${worker.id}`);
                        }}
                        className="p-2.5 bg-secondary rounded-xl text-muted-foreground hover:text-amber-600 transition-all"
                        title="Edit Details"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          initiateDelete(worker);
                        }}
                        className="p-2.5 bg-secondary rounded-xl text-muted-foreground hover:text-destructive transition-all"
                        title="Delete Personnel"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filteredWorkers.length === 0 && (
            <div className="py-20 text-center">
              <Users className="mx-auto text-muted-foreground/20 mb-4" size={48} />
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No Records Found</p>
            </div>
          )}
        </div>
        
        {!loading && filteredWorkers.length > 0 && (
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
            totalItems={filteredWorkers.length}
          />
        )}
      </div>

      <AnimatePresence>
        {selectedWorker && (
          <WorkerDetailsModal 
            isOpen={!!selectedWorker}
            worker={selectedWorker}
            onClose={() => setSelectedWorker(null)}
          />
        )}
        
        {showDeleteModal && (
          <DeleteConfirmationModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={confirmDelete}
            itemName={itemToDelete?.name}
            loading={isDeleting}
            title="Confirm Personnel Purge"
            description="You are about to permanently delete the dossier for {itemName}. This action will purge all attendance, payroll, and statutory records associated with this identity."
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Workers;
