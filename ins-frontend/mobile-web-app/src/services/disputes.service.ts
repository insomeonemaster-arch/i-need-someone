/**
 * Disputes Service
 */

import { apiClient } from './api-client';

export interface Dispute {
  id: string;
  filedByUserId: string;
  filedAgainstUserId?: string;
  transactionId?: string;
  contextType?: string;
  contextId?: string;
  reason: string;
  description: string;
  evidence?: string[];
  status: 'open' | 'under_review' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface CreateDisputeRequest {
  filedAgainstUserId?: string;
  transactionId?: string;
  contextType?: string;
  contextId?: string;
  reason: string;
  description: string;
  evidence?: string[];
}

class DisputesService {
  async createDispute(data: CreateDisputeRequest): Promise<Dispute> {
    return apiClient.post('/disputes', data);
  }

  async getDisputes(): Promise<Dispute[]> {
    const response = await apiClient.get<Dispute[]>('/disputes');
    return Array.isArray(response) ? response : [];
  }

  async getDispute(disputeId: string): Promise<Dispute> {
    return apiClient.get(`/disputes/${disputeId}`);
  }

  async addEvidence(disputeId: string, evidence: string[]): Promise<Dispute> {
    return apiClient.post(`/disputes/${disputeId}/evidence`, { evidence });
  }
}

export const disputesService = new DisputesService();
