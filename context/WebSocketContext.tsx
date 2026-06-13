'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';

interface WebSocketContextType {
  subscribe: (channel: string, callback: (event: any) => void) => void;
  unsubscribe: (channel: string, callback: (event: any) => void) => void;
  isConnected: boolean;
}

export const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

const WS_URL = (() => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  return apiUrl.replace(/^http/, 'ws') + '/ws/events';
})();

const RECONNECT_DELAY_BASE = 1000;
const MAX_RECONNECT_DELAY = 30000;

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectDelayRef = useRef(RECONNECT_DELAY_BASE);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subscribersRef = useRef<Map<string, Set<(event: any) => void>>>(new Map());
  const subscribedChannelsRef = useRef<Set<string>>(new Set());

  const connect = useCallback(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    // Don't connect if already connected or connecting
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    // Clear any pending reconnect timer
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        // Send auth message immediately
        const token = localStorage.getItem('accessToken');
        if (token) {
          ws.send(JSON.stringify({ action: 'auth', token }));
        }
        setIsConnected(true);
        reconnectDelayRef.current = RECONNECT_DELAY_BASE;
        // Re-subscribe to previously subscribed channels
        for (const channel of subscribedChannelsRef.current) {
          ws.send(JSON.stringify({ action: 'subscribe', channel }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const eventType = data.event_type || '';
          const isMoveEvent = eventType.endsWith('.moved');
          
          // Determine channels to dispatch to
          const channelsToDispatch: string[] = [];
          const destChannel = data.folder_id ? `folder:${data.folder_id}` : 'global';
          channelsToDispatch.push(destChannel);
          
          // For move events, also dispatch to source folder
          if (isMoveEvent && data.payload?.source_folder_id) {
            const sourceChannel = `folder:${data.payload.source_folder_id}`;
            if (sourceChannel !== destChannel) {
              channelsToDispatch.push(sourceChannel);
            }
          }
          
          for (const channel of channelsToDispatch) {
            const callbacks = subscribersRef.current.get(channel);
            if (callbacks) {
              for (const cb of callbacks) {
                try {
                  cb(data);
                } catch {
                  // ignore
                }
              }
            }
          }
          
          // Also dispatch to global subscribers
          const globalCallbacks = subscribersRef.current.get('global');
          if (globalCallbacks) {
            for (const cb of globalCallbacks) {
              try {
                cb(data);
              } catch {
                // ignore
              }
            }
          }
        } catch {
          // ignore
        }
      };

      ws.onclose = () => {
        // Only clear the ref if this is the current connection
        if (wsRef.current === ws) {
          wsRef.current = null;
          setIsConnected(false);
        }
        // Schedule reconnect
        const delay = reconnectDelayRef.current;
        reconnectDelayRef.current = Math.min(delay * 2, MAX_RECONNECT_DELAY);
        reconnectTimerRef.current = setTimeout(() => {
          connect();
        }, delay);
      };

      ws.onerror = () => {
        // onclose will handle reconnect
      };
    } catch {
      // Schedule reconnect
      const delay = reconnectDelayRef.current;
      reconnectDelayRef.current = Math.min(delay * 2, MAX_RECONNECT_DELAY);
      reconnectTimerRef.current = setTimeout(() => {
        connect();
      }, delay);
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const subscribe = useCallback((channel: string, callback: (event: any) => void) => {
    const subs = subscribersRef.current;
    if (!subs.has(channel)) {
      subs.set(channel, new Set());
    }
    subs.get(channel)!.add(callback);
    subscribedChannelsRef.current.add(channel);

    // If connected, send subscribe message
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'subscribe', channel }));
    }
  }, []);

  const unsubscribe = useCallback((channel: string, callback: (event: any) => void) => {
    const subs = subscribersRef.current;
    const channelSubs = subs.get(channel);
    if (channelSubs) {
      channelSubs.delete(callback);
      if (channelSubs.size === 0) {
        subs.delete(channel);
        subscribedChannelsRef.current.delete(channel);
        // If connected, send unsubscribe message
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ action: 'unsubscribe', channel }));
        }
      }
    }
  }, []);

  return (
    <WebSocketContext.Provider value={{ subscribe, unsubscribe, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) throw new Error('useWebSocket must be used within WebSocketProvider');
  return context;
}
