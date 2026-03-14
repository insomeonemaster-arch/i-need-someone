/**
 * Authentication Service
 */

import { apiClient } from './api-client';
import { STORAGE_KEYS } from './config';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  mode?: 'client' | 'provider';
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    displayName: string;
    avatarUrl?: string;
    currentMode: 'client' | 'provider';
    mode: 'client' | 'provider';
    isProvider: boolean;
    isEmailVerified: boolean;
    createdAt: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  phone?: string;
  avatarUrl?: string;
  mode: 'client' | 'provider';
  isProvider: boolean;
  isEmailVerified: boolean;
  createdAt: string;
}

// Normalize backend user shape (currentMode) to frontend shape (mode)
const normalizeUser = (raw: any): User => ({
  id: raw.id,
  email: raw.email,
  firstName: raw.firstName,
  lastName: raw.lastName,
  displayName: raw.displayName || `${raw.firstName} ${raw.lastName}`,
  avatarUrl: raw.avatarUrl,
  mode: raw.mode || raw.currentMode || 'client',
  isProvider: raw.isProvider ?? false,
  isEmailVerified: raw.isEmailVerified,
  createdAt: raw.createdAt,
});

class AuthService {
  /**
   * Register new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data, false);
    if (response.accessToken && response.refreshToken) {
      apiClient.setTokens(response.accessToken, response.refreshToken);
      const user = normalizeUser(response.user);
      this.setUser(user);
      return { ...response, user };
    }
    return response;
  }

  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data, false);
    if (response.accessToken && response.refreshToken) {
      apiClient.setTokens(response.accessToken, response.refreshToken);
      const user = normalizeUser(response.user);
      this.setUser(user);
      return { ...response, user };
    }
    return response;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    try {
      await apiClient.post('/auth/logout', { refreshToken });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      apiClient.clearTokens();
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<{ success: boolean }> {
    return apiClient.get(`/auth/verify-email?token=${token}`, false);
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    return apiClient.post('/auth/forgot-password', { email }, false);
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, password: string): Promise<{ success: boolean }> {
    return apiClient.post('/auth/reset-password', { token, password }, false);
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User> {
    const user = this.getStoredUser();
    if (user) {
      return user;
    }

    try {
      const response = await apiClient.get<any>('/users/me');
      const rawUser = response?.user || response;

      if (rawUser) {
        const userData = normalizeUser(rawUser);
        this.setUser(userData);
        return userData;
      }
    } catch (error) {
      apiClient.clearTokens();
      throw error;
    }

    throw new Error('Failed to get current user');
  }

  /**
   * Switch mode (client -> provider or vice versa)
   */
  async switchMode(mode: 'client' | 'provider'): Promise<User> {
    const response = await apiClient.put<any>('/users/me/mode', { mode });
    // Backend returns { id, currentMode } — merge into stored user
    const stored = this.getStoredUser();
    const merged = normalizeUser({
      ...(stored || {}),
      ...(response?.user || response),
    });
    this.setUser(merged);
    return merged;
  }

  /**
   * Store user in localStorage
   */
  private setUser(user: User): void {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  /**
   * Get stored user
   */
  getStoredUser(): User | null {
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  /**
   * Clear authentication
   */
  clearAuth(): void {
    apiClient.clearTokens();
  }
}

export const authService = new AuthService();
