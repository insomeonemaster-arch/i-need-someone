/**
 * Provider Service
 */

import { apiClient } from './api-client';

export interface ProviderProfile {
  id: string;
  userId: string;
  title: string;
  bio: string;
  hourlyRate?: number;
  location?: {
    city: string;
    state: string;
    country: string;
  };
  skills: Array<{
    id: string;
    name: string;
    verified: boolean;
  }>;
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    expiresAt?: string;
    verified: boolean;
  }>;
  portfolio: Array<{
    id: string;
    title: string;
    description: string;
    images: string[];
    category: string;
  }>;
  ratings?: number;
  reviewsCount?: number;
  completedJobs?: number;
  responseTime?: number;
  memberSince: string;
}

export interface ProviderPublicProfile {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  title: string;
  bio: string;
  hourlyRate?: number;
  location?: {
    city: string;
    state: string;
    country: string;
  };
  skills: string[];
  ratings: number;
  reviewsCount: number;
  completedJobs: number;
  portfolio: Array<{
    id: string;
    title: string;
    description: string;
    images: string[];
  }>;
}

export interface UpdateProfileRequest {
  title?: string;
  bio?: string;
  hourlyRate?: number;
  serviceRadius?: number;
  acceptsRemoteWork?: boolean;
  location?: {
    city: string;
    state: string;
    country: string;
  };
}

class ProviderService {
  /**
   * Get my provider profile
   */
  async getMyProfile(): Promise<ProviderProfile> {
    return apiClient.get('/provider/profile');
  }

  /**
   * Create provider profile
   */
  async createProfile(data: UpdateProfileRequest): Promise<ProviderProfile> {
    return apiClient.post('/provider/profile', data);
  }

  /**
   * Update provider profile
   */
  async updateProfile(data: UpdateProfileRequest): Promise<ProviderProfile> {
    return apiClient.put('/provider/profile', data);
  }

  /**
   * Get public provider profile
   */
  async getPublicProfile(providerId: string): Promise<ProviderPublicProfile> {
    return apiClient.get(`/provider/${providerId}`, false);
  }

  /**
   * Get my skills
   */
  async getSkills(): Promise<ProviderProfile['skills']> {
    return apiClient.get('/provider/skills');
  }

  /**
   * Add skill
   */
  async addSkill(skillId: string): Promise<{ success: boolean }> {
    return apiClient.post('/provider/skills', { skillId });
  }

  /**
   * Remove skill
   */
  async removeSkill(skillId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/provider/skills/${skillId}`);
  }

  /**
   * Get certifications
   */
  async getCertifications(): Promise<ProviderProfile['certifications']> {
    return apiClient.get('/provider/certifications');
  }

  /**
   * Add certification
   */
  async addCertification(data: {
    name: string;
    issuer: string;
    expiresAt?: string;
  }): Promise<ProviderProfile['certifications'][0]> {
    return apiClient.post('/provider/certifications', data);
  }

  /**
   * Update certification
   */
  async updateCertification(certId: string, data: {
    name?: string;
    issuer?: string;
    expiresAt?: string;
  }): Promise<ProviderProfile['certifications'][0]> {
    return apiClient.put(`/provider/certifications/${certId}`, data);
  }

  /**
   * Delete certification
   */
  async deleteCertification(certId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/provider/certifications/${certId}`);
  }

  /**
   * Get portfolio
   */
  async getPortfolio(): Promise<ProviderProfile['portfolio']> {
    return apiClient.get('/provider/portfolio');
  }

  /**
   * Add portfolio item
   */
  async addPortfolioItem(data: {
    title: string;
    description: string;
    images: string[];
    category: string;
  }): Promise<ProviderProfile['portfolio'][0]> {
    return apiClient.post('/provider/portfolio', data);
  }

  /**
   * Update portfolio item
   */
  async updatePortfolioItem(itemId: string, data: {
    title?: string;
    description?: string;
    images?: string[];
    category?: string;
  }): Promise<ProviderProfile['portfolio'][0]> {
    return apiClient.put(`/provider/portfolio/${itemId}`, data);
  }

  /**
   * Delete portfolio item
   */
  async deletePortfolioItem(itemId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/provider/portfolio/${itemId}`);
  }
}

export const providerService = new ProviderService();
