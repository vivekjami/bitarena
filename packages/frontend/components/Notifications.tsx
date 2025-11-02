'use client';

import { useAppStore } from '@/lib/store';
import { useEffect } from 'react';

type Notification = {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
};

/**
 * Toast notification component that displays app-wide notifications
 * Automatically removes notifications after 5 seconds
 */
export function Notifications() {
  const notifications = useAppStore((state) => state.notifications.notifications);
  const removeNotification = useAppStore((state) => state.removeNotification);

  useEffect(() => {
    // Auto-remove notifications after 5 seconds
    notifications.forEach((notification: Notification) => {
      const timer = setTimeout(() => {
        removeNotification(notification.id);
      }, 5000);

      return () => clearTimeout(timer);
    });
  }, [notifications, removeNotification]);

  if (notifications.length === 0) return null;

  const typeStyles = {
    success: 'bg-green-500/20 border-green-500/50 text-green-400',
    error: 'bg-red-500/20 border-red-500/50 text-red-400',
    warning: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400',
    info: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400',
  };

  const typeIcons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            pointer-events-auto
            p-4 rounded-xl border-2
            backdrop-blur-xl
            shadow-lg
            animate-slide-in-right
            ${typeStyles[notification.type]}
          `}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">
              {typeIcons[notification.type]}
            </span>
            <div className="flex-1">
              <p className="font-semibold text-sm mb-1">
                {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
              </p>
              <p className="text-sm opacity-90">
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="text-white/50 hover:text-white transition-colors shrink-0"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
