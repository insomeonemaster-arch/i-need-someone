/**
 * API Client - HTTP request handler with token management
 */

import { API_CONFIG, STORAGE_KEYS } from './config';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ApiError extends Error {
  status?: number;
  data?: any;
}

class ApiClient {
  private baseURL: string;
  private timeout: number;
  private refreshPromise: Promise<boolean> | null = null;

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    this.timeout = API_CONFIG.timeout;
  }

  /**
   * Get stored access token
   */
  private getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  /**
   * Get stored refresh token
   */
  private getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Store tokens
   */
  public setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }

  /**
   * Clear all stored tokens and user data
   */
  public clearTokens(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }

  /**
   * Build request headers
   */
  private getHeaders(includeAuth = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = this.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): ApiError {
    if (error instanceof Error) {
      const apiError: ApiError = new Error(error.message);
      if ('status' in error) apiError.status = (error as any).status;
      if ('data' in error) apiError.data = (error as any).data;
      return apiError;
    }

    const apiError: ApiError = new Error('An error occurred');
    if (error.status) apiError.status = error.status;
    if (error.data) apiError.data = error.data;
    return apiError;
  }

  /**
   * Dispatch auth-expired event and clear tokens (used on refresh failure)
   */
  private handleAuthExpiry(): void {
    this.clearTokens();
    window.dispatchEvent(new CustomEvent('auth:expired'));
  }

  /**
   * Refresh access token using refresh token
   */
  private refreshAccessToken(): Promise<boolean> {
    // Deduplicate concurrent refresh calls — all share the same in-flight promise
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      try {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) return false;

        const response = await fetch(`${this.baseURL}/auth/refresh-token`, {
          method: 'POST',
          headers: this.getHeaders(false),
          body: JSON.stringify({ refreshToken }),
          signal: AbortSignal.timeout(this.timeout),
        });

        if (!response.ok) return false;

        const result = await response.json();
        const data = result.data || result;
        if (data.accessToken) {
          // Store rotated refresh token if the server issued a new one
          const refreshToStore = data.refreshToken || this.getRefreshToken();
          if (refreshToStore) {
            this.setTokens(data.accessToken, refreshToStore);
            return true;
          }
        }

        return false;
      } catch (error) {
        console.error('Token refresh failed:', error);
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Make authenticated request with automatic token refresh
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retried = false,
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = options.headers || this.getHeaders();

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: AbortSignal.timeout(this.timeout),
      });

      // Handle 401 Unauthorized - try to refresh token (but not for login/register endpoints)
      const isAuthEndpoint = endpoint.includes('/auth/login') || endpoint.includes('/auth/register');
      if (response.status === 401 && !retried && !isAuthEndpoint) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          const newHeaders = this.getHeaders();
          return this.request<T>(endpoint, { ...options, headers: newHeaders }, true);
        }

        // Token refresh failed, clear tokens and notify
        this.handleAuthExpiry();
        throw new Error('Authentication expired');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
        const error: ApiError = new Error(errorMessage);
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      // Parse JSON response
      const responseData = await response.json();
      
      // Extract data from { success: true, data: {...} } structure
      if (responseData.success && responseData.data !== undefined) {
        return responseData.data as T;
      }
      
      // Fallback for direct data responses
      return responseData as T;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * GET request
   */
  public async get<T>(endpoint: string, includeAuth = true): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      headers: this.getHeaders(includeAuth),
    });
  }

  /**
   * POST request
   */
  public async post<T>(endpoint: string, body?: any, includeAuth = true): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      headers: this.getHeaders(includeAuth),
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT request
   */
  public async put<T>(endpoint: string, body?: any, includeAuth = true): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      headers: this.getHeaders(includeAuth),
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE request
   */
  public async delete<T>(endpoint: string, includeAuth = true): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      headers: this.getHeaders(includeAuth),
    });
  }

  /**
   * Upload file
   */
  public async uploadFile<T>(endpoint: string, file: File): Promise<T> {
    const doUpload = async (retried = false): Promise<T> => {
      const headers: HeadersInit = {};
      const token = this.getAccessToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
        signal: AbortSignal.timeout(this.timeout),
      });

      if (response.status === 401 && !retried) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) return doUpload(true);
        this.handleAuthExpiry();
        throw new Error('Authentication expired');
      }

      if (!response.ok) {
        const err: ApiError = new Error(`HTTP ${response.status}`);
        err.status = response.status;
        err.data = await response.json().catch(() => ({}));
        throw err;
      }

      const result = await response.json();
      if (result.success && result.data !== undefined) return result.data as T;
      return result as T;
    };

    return doUpload();
  }
}

export const apiClient = new ApiClient();
