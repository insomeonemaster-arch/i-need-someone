/**
 * Search Service
 */

import { apiClient } from './api-client';

// Actual backend response shape for global search
export interface GlobalSearchResult {
  providers: any[];
  jobs: any[];
  projects: any[];
}

// Generic result type for provider/job/project searches
export interface SearchResult {
  type: 'user' | 'job' | 'project' | 'service-request';
  id: string;
  title: string;
  description: string;
  score: number;
  data: Record<string, any>;
}

export interface SearchFilters {
  query?: string;
  type?: 'all' | 'users' | 'jobs' | 'projects' | 'service-requests';
  location?: string;
  category?: string;
  skills?: string[];
  budgetMin?: number;
  budgetMax?: number;
  limit?: number;
  offset?: number;
}

class SearchService {
  /**
   * Global search — returns { providers, jobs, projects }
   */
  async search(filters: SearchFilters): Promise<GlobalSearchResult> {
    const params = new URLSearchParams();

    if (filters.query) params.append('q', filters.query);
    if (filters.type && filters.type !== 'all') params.append('type', filters.type);
    if (filters.location) params.append('location', filters.location);
    if (filters.category) params.append('category', filters.category);
    if (filters.skills?.length) params.append('skills', filters.skills.join(','));
    if (filters.budgetMin) params.append('budgetMin', String(filters.budgetMin));
    if (filters.budgetMax) params.append('budgetMax', String(filters.budgetMax));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.offset) params.append('offset', String(filters.offset));

    const response = await apiClient.get<GlobalSearchResult>(`/search?${params.toString()}`);
    return response ?? { providers: [], jobs: [], projects: [] };
  }

  /**
   * Autocomplete — backend route is /search/autocomplete, not /search/quick
   */
  async quickSearch(query: string, limit = 5): Promise<any[]> {
    const response = await apiClient.get<any[]>(
      `/search/autocomplete?q=${encodeURIComponent(query)}&limit=${limit}`,
    );
    return Array.isArray(response) ? response : [];
  }

  /**
   * Search providers specifically
   */
  async searchProviders(filters?: {
    q?: string;
    categoryId?: string;
    minRating?: number;
    maxRate?: number;
    page?: number;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.q) params.append('q', filters.q);
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    if (filters?.minRating) params.append('minRating', String(filters.minRating));
    if (filters?.maxRate) params.append('maxRate', String(filters.maxRate));
    if (filters?.page) params.append('page', String(filters.page));

    const response = await apiClient.get<any[]>(`/search/providers?${params.toString()}`);
    return Array.isArray(response) ? response : [];
  }
}

export const searchService = new SearchService();
