import { api } from './api';

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  success: boolean;
  data: {
    user: AdminUser;
    accessToken: string;
    refreshToken: string;
  };
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  avatarUrl?: string;
}

export const authService = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }),
  me: () => api.get<{ success: boolean; data: AdminUser }>('/users/me'),
  forgotPassword: (email: string) =>
    api.post<{ success: boolean; data: { message: string } }>('/auth/forgot-password', { email }),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface DashboardStats {
  total_users: number;
  active_requests: number;
  active_projects: number;
  active_jobs: number;
  total_revenue: number;
  pending_disputes: number;
  pending_flags: number;
  pending_approvals: number;
  revenue_chart: { date: string; amount: number }[];
  recent_activities: {
    id: string;
    type: string;
    description: string;
    user: string;
    timestamp: string;
  }[];
}

export interface Alert {
  id: string;
  type: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
  count: number;
  link: string;
}

export const dashboardService = {
  getStats: () =>
    api.get<{ success: boolean; data: DashboardStats }>('/admin/dashboard/stats'),
  getAlerts: () =>
    api.get<{ success: boolean; data: Alert[] }>('/admin/dashboard/alerts'),
};

// ── Users ─────────────────────────────────────────────────────────────────────

export interface UserItem {
  id: string;
  email: string;
  phone?: string;
  first_name: string;
  last_name: string;
  avatar?: string;
  roles: string[];
  status: 'active' | 'suspended';
  city?: string;
  state?: string;
  email_verified: boolean;
  phone_verified: boolean;
  rating_avg?: number;
  rating_count: number;
  created_at: string;
  last_login_at?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: { total: number; page: number; per_page: number; total_pages: number };
}

export const usersService = {
  getUsers: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse<UserItem>>(`/admin/users${qs}`);
  },
  getUser: (id: string) =>
    api.get<{ success: boolean; data: unknown }>(`/admin/users/${id}`),
  suspendUser: (id: string) =>
    api.post(`/admin/users/${id}/suspend`),
  unsuspendUser: (id: string) =>
    api.post(`/admin/users/${id}/unsuspend`),
  verifyUser: (id: string) =>
    api.post(`/admin/users/${id}/verify`),
  updateUser: (id: string, data: unknown) =>
    api.patch(`/admin/users/${id}`, data),
};

// ── Payments ──────────────────────────────────────────────────────────────────

export interface PaymentItem {
  id: string;
  payment_id: string;
  payer: { id: string; name: string };
  payee: { id: string; name: string } | null;
  entity_type: string;
  entity_display: string;
  amount: number;
  fee: number;
  net_amount: number;
  status: string;
  payment_method: string;
  created_at: string;
}

export interface PayoutItem {
  id: string;
  payout_id: string;
  provider: { id: string; name: string };
  amount: number;
  fee: number;
  net_amount: number;
  method: string;
  status: string;
  created_at: string;
}

export const paymentsService = {
  getPayments: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse<PaymentItem>>(`/admin/payments${qs}`);
  },
  getPayment: (id: string) =>
    api.get<{ success: boolean; data: unknown }>(`/admin/payments/${id}`),
  refundPayment: (id: string) =>
    api.post(`/admin/payments/${id}/refund`),
  getPayouts: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse<PayoutItem>>(`/admin/payouts${qs}`);
  },
  processPayout: (id: string) =>
    api.post(`/admin/payouts/${id}/process`),
};

// ── Disputes ──────────────────────────────────────────────────────────────────

export interface DisputeItem {
  id: string;
  dispute_id: string;
  type: string;
  claimant: { id: string; name: string };
  respondent: { id: string; name: string } | null;
  entity_type: string;
  entity_display: string;
  amount_in_dispute?: number;
  status: string;
  priority: string;
  resolution?: string;
  created_at: string;
  resolved_at?: string;
}

export const disputesService = {
  getDisputes: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse<DisputeItem>>(`/admin/disputes${qs}`);
  },
  getDispute: (id: string) =>
    api.get<{ success: boolean; data: unknown }>(`/admin/disputes/${id}`),
  resolveDispute: (id: string, data: { resolution: string; notes?: string }) =>
    api.post(`/admin/disputes/${id}/resolve`, data),
};

// ── Ratings & Flags ───────────────────────────────────────────────────────────

export interface RatingItem {
  id: string;
  rating_id: string;
  rater: { id: string; name: string };
  rated_user: { id: string; name: string };
  entity_type: string;
  entity_display: string;
  rating: number;
  review_text?: string;
  flagged: boolean;
  flag_reason?: string;
  admin_reviewed: boolean;
  admin_action?: string;
  created_at: string;
}

