/**
 * Jobs Service
 */

import { apiClient } from './api-client';

export interface Job {
  id: string;
  title: string;
  description: string;
  categoryId?: string;
  category?: string | { id: string; name: string };
  employmentType?: 'full_time' | 'part_time' | 'contract' | 'temporary';
  workLocation?: 'on_site' | 'remote' | 'hybrid';
  city?: string;
  state?: string;
  companyName?: string;
  // Normalised from salaryMin/salaryMax by normalizeJob()
  budget?: {
    min: number;
    max: number;
    currency: string;
  };
  // Raw backend fields
  salaryMin?: number;
  salaryMax?: number;
  salaryType?: string;
  requiredSkills?: string[];
  skills?: string[];
  minExperienceYears?: number;
  positionsAvailable?: number;
  applicationDeadline?: string;
  status: 'open' | 'in-progress' | 'closed' | 'completed';
  clientId?: string;
  employerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobApplication {
  id: string;
  jobId?: string;
  jobPostingId?: string;
  providerId?: string;
  applicantId?: string;
  coverLetter?: string;
  resumeUrl?: string;
  expectedSalary?: number;
  status: 'pending' | 'reviewing' | 'shortlisted' | 'interviewed' | 'offered' | 'hired' | 'rejected';
  createdAt: string;
  updatedAt: string;
  jobPosting?: Job;
}

export interface CreateJobRequest {
  title: string;
  description: string;
  categoryId: string;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'temporary';
  workLocation: 'on_site' | 'remote' | 'hybrid';
  city?: string;
  state?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryType?: 'hourly' | 'monthly' | 'yearly';
  requiredSkills?: string[];
  companyName?: string;
  minExperienceYears?: number;
  positionsAvailable?: number;
}

// Valid status values accepted by backend updateApplicationStatus
export type ApplicationStatus = 'reviewing' | 'shortlisted' | 'interviewed' | 'offered' | 'hired' | 'rejected';

// Map flat Prisma salary fields → nested budget object used by screens
const normalizeJob = (raw: any): Job => ({
  ...raw,
  budget: raw.budget ?? (raw.salaryMin != null
    ? { min: raw.salaryMin, max: raw.salaryMax ?? 0, currency: raw.salaryType ?? 'yearly' }
    : undefined),
  skills: raw.skills ?? raw.requiredSkills ?? [],
});

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
    return Array.isArray(response) ? response.map(normalizeJob) : [];
  }

  async getMyPostings(): Promise<Job[]> {
    // paginated response
    const response = await apiClient.get<Job[]>('/jobs/postings');
    return Array.isArray(response) ? response.map(normalizeJob) : [];
  }

  async createJob(data: CreateJobRequest): Promise<Job> {
    const raw = await apiClient.post<any>('/jobs/postings', data);
    return normalizeJob(raw);
  }

  async getJob(jobId: string): Promise<Job> {
    const raw = await apiClient.get<any>(`/jobs/postings/${jobId}`, false);
    return normalizeJob(raw);
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
