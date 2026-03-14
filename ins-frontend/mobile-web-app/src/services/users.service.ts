/**
 * Users Service
 */

import { apiClient } from './api-client';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  // Location fields (flat, matching backend schema)
  city?: string;
  state?: string;
  country?: string;
  addressLine1?: string;
  postalCode?: string;
  ratings?: number;
  reviewsCount?: number;
  // Backend uses currentMode, not mode
  currentMode: 'client' | 'provider';
  isEmailVerified: boolean;
  isPhoneVerified?: boolean;
  isProvider?: boolean;
  isAdmin?: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  bio?: string;
  // Location fields accepted by backend updateProfileSchema
  city?: string;
  state?: string;
  country?: string;
  addressLine1?: string;
  postalCode?: string;
}

export interface PrivacySettings {
  profileVisibility: boolean;
  showOnlineStatus: boolean;
  allowDirectMessages: boolean;
}

export interface DisplaySettings {
  darkMode: boolean;
  compactView: boolean;
  language: string;
  currency: string;
  timezone: string;
}

class UsersService {
  /**
   * Get user profile by ID
   */
  async getUser(userId: string): Promise<UserProfile> {
    return apiClient.get(`/users/${userId}`, false);
  }

  /**
   * Get current user profile
   */
  async getMe(): Promise<UserProfile> {
    return apiClient.get('/users/me');
  }

  /**
   * Update current user profile
   */
  async updateMe(data: UpdateUserRequest): Promise<UserProfile> {
    return apiClient.put('/users/me', data);
  }

  /**
   * Update password
   */
  async updatePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean }> {
    return apiClient.put('/users/me/password', { currentPassword, newPassword });
  }

  /**
   * Update email
   */
  async updateEmail(email: string, password: string): Promise<{ success: boolean }> {
    return apiClient.put('/users/me/email', { email, password });
  }

  /**
   * Update phone
   */
  async updatePhone(phone: string): Promise<{ success: boolean }> {
    return apiClient.put('/users/me/phone', { phone });
  }

  /**
   * Verify phone with OTP
   */
  async verifyPhone(otp: string): Promise<{ success: boolean }> {
    return apiClient.post('/users/me/verify-phone', { otp });
  }

  async deleteMe(password: string): Promise<{ success: boolean }> {
    return apiClient.delete('/users/me');
  }

  async getSessions(): Promise<Array<{
    id: string;
    ipAddress?: string;
    deviceInfo?: { userAgent?: string };
    createdAt: string;
    expiresAt: string;
  }>> {
    const response = await apiClient.get<any[]>('/users/me/sessions');
    return Array.isArray(response) ? response : [];
  }

  async revokeSession(sessionId: string): Promise<{ message: string }> {
    return apiClient.delete(`/users/me/sessions/${sessionId}`);
  }

  async revokeAllSessions(keepCurrent?: boolean, currentRefreshToken?: string): Promise<{ message: string }> {
    return apiClient.delete('/users/me/sessions');
  }

  /**
   * Get privacy settings
   */
  async getPrivacySettings(): Promise<PrivacySettings> {
    return apiClient.get('/users/me/privacy-settings');
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<PrivacySettings> {
    return apiClient.put('/users/me/privacy-settings', settings);
  }

  /**
   * Get display settings
   */
  async getDisplaySettings(): Promise<DisplaySettings> {
    return apiClient.get('/users/me/display-settings');
  }

  /**
   * Update display settings
   */
  async updateDisplaySettings(settings: Partial<DisplaySettings>): Promise<DisplaySettings> {
    return apiClient.put('/users/me/display-settings', settings);
  }
}

export const usersService = new UsersService();
