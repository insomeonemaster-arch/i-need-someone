/**
 * Reports Service
 */

import { apiClient } from './api-client';

export interface CreateReportRequest {
  reportedEntityType: 'user' | 'service_request' | 'job_posting' | 'project' | 'message';
  reportedEntityId: string;
  reportedUserId?: string;
  reason: string;
  description?: string;
}

class ReportsService {
  async createReport(data: CreateReportRequest): Promise<{ id: string }> {
    return apiClient.post('/reports', data);
  }
}

export const reportsService = new ReportsService();
