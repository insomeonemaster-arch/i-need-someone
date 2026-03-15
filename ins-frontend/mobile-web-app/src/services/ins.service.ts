/**
 * INS (I Need Someone) Conversation Service
 * Handles AI-driven intake conversations with the backend.
 */

import { apiClient } from './api-client';

export interface InsConversation {
  id: string;
  userId: string;
  conversationType: string;
  category: string;
  mode: string;
  status: 'active' | 'completed' | 'abandoned';
  collectedData: Record<string, any> | null;
  lastInteractionAt: string;
  createdAt: string;
}

export interface InsMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface StartConversationResponse {
  conversation: InsConversation;
  greeting: string;
}

export interface SendMessageResponse {
  message: InsMessage;
  isComplete: boolean;
  collectedData: Record<string, any> | null;
}

export interface SubmitConversationResponse {
  entityType: string;
  entity: Record<string, any>;
}

class InsService {
  async startConversation(category: string, mode: string): Promise<StartConversationResponse> {
    return apiClient.post('/ins/conversations', { category, mode });
  }

  async sendMessage(conversationId: string, content: string): Promise<SendMessageResponse> {
    return apiClient.post(`/ins/conversations/${conversationId}/messages`, { content });
  }

  async submitConversation(conversationId: string): Promise<SubmitConversationResponse> {
    return apiClient.post(`/ins/conversations/${conversationId}/submit`);
  }

  async getMessages(conversationId: string): Promise<InsMessage[]> {
    const response = await apiClient.get<InsMessage[]>(`/ins/conversations/${conversationId}/messages`);
    return Array.isArray(response) ? response : [];
  }

  async getConversations(): Promise<InsConversation[]> {
    const response = await apiClient.get<InsConversation[]>('/ins/conversations');
    return Array.isArray(response) ? response : [];
  }
}

export const insService = new InsService();
