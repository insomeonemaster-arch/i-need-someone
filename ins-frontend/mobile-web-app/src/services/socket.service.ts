/**
 * Socket.io Service for Real-time Communication
 */

import { io, Socket } from 'socket.io-client';
import { API_CONFIG, STORAGE_KEYS } from './config';

export interface SocketEvents {
  'user:online': { userId: string };
  'user:offline': { userId: string };
  'message:new': {
    conversationId: string;
    senderId: string;
    content: string;
    type: 'text' | 'image' | 'file';
    createdAt: string;
  };
  'conversation:updated': { conversationId: string };
  'connection': void;
  'disconnect': void;
  'connect_error': Error;
}

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  /**
   * Connect to Socket.io server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (!token) {
        reject(new Error('No authentication token found'));
        return;
      }

      this.socket = io(API_CONFIG.socketURL, {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      this.socket.on('connect', () => {
        console.log('[Socket] Connected');
        this.emitToListeners('connection', undefined);
        resolve();
      });

      this.socket.on('connect_error', (error: Error) => {
        console.error('[Socket] Connection error:', error);
        this.emitToListeners('connect_error', error);
        reject(error);
      });

      this.socket.on('disconnect', () => {
        console.log('[Socket] Disconnected');
        this.emitToListeners('disconnect', undefined);
      });

      // Set up event listeners
      this.setupEventListeners();
    });
  }

  /**
   * Disconnect from Socket.io server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Setup all socket event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('user:online', (data: any) => this.emitToListeners('user:online', data));
    this.socket.on('user:offline', (data: any) => this.emitToListeners('user:offline', data));
    this.socket.on('message:new', (data: any) => this.emitToListeners('message:new', data));
    this.socket.on('conversation:updated', (data: any) => this.emitToListeners('conversation:updated', data));
  }

  /**
   * Subscribe to socket event
   */
  on<K extends keyof SocketEvents>(
    event: K,
    callback: (data: SocketEvents[K]) => void,
  ): () => void {
    const key = event as string;
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }

    this.listeners.get(key)!.add(callback as Function);

    // Return unsubscribe function
    return () => {
      this.listeners.get(key)?.delete(callback as Function);
    };
  }

  /**
   * Emit event to listeners
   */
  private emitToListeners<K extends keyof SocketEvents>(event: K, data: SocketEvents[K]): void {
    const callbacks = this.listeners.get(event as string);
    if (callbacks) {
      callbacks.forEach((callback) => (callback as Function)(data));
    }
  }

  /**
   * Emit event to server
   */
  emitToServer(event: string, data?: any): void {
    if (!this.socket) {
      console.warn(`[Socket] Socket not connected, cannot emit event: ${event}`);
      return;
    }
    this.socket.emit(event, data);
  }

  /**
   * Join conversation room
   */
  joinConversation(conversationId: string): void {
    this.emitToServer('conversation:join', conversationId);
  }

  leaveConversation(conversationId: string): void {
    this.emitToServer('conversation:leave', conversationId);
  }

  /**
   * Send message via socket
   */
  sendMessage(conversationId: string, content: string, type: 'text' | 'image' | 'file' = 'text'): void {
    this.emitToServer('message:send', { conversationId, content, type });
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
