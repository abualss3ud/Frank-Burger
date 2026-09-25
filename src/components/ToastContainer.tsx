import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ToastContainer: React.FC = () => {
  const { toasts } = useApp();

  return (
    <div className="fixed bottom-4 start-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border ${
                isSuccess
                  ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-400'
                  : isError
                  ? 'bg-rose-950/90 border-rose-500/50 text-rose-400'
                  : 'bg-zinc-900/90 border-zinc-700 text-zinc-200'
              } backdrop-blur-md`}
            >
              <div className="shrink-0">
                {isSuccess && <CheckCircle2 className="w-5 h-5" />}
                {isError && <AlertTriangle className="w-5 h-5" />}
                {!isSuccess && !isError && <Info className="w-5 h-5" />}
              </div>
              <div className="flex-1 text-sm font-bold font-sans">
                {toast.message}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