export interface FlagItem {
  id: string;
  flag_id: string;
  flagger: { id: string; name: string };
  flagged_entity_type?: string;
  flagged_entity_id?: string;
  flagged_entity_display?: string;
  reason: string;
  description?: string;
  status: string;
  resolution?: string;
  assigned_admin?: { id: string; name: string } | null;
  created_at: string;
}

export const ratingsFlagsService = {
  getRatings: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse<RatingItem>>(`/admin/ratings${qs}`);
  },
  updateRating: (id: string, data: unknown) =>
    api.patch(`/admin/ratings/${id}`, data),
  getFlags: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse<FlagItem>>(`/admin/flags${qs}`);
  },
  resolveFlag: (id: string, data: { resolution: string }) =>
    api.patch(`/admin/flags/${id}/resolve`, data),
};

// ── Categories & Zones ────────────────────────────────────────────────────────

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  module: string;
  parent_id?: string;
  icon?: string;
  status: 'active' | 'inactive';
  children_count: number;
  created_at: string;
}

export interface ZoneItem {
  id: string;
  name: string;
  city?: string;
  state?: string;
  country?: string;
  zip_codes?: string[];
  is_active: boolean;
  radius_km?: number;
  created_at: string;
}

export const categoriesService = {
  getCategories: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse<CategoryItem>>(`/admin/categories${qs}`);
  },
  createCategory: (data: unknown) =>
    api.post('/admin/categories', data),
  updateCategory: (id: string, data: unknown) =>
    api.patch(`/admin/categories/${id}`, data),
  deleteCategory: (id: string) =>
    api.delete(`/admin/categories/${id}`),
  getZones: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse<ZoneItem>>(`/admin/service-zones${qs}`);
  },
  createZone: (data: unknown) =>
    api.post('/admin/service-zones', data),
  updateZone: (id: string, data: unknown) =>
    api.patch(`/admin/service-zones/${id}`, data),
  deleteZone: (id: string) =>
    api.delete(`/admin/service-zones/${id}`),
};

// ── Audit Logs ────────────────────────────────────────────────────────────────

export interface AuditLogItem {
  id: string;
  log_id: string;
  user?: { id: string; firstName: string; lastName: string; email: string };
  action: string;
  entity_type: string;
  entity_id?: string;
  entity_display?: string;
  ip_address?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export const auditService = {
  getLogs: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse<AuditLogItem>>(`/admin/audit-logs${qs}`);
  },
};

// ── Jobs & Requests ───────────────────────────────────────────────────────────

export interface ServiceRequestItem {
  id: string;
  title: string;
  status: string;
  category?: string;
  customer?: { id: string; name: string };
  provider?: { id: string; name: string } | null;
  city?: string;
  budget?: number;
  created_at: string;
}

export interface RequestDetailItem {
  id: string;
  title: string;
  description?: string;
  category?: string;
  category_id?: string;
  customer: { id: string; name: string; email: string; phone?: string | null };
  provider?: {
    id: string;
    user_id: string;
    name: string;
    email: string;
    phone?: string | null;
    average_rating?: number | null;
    total_jobs: number;
  } | null;
  budget_min?: number | null;
  budget_max?: number | null;
  status: string;
  address?: string | null;
  city?: string;
  state?: string;
  urgency?: string;
  images: string[];
  attachments: string[];
  created_at: string;
  updated_at?: string;
  completed_at?: string | null;
  cancelled_at?: string | null;
}

export const jobsService = {
  getRequests: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse<ServiceRequestItem>>(`/admin/local-requests${qs}`);
  },
  getRequest: (id: string) =>
    api.get<{ success: boolean; data: RequestDetailItem }>(`/admin/local-requests/${id}`),
  cancelRequest: (id: string, data: { reason?: string }) =>
    api.post<{ success: boolean; data: { id: string; status: string } }>(`/admin/local-requests/${id}/cancel`, data),
  updateRequestStatus: (id: string, data: { status: string }) =>
    api.patch<{ success: boolean; data: { id: string; status: string } }>(`/admin/local-requests/${id}/status`, data),
};

// ── Employment ───────────────────────────────────────────────────────────────

export interface JobItem {
  id: string;
  title: string;
  employer: { id: string; name: string };
  category?: string;
  employment_type: string;
  work_location: string;
  salary_min?: number;
  salary_max?: number;
  applications_count: number;
  status: string;
  city?: string;
  created_at: string;
}

export const employmentService = {
  getJobs: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse<JobItem>>(`/admin/employment${qs}`);
  },
  getJob: (id: string) => api.get<{ success: boolean; data: JobItem }>(`/admin/employment/${id}`),
  updateJobStatus: (id: string, status: string) =>
    api.patch<{ success: boolean; data: { id: string; status: string } }>(`/admin/employment/${id}/status`, { status }),
};

