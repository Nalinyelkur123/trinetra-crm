import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Trash2 } from 'lucide-react';

const DeleteConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  itemName, 
  loading, 
  title = "Confirm Deletion", 
  description = "Are you sure you want to permanently delete this item? This action cannot be undone."
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="modal-content max-w-md p-10 bg-card border border-rose-500/20 shadow-2xl"
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-3xl bg-rose-500/10 text-rose-600 flex items-center justify-center mb-8 shadow-inner">
            <AlertTriangle size={40} />
          </div>
          
          <h2 className="text-2xl font-black tracking-tight mb-3">{title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description.includes('{itemName}') 
              ? description.replace('{itemName}', itemName) 
              : `${description} (${itemName})`}
          </p>

          <div className="w-full h-px bg-border my-8" />

          <div className="flex flex-col w-full gap-4">
            <button
              onClick={onConfirm}
              disabled={loading}
              className="w-full py-4 bg-rose-600 text-white font-black rounded-2xl hover:bg-rose-700 active:scale-95 transition-all shadow-lg shadow-rose-600/20 flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Trash2 size={18} /> Confirm Deletion
                </>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="w-full py-4 bg-secondary text-foreground font-bold rounded-2xl hover:bg-secondary/80 transition-all flex items-center justify-center gap-2"
            >
              Cancel & Retain
            </button>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={20} />
        </button>
      </motion.div>
    </div>
  );
};

export default DeleteConfirmationModal;
