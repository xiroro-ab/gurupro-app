import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationItem {
  id: string;
  message: string;
  type: NotificationType;
  title?: string;
  duration?: number;
}

interface NotificationContextProps {
  showNotification: (message: string, type?: NotificationType, title?: string, duration?: number) => void;
  success: (message: string, title?: string, duration?: number) => void;
  error: (message: string, title?: string, duration?: number) => void;
  warn: (message: string, title?: string, duration?: number) => void;
  info: (message: string, title?: string, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showNotification = useCallback(
    (message: string, type: NotificationType = 'info', title?: string, duration = 6000) => {
      const id = Math.random().toString(36).substring(2, 9);
      
      // Map default titles if not provided
      let defaultTitle = title;
      if (!defaultTitle) {
        switch (type) {
          case 'success':
            defaultTitle = 'Berhasil';
            break;
          case 'error':
            defaultTitle = 'Gagal / Error';
            break;
          case 'warning':
            defaultTitle = 'Peringatan';
            break;
          case 'info':
            defaultTitle = 'Informasi';
            break;
        }
      }

      const newItem: NotificationItem = {
        id,
        message,
        type,
        title: defaultTitle,
        duration,
      };

      setNotifications((prev) => [...prev, newItem]);

      if (duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, duration);
      }
    },
    [removeNotification]
  );

  const success = useCallback((message: string, title?: string, duration?: number) => {
    showNotification(message, 'success', title, duration);
  }, [showNotification]);

  const error = useCallback((message: string, title?: string, duration?: number) => {
    showNotification(message, 'error', title, duration);
  }, [showNotification]);

  const warn = useCallback((message: string, title?: string, duration?: number) => {
    showNotification(message, 'warning', title, duration);
  }, [showNotification]);

  const info = useCallback((message: string, title?: string, duration?: number) => {
    showNotification(message, 'info', title, duration);
  }, [showNotification]);

  return (
    <NotificationContext.Provider value={{ showNotification, success, error, warn, info }}>
      {children}
      
      {/* Toast Portal Container */}
      <div 
        id="global-toast-container" 
        className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-md px-4 flex flex-col gap-3 pointer-events-none"
      >
        <AnimatePresence>
          {notifications.map((notif) => {
            let bgColor = 'bg-white';
            let borderColor = 'border-slate-200';
            let textColor = 'text-slate-800';
            let Icon = Info;
            let iconColor = 'text-blue-500';

            switch (notif.type) {
              case 'success':
                bgColor = 'bg-emerald-50';
                borderColor = 'border-emerald-200';
                textColor = 'text-emerald-900';
                Icon = CheckCircle2;
                iconColor = 'text-emerald-600';
                break;
              case 'error':
                bgColor = 'bg-red-50';
                borderColor = 'border-red-200';
                textColor = 'text-red-900';
                Icon = XCircle;
                iconColor = 'text-red-600';
                break;
              case 'warning':
                bgColor = 'bg-amber-50';
                borderColor = 'border-amber-200';
                textColor = 'text-amber-900';
                Icon = AlertTriangle;
                iconColor = 'text-amber-600';
                break;
              case 'info':
                bgColor = 'bg-blue-50';
                borderColor = 'border-blue-200';
                textColor = 'text-blue-900';
                Icon = Info;
                iconColor = 'text-blue-600';
                break;
            }

            return (
              <motion.div
                key={notif.id}
                layout
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.95, transition: { duration: 0.2 } }}
                className={`w-full ${bgColor} border ${borderColor} rounded-2xl p-4 shadow-lg pointer-events-auto flex gap-3.5 relative overflow-hidden`}
              >
                {/* Visual Progress Bar (optional animation indicator) */}
                {notif.duration && notif.duration > 0 && (
                  <motion.div 
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: notif.duration / 1000, ease: 'linear' }}
                    className={`absolute bottom-0 left-0 h-1 bg-current opacity-15`}
                  />
                )}

                <div className={`shrink-0 p-1 rounded-xl bg-white/65 shadow-xs border border-white/40 flex items-center justify-center h-9 w-9`}>
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>

                <div className="flex-1 min-w-0 pr-4">
                  {notif.title && (
                    <h5 className={`text-sm font-bold ${textColor} leading-tight mb-1`}>
                      {notif.title}
                    </h5>
                  )}
                  <p className={`text-xs font-medium ${textColor} opacity-90 leading-relaxed whitespace-pre-wrap break-words`}>
                    {notif.message}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeNotification(notif.id)}
                  className={`shrink-0 self-start p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-black/5 transition-colors cursor-pointer`}
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};
