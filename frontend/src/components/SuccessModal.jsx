import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';

const SuccessModal = ({ isOpen, onClose, title = "Configuration Committed", message = "System settings have been successfully synchronized with the core ledger." }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="modal-content max-w-sm p-10 bg-card border border-emerald-500/20 shadow-2xl relative"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-emerald-500/10 text-emerald-600 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner animate-pulse">
                <CheckCircle2 size={40} />
              </div>
              
              <h2 className="text-2xl font-black tracking-tight mb-3">{title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                {message}
              </p>

              <button
                onClick={onClose}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl active:scale-95 transition-all shadow-lg shadow-emerald-600/20 mt-10"
              >
                Acknowledge Protocol
              </button>
            </div>

            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SuccessModal;
