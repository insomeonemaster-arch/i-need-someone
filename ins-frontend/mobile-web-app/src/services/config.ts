/**
 * API Configuration
 */

export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  socketURL: import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000',
  timeout: 30000,
  withCredentials: true,
};

// Local storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'ins_access_token',
  REFRESH_TOKEN: 'ins_refresh_token',
  USER: 'ins_user',
};