// ── Projects ─────────────────────────────────────────────────────────────────

export interface ProjectAdminItem {
  id: string;
  title: string;
  client: { id: string; name: string };
  category?: string;
  budget_min?: number;
  budget_max?: number;
  proposals_count: number;
  status: string;
  estimated_duration?: string;
  created_at: string;
}

export const projectsService = {
  getProjects: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse<ProjectAdminItem>>(`/admin/projects${qs}`);
  },
  getProject: (id: string) => api.get<{ success: boolean; data: ProjectAdminItem }>(`/admin/projects/${id}`),
  updateProjectStatus: (id: string, status: string) =>
    api.patch<{ success: boolean; data: { id: string; status: string } }>(`/admin/projects/${id}/status`, { status }),
};

// ── Communications ───────────────────────────────────────────────────────────

export interface ConversationItem {
  id: string;
  participant1: { id: string; name: string };
  participant2: { id: string; name: string };
  context_type?: string;
  last_message?: string;
  last_message_at?: string;
  is_blocked: boolean;
  created_at: string;
}

export interface MessageItem {
  id: string;
  sender: { id: string; firstName: string; lastName: string };
  content: string;
  message_type?: string;
  created_at: string;
}

export const communicationsService = {
  getConversations: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse<ConversationItem>>(`/admin/communications${qs}`);
  },
  blockConversation: (id: string) =>
    api.patch<{ success: boolean; data: { id: string; is_blocked: boolean } }>(`/admin/communications/${id}/block`),
  getMessages: (id: string, params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse<MessageItem>>(`/admin/communications/${id}/messages${qs}`);
  },
};

// ── Document Verification ────────────────────────────────────────────────────

export interface DocumentItem {
  id: string;
  documentType: string;
  verificationStatus: string;
  fileUrl?: string;
  createdAt: string;
  user: { id: string; email: string; firstName: string; lastName: string };
  rejectionReason?: string;
}

export const verificationsService = {
  getPending: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse<DocumentItem>>(`/admin/verification/pending${qs}`);
  },
  approveDocument: (id: string) =>
    api.post(`/admin/verification/documents/${id}/approve`, {}),
  rejectDocument: (id: string, data: { reason: string }) =>
    api.post(`/admin/verification/documents/${id}/reject`, data),
  getViewUrl: (fileUrl: string) =>
    api.get<{ success: boolean; data: { signedUrl: string } }>(`/upload/view-url?fileUrl=${encodeURIComponent(fileUrl)}`),
};

// ── Roles & Permissions ───────────────────────────────────────────────────────

export interface AdminRole {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  permissionCount: number;
  users: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserEntry {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  roleId: string;
  lastLogin: string | null;
  status: string;
  assignedAt: string;
}

export interface RoleStats {
  totalRoles: number;
  adminUsers: number;
  lastModified: string | null;
}

export const rolesService = {
  getRoles: () =>
    api.get<{ success: boolean; data: AdminRole[] }>('/admin/roles'),
  getStats: () =>
    api.get<{ success: boolean; data: RoleStats }>('/admin/roles/stats'),
  getAdminUsers: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse<AdminUserEntry>>(`/admin/roles/users${qs}`);
  },
  createRole: (data: { name: string; description?: string; permissions?: string[] }) =>
    api.post<{ success: boolean; data: AdminRole }>('/admin/roles', data),
  updateRole: (id: string, data: Partial<Pick<AdminRole, 'name' | 'description' | 'permissions'>>) =>
    api.patch<{ success: boolean; data: AdminRole }>(`/admin/roles/${id}`, data),
  assignRole: (userId: string, roleId: string) =>
    api.post(`/admin/roles/users/${userId}/assign`, { roleId }),
};

// ── System Settings ───────────────────────────────────────────────────────────

export const settingsService = {
  getSettings: () =>
    api.get<{ success: boolean; data: Record<string, unknown> }>('/admin/settings'),
  updateSettings: (data: Record<string, unknown>) =>
    api.patch<{ success: boolean; data: Record<string, unknown> }>('/admin/settings', data),
};

// ── INS Assistant ─────────────────────────────────────────────────────────────

export const insService = {
  startConversation: () =>
    api.post<{ success: boolean; data: { conversationId: string } }>('/ins/conversations', { type: 'admin_test' }),
  sendMessage: (conversationId: string, message: string) =>
    api.post<{ success: boolean; data: { response: string; actions?: unknown[] } }>(
      `/ins/conversations/${conversationId}/messages`,
      { message }
    ),
};
