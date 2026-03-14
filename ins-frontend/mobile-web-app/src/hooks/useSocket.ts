/**
 * Socket.io Hook for React
 */

import { useEffect, useRef, useCallback } from 'react';
import { socketService, type SocketEvents } from '../services/socket.service';

export function useSocket() {
  const unsubscribesRef = useRef<Array<() => void>>([]);

  // Connect on mount
  useEffect(() => {
    if (!socketService.isConnected()) {
      socketService.connect().catch((error: Error) => {
        console.error('Failed to connect socket:', error);
      });
    }

    return () => {
      // Cleanup unsubscribes on unmount
      unsubscribesRef.current.forEach((unsubscribe: () => void) => unsubscribe());
      unsubscribesRef.current = [];
    };
  }, []);

  /**
   * Subscribe to socket event
   */
  const on = useCallback(<K extends keyof SocketEvents>(
    event: K,
    callback: (data: SocketEvents[K]) => void,
  ) => {
    const unsubscribe = socketService.on(event, callback);
    unsubscribesRef.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  /**
   * Emit socket event to server
   */
  const emit = useCallback((event: string, data?: any) => {
    socketService.emitToServer(event, data);
  }, []);

  return {
    socket: socketService,
    on,
    emit,
    isConnected: socketService.isConnected(),
  };
}
