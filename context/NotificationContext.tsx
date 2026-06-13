'use client';

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';

export interface Notification {
  id: string;
  message: string;
  severity: 'info' | 'success' | 'warning' | 'error';
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (message: string, severity?: Notification['severity']) => void;
  removeNotification: (id: string) => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const MAX_NOTIFICATIONS = 5;
const DEDUP_WINDOW_MS = 2000;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const idCounterRef = useRef(0);
  const recentMessagesRef = useRef<Map<string, number>>(new Map());

  const addNotification = useCallback((message: string, severity: Notification['severity'] = 'info') => {
    const now = Date.now();
    // Deduplicate: skip if same message was added recently
    const lastSeen = recentMessagesRef.current.get(message);
    if (lastSeen && now - lastSeen < DEDUP_WINDOW_MS) {
      return;
    }
    recentMessagesRef.current.set(message, now);
    // Clean up old entries
    for (const [msg, ts] of recentMessagesRef.current.entries()) {
      if (now - ts > DEDUP_WINDOW_MS) {
        recentMessagesRef.current.delete(msg);
      }
    }

    const id = `notif-${++idCounterRef.current}-${now}`;
    const notification: Notification = { id, message, severity };

    setNotifications((prev) => {
      const next = [...prev, notification];
      if (next.length > MAX_NOTIFICATIONS) {
        return next.slice(next.length - MAX_NOTIFICATIONS);
      }
      return next;
    });

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
}
