/**
 * Payments Service
 */

import { apiClient } from './api-client';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  brand?: string;
  last4: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'payment' | 'refund' | 'payout' | 'earning';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  description: string;
  referenceId?: string;
  createdAt: string;
}

export interface Payout {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  method: string;
  createdAt: string;
}

// Matches actual backend shape from getEarnings
export interface Earnings {
  totalEarnings: number;
  completedJobs: number;
  pendingEarnings: number;
}

// Matches actual backend shape from getEarningsSummary
export interface EarningsSummary {
  allTime: { earnings: number; jobs: number };
  thisMonth: { earnings: number };
  thisWeek: { earnings: number };
  pending: { earnings: number };
}

export interface ConnectStatus {
  connected: boolean;
  detailsSubmitted?: boolean;
  payoutsEnabled?: boolean;
}

class PaymentsService {
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    // success(res, methods) — api-client returns array directly
    const response = await apiClient.get<PaymentMethod[]>('/payments/methods');
    return Array.isArray(response) ? response : [];
  }

  async addPaymentMethod(paymentMethodId: string): Promise<PaymentMethod> {
    return apiClient.post('/payments/methods', { paymentMethodId });
  }

  async setDefaultPaymentMethod(methodId: string): Promise<{ success: boolean }> {
    return apiClient.post(`/payments/methods/${methodId}/set-default`);
  }

  async deletePaymentMethod(methodId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/payments/methods/${methodId}`);
  }

  async getTransactions(filters?: {
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<Transaction[]> {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.offset) params.append('offset', String(filters.offset));

    // paginated response — api-client unwraps to array
    const response = await apiClient.get<Transaction[]>(
      `/payments/transactions?${params.toString()}`,
    );
    return Array.isArray(response) ? response : [];
  }

  async getTransaction(transactionId: string): Promise<Transaction> {
    return apiClient.get(`/payments/transactions/${transactionId}`);
  }

  async requestRefund(transactionId: string, reason: string): Promise<Transaction> {
    return apiClient.post(`/payments/transactions/${transactionId}/refund`, { reason });
  }

  async getPayouts(): Promise<Payout[]> {
    // paginated response — api-client unwraps to array
    const response = await apiClient.get<Payout[]>('/payments/payouts');
    return Array.isArray(response) ? response : [];
  }

  async requestPayout(amount: number, payoutMethod: string): Promise<Payout> {
    // Backend expects `payoutMethod` (string like 'bank_transfer'), not `methodId`
    return apiClient.post('/payments/payouts/request', { amount, payoutMethod });
  }

  async getEarnings(): Promise<Earnings> {
    return apiClient.get('/payments/earnings');
  }

  async getEarningsSummary(): Promise<EarningsSummary> {
    return apiClient.get('/payments/earnings/summary');
  }

  async getConnectStatus(): Promise<ConnectStatus> {
    return apiClient.get('/payments/connect/status');
  }

  async createConnectAccount(): Promise<{ url: string }> {
    // Backend returns { url } not { accountLink }
    return apiClient.post('/payments/connect/account');
  }
}

export const paymentsService = new PaymentsService();
