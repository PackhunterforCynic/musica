import React, { useEffect, useState } from 'react';
import { notificationService, ToastMessage } from '../../services/NotificationService';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((list) => {
      setToasts([...list]);
    });
    return () => unsubscribe();
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-5 z-50 flex flex-col space-y-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
          info: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
        };

        const borderColors = {
          success: 'border-emerald-500/30',
          error: 'border-rose-500/30',
          warning: 'border-amber-500/30',
          info: 'border-sky-500/30',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-2xl glass-panel border ${borderColors[toast.type]} flex items-start space-x-3 transition-all animate-in fade-in slide-in-from-top-3 duration-200`}
          >
            {icons[toast.type]}
            <div className="flex-1 min-w-0">
              {toast.title && <p className="text-xs font-bold text-slate-200 tracking-wide uppercase mb-0.5">{toast.title}</p>}
              <p className="text-sm font-medium text-slate-300 leading-snug break-words">{toast.message}</p>
            </div>
            <button
              onClick={() => notificationService.dismissToast(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
