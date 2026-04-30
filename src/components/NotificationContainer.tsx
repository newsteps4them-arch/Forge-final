import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast, AppNotification } from '../lib/notifications';
import { Info, CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';

export function NotificationContainer() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    const unsubscribe = toast.subscribe((notification) => {
      setNotifications((prev) => [...prev, notification]);

      if (notification.duration && notification.duration > 0) {
        setTimeout(() => {
          dismiss(notification.id);
        }, notification.duration);
      }
    });
    return unsubscribe;
  }, []);

  const dismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`pointer-events-auto p-4 rounded-xl flex items-start gap-3 shadow-2xl border backdrop-blur-md ${getTypeStyles(n.type)}`}
          >
            <div className="mt-0.5">{getIcon(n.type)}</div>
            <p className="flex-1 text-sm font-medium leading-relaxed">{n.message}</p>
            <button 
                onClick={() => dismiss(n.id)}
                className="opacity-60 hover:opacity-100 transition-opacity"
            >
                <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function getTypeStyles(type: AppNotification['type']) {
  switch (type) {
    case 'success': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200';
    case 'error': return 'bg-red-500/10 border-red-500/20 text-red-200';
    case 'warning': return 'bg-amber-500/10 border-amber-500/20 text-amber-200';
    case 'info':
    default: return 'bg-primary/10 border-primary/20 text-primary-content';
  }
}

function getIcon(type: AppNotification['type']) {
  switch (type) {
    case 'success': return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    case 'error': return <AlertCircle className="w-5 h-5 text-red-400" />;
    case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-400" />;
    case 'info':
    default: return <Info className="w-5 h-5 text-primary" />;
  }
}
