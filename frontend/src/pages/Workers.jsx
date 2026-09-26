import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Users, Search, Plus, Eye, Edit2, Trash2, AlertCircle, RefreshCw, Briefcase, ShieldCheck, Mail, Phone, MapPin, Building2,
  X, Check, UserCheck
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

  // Dynamic Assign Client States
  const [availableClients, setAvailableClients] = useState([]);
  const [clientAssignments, setClientAssignments] = useState([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningWorker, setAssigningWorker] = useState(null);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);
  
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
      const [workersRes, clientsRes, assignmentsRes] = await Promise.all([
        axios.get('/api/workers'),
        axios.get('/api/clients'),
        axios.get('/api/assignments')
      ]);
      setWorkers(Array.isArray(workersRes.data) ? workersRes.data : []);
      setAvailableClients(Array.isArray(clientsRes.data) ? clientsRes.data : []);
      setClientAssignments(Array.isArray(assignmentsRes.data) ? assignmentsRes.data : []);
    } catch (err) {
      const errData = err.response?.data?.error;
      setError((typeof errData === 'object' ? errData?.message : errData) || 'Failed to fetch workers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const openAssignModal = (worker) => {
    setAssigningWorker(worker);
    setSelectedClientId(worker.client_id || '');
    setSelectedAssignmentId(worker.assignment_id || '');
    setIsAssignModalOpen(true);
  };

  const handleSaveClientAssignment = async (e) => {
    e.preventDefault();
    if (!assigningWorker) return;
    setIsSavingAssignment(true);
    try {
      const payload = {
        client_id: selectedClientId || null,
        assignment_id: selectedAssignmentId || null
      };
      const res = await axios.put(`/api/workers/${assigningWorker.id}`, payload);
      
      const chosenClient = availableClients.find(c => String(c.id || c._id) === String(selectedClientId));
      const chosenAssignment = clientAssignments.find(a => String(a.id || a._id) === String(selectedAssignmentId));

      // Dynamically update the worker in table state in real-time
      setWorkers(prev => prev.map(w => {
        if (w.id === assigningWorker.id) {
          return {
            ...w,
            client_id: res.data?.client_id || selectedClientId || null,
            client_name: res.data?.client_name !== undefined ? res.data.client_name : (chosenClient ? chosenClient.name : null),
            assignment_id: res.data?.assignment_id || selectedAssignmentId || null,
            assignment_name: res.data?.assignment_name !== undefined ? res.data.assignment_name : (chosenAssignment ? chosenAssignment.name : null)
          };
        }
        return w;
      }));

      setIsAssignModalOpen(false);
      setAssigningWorker(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to assign client to worker');
    } finally {
      setIsSavingAssignment(false);
    }
  };

  const handleViewDetails = async (id) => {
    setIsDetailsLoading(true);
    try {
      const res = await axios.get(`/api/workers/${id}`);
      setSelectedWorker(res.data);
    } catch (err) {
      alert('Failed to retrieve worker details.');
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
      alert('Deletion failed.');
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
          <h1 className="text-3xl font-black tracking-tight">Workers</h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">Worker management</p>
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
              placeholder="Search workers..." 
              className="input-field pl-10 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Link to="/admin/workers/new" className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Add Worker
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
                <th className="px-8 py-5 caption">Worker</th>
                <th className="px-8 py-5 caption">Job Role</th>
                <th className="px-8 py-5 caption">Client</th>
                <th className="px-8 py-5 caption">Verification</th>
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
                      {worker.job_role || 'Worker'}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Building2 size={16} className={worker.client_name ? "text-primary" : "text-muted-foreground/50"} />
                        <div>
                          <p className={`text-sm font-bold ${worker.client_name ? "text-foreground" : "text-muted-foreground"}`}>
                            {worker.client_name || 'No Client Assigned'}
                          </p>
                          {worker.assignment_name && (
                            <p className="text-[10px] text-primary font-semibold mt-0.5">
                              Site: {worker.assignment_name}
                            </p>
                          )}
                        </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          openAssignModal(worker);
                        }}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-sm shrink-0 flex items-center gap-1.5"
                        title="Assign or Change Client"
                      >
                        <UserCheck size={13} />
                        <span>{worker.client_name ? 'Change' : 'Assign'}</span>
                      </button>
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
                          openAssignModal(worker);
                        }}
                        className="p-2.5 bg-secondary rounded-xl text-muted-foreground hover:text-primary transition-all"
                        title="Assign Client"
                      >
                        <Building2 size={18} />
                      </button>
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
                        title="Delete Worker"
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
        {/* Assign Client Modal */}
        {isAssignModalOpen && assigningWorker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-foreground">Assign Client</h3>
                    <p className="text-xs text-muted-foreground">Dynamic workforce client allocation</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setIsAssignModalOpen(false); setAssigningWorker(null); }}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveClientAssignment} className="p-6 space-y-6">
                <div className="p-4 rounded-2xl bg-secondary/40 border border-border flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg">
                    {assigningWorker.name ? assigningWorker.name[0] : 'W'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{assigningWorker.name}</p>
                    <p className="text-xs text-muted-foreground">{assigningWorker.job_role || 'Worker'} • TRN-{assigningWorker.id}</p>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-primary font-medium">
                      <span>Currently:</span>
                      <span className="font-bold">{assigningWorker.client_name || 'No Client Assigned'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="caption ml-1 font-bold flex items-center gap-1.5">
                    <Building2 size={13} className="text-primary" /> Select Client *
                  </label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => {
                      setSelectedClientId(e.target.value);
                      setSelectedAssignmentId('');
                    }}
                    className="input-field w-full appearance-none py-3"
                    required
                  >
                    <option value="">-- No Client (Unassigned Pool) --</option>
                    {availableClients.map(c => (
                      <option key={c.id || c._id} value={c.id || c._id}>
                        {c.name} {c.contact_person ? `(${c.contact_person})` : ''}
                      </option>
                    ))}
                  </select>
                  {availableClients.length === 0 && (
                    <p className="text-xs text-amber-500 font-medium">No clients found in the database. Please add a client first.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="caption ml-1 font-bold flex items-center gap-1.5">
                    <Briefcase size={13} className="text-primary" /> Operational Site / Project (Optional)
                  </label>
                  <select
                    value={selectedAssignmentId}
                    onChange={(e) => setSelectedAssignmentId(e.target.value)}
                    className="input-field w-full appearance-none py-3"
                    disabled={!selectedClientId}
                  >
                    <option value="">-- General Client Deployment --</option>
                    {clientAssignments
                      .filter(a => {
                        const aClientId = a.client_id?._id || a.client_id;
                        return String(aClientId) === String(selectedClientId);
                      })
                      .map(a => (
                        <option key={a.id || a._id} value={a.id || a._id}>
                          {a.name} {a.location ? `• ${a.location}` : ''}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setIsAssignModalOpen(false); setAssigningWorker(null); }}
                    className="flex-1 py-3 px-4 bg-secondary text-foreground font-bold rounded-xl hover:bg-secondary/80 transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingAssignment}
                    className="flex-1 py-3 px-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                  >
                    {isSavingAssignment ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
                    {isSavingAssignment ? 'Saving...' : 'Update Assignment'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

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
            title="Confirm Delete Worker"
            description="You are about to permanently delete {itemName}. This action will remove all records associated with this worker."
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Workers;
