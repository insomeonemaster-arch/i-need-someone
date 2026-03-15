/**
 * Projects Service
 */

import { apiClient } from './api-client';

export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  budget?: {
    min: number;
    max: number;
    currency: string;
  };
  skills?: string[];
  status: 'open' | 'in-progress' | 'completed' | 'cancelled';
  clientId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Proposal {
  id: string;
  projectId: string;
  providerId: string;
  coverLetter: string;
  proposedBudget: number;
  timeline: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: string;
  updatedAt: string;
  provider?: {
    id: string;
    displayName: string;
    avatarUrl?: string;
    ratings?: number;
  };
}

export interface CreateProjectRequest {
  title: string;
  description: string;
  categoryId: string;
  projectScope?: 'small' | 'medium' | 'large';
  estimatedDuration?: string;
  budgetMin?: number;
  budgetMax?: number;
  budgetType?: 'fixed' | 'hourly' | 'milestone-based';
  requiredSkills?: string[];
  deliverables?: string[];
  deadline?: string;
}

// Map flat Prisma budget fields → nested budget object used by screens
const normalizeProject = (raw: any): Project => ({
  ...raw,
  budget: raw.budget ?? (raw.budgetMin != null
    ? { min: raw.budgetMin, max: raw.budgetMax ?? 0, currency: raw.budgetType ?? 'fixed' }
    : undefined),
  skills: raw.skills ?? raw.requiredSkills ?? [],
});

class ProjectsService {
  async browseProjects(filters?: {
    category?: string;
    skills?: string[];
    budget?: { min?: number; max?: number };
    limit?: number;
    offset?: number;
  }): Promise<Project[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.skills?.length) params.append('skills', filters.skills.join(','));
    if (filters?.budget?.min) params.append('budgetMin', String(filters.budget.min));
    if (filters?.budget?.max) params.append('budgetMax', String(filters.budget.max));
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.offset) params.append('offset', String(filters.offset));

    // paginated response
    const response = await apiClient.get<Project[]>(
      `/projects/browse?${params.toString()}`,
      false,
    );
    return Array.isArray(response) ? response.map(normalizeProject) : [];
  }

  async getMyProjects(): Promise<Project[]> {
    // paginated response
    const response = await apiClient.get<Project[]>('/projects');
    return Array.isArray(response) ? response.map(normalizeProject) : [];
  }

  async getProject(projectId: string): Promise<Project> {
    const raw = await apiClient.get<any>(`/projects/${projectId}`);
    return normalizeProject(raw);
  }

  async createProject(data: CreateProjectRequest): Promise<Project> {
    const raw = await apiClient.post<any>('/projects', data);
    return normalizeProject(raw);
  }

  async submitProposal(
    projectId: string,
    data: {
      coverLetter: string;
      proposedPrice: number;   // backend field name is proposedPrice
      estimatedDuration?: string;
      pricingType?: 'fixed' | 'hourly' | 'milestone-based';
      estimatedHours?: number;
    },
  ): Promise<Proposal> {
    return apiClient.post(`/projects/${projectId}/proposals`, data);
  }

  async getMyProposals(): Promise<Proposal[]> {
    // paginated — backend route: GET /projects/proposals
    const response = await apiClient.get<Proposal[]>('/projects/proposals');
    return Array.isArray(response) ? response : [];
  }

  async acceptProposal(proposalId: string): Promise<Proposal> {
    return apiClient.post(`/projects/proposals/${proposalId}/accept`);
  }

  async rejectProposal(proposalId: string): Promise<Proposal> {
    return apiClient.post(`/projects/proposals/${proposalId}/reject`);
  }
}

export const projectsService = new ProjectsService();
