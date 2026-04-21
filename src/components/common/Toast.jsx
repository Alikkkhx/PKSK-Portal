import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, CheckCircle2, AlertCircle } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '320px', width: 'calc(100% - 40px)' }}>
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className="glass-card"
              style={{ 
                padding: '12px 16px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                borderLeft: `4px solid ${t.type === 'error' ? '#ff4757' : t.type === 'success' ? '#36b37e' : 'var(--neon-blue)'}`
              }}
            >
              {t.type === 'success' ? <CheckCircle2 size={20} color="#36b37e" /> : t.type === 'error' ? <AlertCircle size={20} color="#ff4757" /> : <Info size={20} color="var(--neon-blue)" />}
              <p style={{ fontSize: '13px', flex: 1 }}>{t.message}</p>
              <button onClick={() => removeToast(t.id)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
