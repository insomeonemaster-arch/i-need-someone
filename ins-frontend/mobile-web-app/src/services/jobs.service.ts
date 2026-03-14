/**
 * Jobs Service
 */

import { apiClient } from './api-client';

export interface Job {
  id: string;
  title: string;
  description: string;
  category?: string;
  budget?: {
    min: number;
    max: number;
    currency: string;
  };
  skills?: string[];
  status: 'open' | 'in-progress' | 'closed' | 'completed';
  clientId: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  providerId: string;
  coverLetter: string;
  proposedBudget: number;
  // Backend statuses — note 'accepted'/'withdrawn' are not valid; use 'hired'/'rejected'
  status: 'pending' | 'reviewing' | 'shortlisted' | 'interviewed' | 'offered' | 'hired' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobRequest {
  title: string;
  description: string;
  category?: string;
  budget?: {
    min: number;
    max: number;
    currency?: string;
  };
  skills?: string[];
}

// Valid status values accepted by backend updateApplicationStatus
export type ApplicationStatus = 'reviewing' | 'shortlisted' | 'interviewed' | 'offered' | 'hired' | 'rejected';

class JobsService {
  async browseJobs(filters?: {
    category?: string;
    skills?: string[];
    budget?: { min?: number; max?: number };
    limit?: number;
    offset?: number;
  }): Promise<Job[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.skills?.length) params.append('skills', filters.skills.join(','));
    if (filters?.budget?.min) params.append('budgetMin', String(filters.budget.min));
    if (filters?.budget?.max) params.append('budgetMax', String(filters.budget.max));
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.offset) params.append('offset', String(filters.offset));

    // paginated response
    const response = await apiClient.get<Job[]>(`/jobs/browse?${params.toString()}`, false);
    return Array.isArray(response) ? response : [];
  }

  async getMyPostings(): Promise<Job[]> {
    // paginated response
    const response = await apiClient.get<Job[]>('/jobs/postings');
    return Array.isArray(response) ? response : [];
  }

  async createJob(data: CreateJobRequest): Promise<Job> {
    return apiClient.post('/jobs/postings', data);
  }

  async getJob(jobId: string): Promise<Job> {
    return apiClient.get(`/jobs/postings/${jobId}`, false);
  }

  async updateJob(jobId: string, data: Partial<CreateJobRequest>): Promise<Job> {
    return apiClient.put(`/jobs/postings/${jobId}`, data);
  }

  async closeJob(jobId: string): Promise<{ success: boolean }> {
    return apiClient.post(`/jobs/postings/${jobId}/close`, {});
  }

  async getJobApplications(jobId: string): Promise<JobApplication[]> {
    // paginated response
    const response = await apiClient.get<JobApplication[]>(
      `/jobs/postings/${jobId}/applications`,
    );
    return Array.isArray(response) ? response : [];
  }

  async getMyApplications(): Promise<JobApplication[]> {
    // paginated response
    const response = await apiClient.get<JobApplication[]>('/jobs/applications');
    return Array.isArray(response) ? response : [];
  }

  async applyToJob(
    jobId: string,
    data: {
      coverLetter?: string;
      resumeUrl?: string;
      portfolioUrl?: string;
      expectedSalary?: number;
      availableFrom?: string;
    },
  ): Promise<JobApplication> {
    return apiClient.post(`/jobs/postings/${jobId}/apply`, data);
  }

  async updateApplicationStatus(
    applicationId: string,
    status: ApplicationStatus,
  ): Promise<JobApplication> {
    return apiClient.put(`/jobs/applications/${applicationId}/status`, { status });
  }
}

export const jobsService = new JobsService();
