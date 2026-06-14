import { motion } from 'framer-motion';
import { X, CheckCircle2, AlertTriangle } from 'lucide-react';

const ActionConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  itemName, 
  loading, 
  title = "Confirm Action", 
  description = "Are you sure you want to proceed with this action?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary" // 'primary' | 'danger'
}) => {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div className="modal-overlay">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3 }}
        className={`modal-content max-w-md p-10 bg-card border shadow-2xl backdrop-blur-sm ${isDanger ? 'border-rose-500/20' : 'border-primary/20'}`}
      >
        <div className="flex flex-col items-center text-center relative">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-8 shadow-lg ${isDanger ? 'bg-gradient-to-br from-rose-500/20 to-rose-500/5 text-rose-600 dark:text-rose-400' : 'bg-gradient-to-br from-primary/20 to-primary/5 text-primary'}`}
          >
            {isDanger ? <AlertTriangle size={40} /> : <CheckCircle2 size={40} />}
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
              : `${description} ${itemName ? `(${itemName})` : ''}`}
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
              className={`w-full py-4 text-white font-black rounded-2xl transition-all shadow-lg flex items-center justify-center gap-3 ${isDanger ? 'bg-gradient-to-r from-rose-600 to-rose-600/80 hover:shadow-rose-600/30 shadow-rose-600/20' : 'bg-gradient-to-r from-primary to-primary/80 hover:shadow-primary/30 shadow-primary/20'}`}
            >
              {loading ? (
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" 
                />
              ) : (
                confirmText
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              disabled={loading}
              className="w-full py-4 bg-secondary/50 text-foreground font-bold rounded-2xl hover:bg-secondary/80 transition-all flex items-center justify-center gap-2 border border-border/50 hover:border-border"
            >
              {cancelText}
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

export default ActionConfirmationModal;
