/**
 * Notifications Service
 */

import { apiClient } from './api-client';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  priority: 'low' | 'medium' | 'high';
  publishedAt: string;
  expiresAt?: string;
}

export interface NotificationSettings {
  push: {
    // NOTE: backend does not return an `enabled` boolean — presence of types implies enabled
    types: string[];
  };
  email: {
    types: string[];
  };
  sms?: {
    types: string[];
  };
}

class NotificationsService {
  async getNotifications(): Promise<Notification[]> {
    // paginated response — api-client unwraps .data so we get the array directly
    const response = await apiClient.get<Notification[]>('/notifications');
    return Array.isArray(response) ? response : [];
  }

  async getUnreadCount(): Promise<number> {
    // success(res, { count }) — api-client returns { count } directly
    const response = await apiClient.get<{ count: number }>('/notifications/unread-count');
    return response.count ?? 0;
  }

  async markAsRead(notificationId: string): Promise<{ success: boolean }> {
    return apiClient.put(`/notifications/${notificationId}/read`);
  }

  async markAllAsRead(): Promise<{ success: boolean }> {
    return apiClient.post('/notifications/read-all');
  }

  async deleteNotification(notificationId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/notifications/${notificationId}`);
  }

  async getSettings(): Promise<NotificationSettings> {
    // Backend returns { push: { types: [...] }, email: { types: [...] }, sms: { types: [...] } }
    return apiClient.get('/notifications/settings');
  }

  async updateSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    return apiClient.put('/notifications/settings', settings);
  }

  async getAnnouncements(): Promise<Announcement[]> {
    // success(res, array) — api-client unwraps to array directly
    const response = await apiClient.get<Announcement[]>('/notifications/announcements');
    return Array.isArray(response) ? response : [];
  }

  async getAnnouncement(announcementId: string): Promise<Announcement> {
    return apiClient.get(`/notifications/announcements/${announcementId}`);
  }
}

export const notificationsService = new NotificationsService();
