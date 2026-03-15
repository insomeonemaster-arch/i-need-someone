/**
 * Messaging / Conversations Service
 */

import { apiClient } from './api-client';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  // Backend field is messageType not type
  messageType?: 'text' | 'image' | 'file';
  type?: 'text' | 'image' | 'file';
  attachmentUrl?: string;
  createdAt: string;
  updatedAt: string;
  sender?: {
    id: string;
    firstName?: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

export interface Conversation {
  id: string;
  participant1Id: string;
  participant2Id: string;
  participant1?: { id: string; firstName: string; lastName: string; avatarUrl?: string };
  participant2?: { id: string; firstName: string; lastName: string; avatarUrl?: string };
  // Normalized for screen convenience — built from participant1/participant2
  participants?: Array<{ id: string; displayName: string; avatarUrl?: string }>;
  lastMessage?: Message;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  unreadCount: number;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Normalize backend participant1/participant2 into a participants array
const normalizeConversation = (raw: any): Conversation => {
  const participants: Conversation['participants'] = [];
  if (raw.participant1) {
    participants.push({
      id: raw.participant1.id,
      displayName: `${raw.participant1.firstName} ${raw.participant1.lastName}`.trim(),
      avatarUrl: raw.participant1.avatarUrl,
    });
  }
  if (raw.participant2) {
    participants.push({
      id: raw.participant2.id,
      displayName: `${raw.participant2.firstName} ${raw.participant2.lastName}`.trim(),
      avatarUrl: raw.participant2.avatarUrl,
    });
  }
  // Build a synthetic lastMessage from preview fields if the DB doesn't include it
  const lastMessage: Message | undefined = raw.lastMessage ?? (raw.lastMessagePreview
    ? {
        id: '',
        conversationId: raw.id,
        senderId: '',
        content: raw.lastMessagePreview,
        messageType: 'text',
        createdAt: raw.lastMessageAt ?? raw.updatedAt,
        updatedAt: raw.lastMessageAt ?? raw.updatedAt,
      }
    : undefined);
  return { ...raw, participants, lastMessage, unreadCount: raw.unreadCount ?? 0 };
};

class MessagingService {
  async getConversations(): Promise<Conversation[]> {
    // paginated — api-client unwraps .data to array directly
    const response = await apiClient.get<any[]>('/conversations');
    const raw = Array.isArray(response) ? response : [];
    return raw.map(normalizeConversation);
  }

  async getUnreadCount(): Promise<number> {
    // success(res, { count }) — api-client unwraps to { count }
    const response = await apiClient.get<{ count: number }>('/conversations/unread-count');
    return response.count ?? 0;
  }

  async getConversation(conversationId: string): Promise<Conversation> {
    const raw = await apiClient.get<any>(`/conversations/${conversationId}`);
    return normalizeConversation(raw);
  }

  async createConversation(participantIds: string[]): Promise<Conversation> {
    // Backend expects recipientId (string), not participantIds (array)
    const raw = await apiClient.post<any>('/conversations', { recipientId: participantIds[0] });
    return normalizeConversation(raw);
  }

  async getMessages(
    conversationId: string,
    limit = 50,
    offset = 0,
  ): Promise<Message[]> {
    // paginated — api-client unwraps .data to array directly
    const response = await apiClient.get<Message[]>(
      `/conversations/${conversationId}/messages?perPage=${limit}`,
    );
    return Array.isArray(response) ? response : [];
  }

  async sendMessage(
    conversationId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' = 'text',
  ): Promise<Message> {
    // Backend reads `content` and `messageType`
    return apiClient.post(`/conversations/${conversationId}/messages`, {
      content,
      messageType,
    });
  }

  async deleteMessage(messageId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/conversations/messages/${messageId}`);
  }

  async archiveConversation(conversationId: string): Promise<{ success: boolean }> {
    return apiClient.post(`/conversations/${conversationId}/archive`, {});
  }
}

export const messagingService = new MessagingService();
