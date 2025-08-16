import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { WebSocketMessage } from '../types';

interface SocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  sendMessage: (message: WebSocketMessage) => void;
  subscribe: (type: string, handler: (data: any) => void) => () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const handlersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setSocket(ws);
      // Store socket instance globally for components to use
      (window as any).socketInstance = ws;
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setSocket(null);
      (window as any).socketInstance = null;
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const handlers = handlersRef.current.get(message.type);
        if (handlers) {
          handlers.forEach(handler => {
            try {
              handler(message);
            } catch (handlerError) {
              console.error('Error in WebSocket message handler:', handlerError);
            }
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    return () => {
      ws.close();
      (window as any).socketInstance = null;
    };
  }, []);

  const sendMessage = (message: WebSocketMessage) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  };

  const subscribe = (type: string, handler: (data: any) => void) => {
    const handlers = handlersRef.current.get(type) || new Set();
    handlers.add(handler);
    handlersRef.current.set(type, handlers);
    
    return () => {
      const currentHandlers = handlersRef.current.get(type);
      if (currentHandlers) {
        currentHandlers.delete(handler);
      }
    };
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, sendMessage, subscribe }}>
      {children}
    </SocketContext.Provider>
  );
}
