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

// Data item returned in list payloads (service request, job, or project)
export interface DataItem {
  id: string;
  entityType: 'service_request' | 'job' | 'project';
  title: string;
  status: string;
  createdAt: string;
  meta: {
    category?: { name: string } | null;
    city?: string;
    state?: string;
    urgency?: string;
    employmentType?: string;
    workLocation?: string;
    budgetMin?: number | null;
    budgetMax?: number | null;
    salaryMin?: number | null;
    salaryMax?: number | null;
    deadline?: string | null;
  };
}

export interface DataListPayload {
  type: 'list';
  entityType: 'service_request' | 'job' | 'project';
  items: Array<Record<string, any>>;
  total: number;
  hasMore: boolean;
}

export interface DataStatsPayload {
  type: 'stats';
  totalEarnings: number;
  thisMonthEarnings: number;
  pendingPayouts: number;
}

export type DataPayload = DataListPayload | DataStatsPayload;

export interface UpdateResult {
  entityType: string;
  entity: Record<string, any>;
}

export interface SendMessageResponse {
  message: InsMessage;
  isComplete: boolean;
  collectedData: Record<string, any> | null;
  quickReplies: string[];
  dataPayload: DataPayload | null;
  updateResult: UpdateResult | null;
}

export interface SubmitConversationResponse {
  entityType: string;
  entity: Record<string, any>;
}

class InsService {
  async startConversation(category: string, mode: string): Promise<StartConversationResponse> {
    return apiClient.post('/ins/conversations', { category: category || null, mode });
  }

  async sendMessage(conversationId: string, content: string): Promise<SendMessageResponse> {
    return apiClient.post(`/ins/conversations/${conversationId}/messages`, { content });
  }

  async submitConversation(conversationId: string): Promise<SubmitConversationResponse> {
    return apiClient.post(`/ins/conversations/${conversationId}/submit`);
  }

  async updateEntity(
    conversationId: string,
    entityType: string,
    entityId: string,
    updateFields: Record<string, any>,
  ): Promise<UpdateResult> {
    return apiClient.patch(`/ins/conversations/${conversationId}/entity`, {
      entity_type: entityType,
      entity_id: entityId,
      update_fields: updateFields,
    });
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
