import { useState, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';

export const ToastItem = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div className={`toast-item toast-${toast.type}`}>
      <span className="toast-message">{toast.message}</span>
      <div className="toast-actions">
        {toast.action && (
          <button className="toast-action-btn" onClick={() => { toast.action(); onDismiss(toast.id); }}>
            {toast.actionLabel}
          </button>
        )}
        <button className="toast-close-btn" onClick={() => onDismiss(toast.id)} aria-label="Dismiss notification">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', options = {}) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const duration = options.duration || (type === 'undo' ? 8000 : 4000);
    setToasts(prev => [...prev, { id, message, type, action: options.action, actionLabel: options.actionLabel || 'Undo', duration }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}
