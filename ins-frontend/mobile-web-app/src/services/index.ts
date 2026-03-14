/**
 * Service Layer Barrel Export
 */

export { apiClient } from './api-client';
export type { ApiResponse, ApiError } from './api-client';

export { authService } from './auth.service';
export type { LoginRequest, RegisterRequest, AuthResponse, User } from './auth.service';

export { usersService } from './users.service';
export type { UserProfile, UpdateUserRequest, PrivacySettings, DisplaySettings } from './users.service';

export { messagingService } from './messaging.service';
export type { Message, Conversation } from './messaging.service';

export { jobsService } from './jobs.service';
export type { Job, JobApplication, CreateJobRequest, ApplicationStatus } from './jobs.service';

export { localServicesService } from './local-services.service';
export type { ServiceRequest, Quote, CreateServiceRequestRequest } from './local-services.service';

export { projectsService } from './projects.service';
export type { Project, Proposal, CreateProjectRequest } from './projects.service';

export { notificationsService } from './notifications.service';
export type { Notification, Announcement, NotificationSettings } from './notifications.service';

export { paymentsService } from './payments.service';
export type { PaymentMethod, Transaction, Payout, Earnings, EarningsSummary, ConnectStatus } from './payments.service';

export { reviewsService } from './reviews.service';
export type { Review, ReviewSummary } from './reviews.service';

export { supportService } from './support.service';
export type { FAQ, SupportTicket, TicketMessage } from './support.service';

export { categoriesService } from './categories.service';
export type { Category, Skill } from './categories.service';

export { searchService } from './search.service';
export type { GlobalSearchResult, SearchResult, SearchFilters } from './search.service';

export { verificationService } from './verification.service';
export type { VerificationStatus, VerificationDocument, UploadDocumentRequest } from './verification.service';

export { providerService } from './provider.service';
export type { ProviderProfile, ProviderPublicProfile, UpdateProfileRequest } from './provider.service';

export { socketService } from './socket.service';

export { API_CONFIG, STORAGE_KEYS } from './config';
