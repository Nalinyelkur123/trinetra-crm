import { motion } from 'framer-motion';
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
        transition={{ duration: 0.3 }}
        className="modal-content max-w-md p-10 bg-card border border-rose-500/20 shadow-2xl backdrop-blur-sm relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-rose-500/10 blur-[80px] rounded-full -z-10" />
        
        <div className="flex flex-col items-center text-center relative z-10">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-rose-500/20 to-rose-500/5 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-8 shadow-lg"
          >
            <motion.div animate={{ rotate: [-5, 5, -5] }} transition={{ duration: 0.5, repeat: Infinity }}>
              <AlertTriangle size={40} />
            </motion.div>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-2xl font-black tracking-tight mb-3"
          >
            {title}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-muted-foreground leading-relaxed"
          >
            {description.includes('{itemName}') 
              ? description.replace('{itemName}', itemName) 
              : `${description} (${itemName})`}
          </motion.p>

          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.25 }}
            className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent my-8 origin-left"
          />

          <motion.div 
            className="flex flex-col w-full gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onConfirm}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-rose-600 to-rose-600/80 text-white font-black rounded-2xl transition-all shadow-lg shadow-rose-600/20 hover:shadow-rose-600/30 flex items-center justify-center gap-3"
            >
              {loading ? (
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <>
                  <Trash2 size={18} /> Confirm Deletion
                </>
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              disabled={loading}
              className="w-full py-4 bg-secondary/50 text-foreground font-bold rounded-2xl hover:bg-secondary/80 transition-all flex items-center justify-center gap-2 border border-border/50 hover:border-border"
            >
              Cancel & Retain
            </motion.button>
          </motion.div>
        </div>

        <motion.button 
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-all"
        >
          <X size={20} />
        </motion.button>
      </motion.div>
    </div>
  );
};

export default DeleteConfirmationModal;
