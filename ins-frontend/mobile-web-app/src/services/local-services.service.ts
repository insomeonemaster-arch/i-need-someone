/**
 * Local Services (Requests & Quotes) Service
 */

import { apiClient } from './api-client';

export interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'open' | 'quoted' | 'accepted' | 'in-progress' | 'completed' | 'cancelled';
  clientId: string;
  client?: { id: string; firstName?: string; lastName?: string; avatarUrl?: string };
  assignedProvider?: {
    id: string;
    user?: { id: string; firstName?: string; lastName?: string; avatarUrl?: string };
  };
  budget?: {
    min: number;
    max: number;
    currency: string;
  };
  location?: {
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Quote {
  id: string;
  requestId: string;
  providerId: string;
  price: number;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceRequestRequest {
  title: string;
  description: string;
  // Use categoryId (UUID) for backend — the frontend can pass the ID directly
  categoryId: string;
  urgency?: 'low' | 'medium' | 'high' | 'emergency';
  budgetMin?: number;
  budgetMax?: number;
  budgetType?: 'fixed' | 'hourly' | 'negotiable';
  // Location fields flattened to match backend schema
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  preferredDate?: string;
  images?: string[];
}

// Map flat Prisma budget fields → nested budget object used by screens
const normalizeServiceRequest = (raw: any): ServiceRequest => ({
  ...raw,
  category: typeof raw.category === 'object' && raw.category !== null
    ? raw.category.name
    : raw.category,
  budget: raw.budget ?? (raw.budgetMin != null
    ? { min: raw.budgetMin, max: raw.budgetMax ?? 0, currency: raw.budgetType ?? 'fixed' }
    : undefined),
});

class LocalServicesService {
  async browse(filters?: {
    category?: string;
    location?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.location) params.append('location', filters.location);
    if (filters?.limit) params.append('perPage', String(filters.limit));

    // paginated response
    const response = await apiClient.get<any[]>(`/local-services/browse?${params.toString()}`);
    return Array.isArray(response) ? response : [];
  }

  async getRequests(): Promise<ServiceRequest[]> {
    // paginated response
    const response = await apiClient.get<ServiceRequest[]>('/local-services/requests');
    return Array.isArray(response) ? response.map(normalizeServiceRequest) : [];
  }

  async createRequest(data: CreateServiceRequestRequest): Promise<ServiceRequest> {
    return apiClient.post('/local-services/requests', data);
  }

  async getRequest(requestId: string): Promise<ServiceRequest> {
    const raw = await apiClient.get<any>(`/local-services/requests/${requestId}`);
    return normalizeServiceRequest(raw);
  }

  async updateRequest(
    requestId: string,
    data: Partial<CreateServiceRequestRequest>,
  ): Promise<ServiceRequest> {
    return apiClient.put(`/local-services/requests/${requestId}`, data);
  }

  async cancelRequest(requestId: string): Promise<{ success: boolean }> {
    return apiClient.post(`/local-services/requests/${requestId}/cancel`, {});
  }

  async getQuotes(requestId: string): Promise<Quote[]> {
    // success(res, quotes) array — api-client returns array directly
    const response = await apiClient.get<Quote[]>(
      `/local-services/requests/${requestId}/quotes`,
    );
    return Array.isArray(response) ? response : [];
  }

  async createQuote(
    requestId: string,
    data: {
      price: number;
      message: string;
      pricingType?: 'fixed' | 'hourly' | 'per-item';
      estimatedHours?: number;
      availabilityDate?: string;
      completionEstimate?: string;
    },
  ): Promise<Quote> {
    return apiClient.post(`/local-services/requests/${requestId}/quotes`, data);
  }

  async acceptQuote(quoteId: string): Promise<Quote> {
    return apiClient.post(`/local-services/quotes/${quoteId}/accept`, {});
  }

  async rejectQuote(quoteId: string): Promise<Quote> {
    return apiClient.post(`/local-services/quotes/${quoteId}/reject`, {});
  }

  // For providers: browse open service requests posted by clients
  async browseOpenRequests(filters?: { categoryId?: string; q?: string; limit?: number }): Promise<ServiceRequest[]> {
    const params = new URLSearchParams();
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    if (filters?.q) params.append('q', filters.q);
    if (filters?.limit) params.append('perPage', String(filters.limit));
    const response = await apiClient.get<ServiceRequest[]>(`/local-services/requests/browse?${params.toString()}`);
    return Array.isArray(response) ? response.map(normalizeServiceRequest) : [];
  }
}

export const localServicesService = new LocalServicesService();
