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
        className={`modal-content max-w-md p-10 bg-card border ${isDanger ? 'border-rose-500/20' : 'border-primary/20'} shadow-2xl`}
      >
        <div className="flex flex-col items-center text-center">
          <div className={`w-20 h-20 rounded-3xl ${isDanger ? 'bg-rose-500/10 text-rose-600' : 'bg-primary/10 text-primary'} flex items-center justify-center mb-8 shadow-inner`}>
            {isDanger ? <AlertTriangle size={40} /> : <CheckCircle2 size={40} />}
          </div>
          
          <h2 className="text-2xl font-black tracking-tight mb-3">{title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description.includes('{itemName}') 
              ? description.replace('{itemName}', itemName) 
              : `${description} ${itemName ? `(${itemName})` : ''}`}
          </p>

          <div className="w-full h-px bg-border my-8" />

          <div className="flex flex-col w-full gap-4">
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`w-full py-4 ${isDanger ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' : 'bg-primary hover:bg-primary/90 shadow-primary/20'} text-white font-black rounded-2xl active:scale-95 transition-all shadow-lg flex items-center justify-center gap-3`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                   {confirmText}
                </>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="w-full py-4 bg-secondary text-foreground font-bold rounded-2xl hover:bg-secondary/80 transition-all flex items-center justify-center gap-2"
            >
              {cancelText}
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

export default ActionConfirmationModal;
