/**
 * Support Service
 */

import { apiClient } from './api-client';

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  category: 'billing' | 'technical' | 'account' | 'dispute' | 'other';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'normal';
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  // Backend field is `message`, not `content`
  message: string;
  createdAt: string;
}

class SupportService {
  async getFAQs(): Promise<FAQ[]> {
    // success(res, array) — api-client returns array directly
    const response = await apiClient.get<FAQ[]>('/support/faq', false);
    return Array.isArray(response) ? response : [];
  }

  async getFAQ(faqId: string): Promise<FAQ> {
    return apiClient.get(`/support/faq/${faqId}`, false);
  }

  async getTickets(): Promise<SupportTicket[]> {
    // paginated — api-client unwraps to array
    const response = await apiClient.get<SupportTicket[]>('/support/tickets');
    return Array.isArray(response) ? response : [];
  }

  async getTicket(ticketId: string): Promise<SupportTicket> {
    return apiClient.get(`/support/tickets/${ticketId}`);
  }

  async createTicket(data: {
    subject: string;
    description: string;
    category: 'billing' | 'technical' | 'account' | 'dispute' | 'other';
    priority?: 'low' | 'medium' | 'high' | 'normal';
  }): Promise<SupportTicket> {
    return apiClient.post('/support/tickets', data);
  }

  async closeTicket(ticketId: string): Promise<{ message: string }> {
    return apiClient.post(`/support/tickets/${ticketId}/close`);
  }

  async getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
    // success(res, array) — api-client returns array directly
    const response = await apiClient.get<TicketMessage[]>(
      `/support/tickets/${ticketId}/messages`,
    );
    return Array.isArray(response) ? response : [];
  }

  async addTicketMessage(ticketId: string, content: string): Promise<TicketMessage> {
    // Backend reads req.body.message, not req.body.content
    return apiClient.post(`/support/tickets/${ticketId}/messages`, { message: content });
  }
}

export const supportService = new SupportService();
