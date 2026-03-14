/**
 * Reviews Service
 */

import { apiClient } from './api-client';

export interface Review {
  id: string;
  reviewerId: string;
  revieweeId: string;
  // Backend field names
  contextType: 'service_request' | 'job' | 'project';
  contextId: string;
  rating: number;
  content?: string;
  title?: string;
  createdAt: string;
  reviewer?: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

class ReviewsService {
  async getReviewsForUser(userId: string, limit = 20, offset = 0): Promise<Review[]> {
    // paginated — returns array directly after api-client unwrap
    const response = await apiClient.get<Review[]>(
      `/reviews/user/${userId}?limit=${limit}&offset=${offset}`,
    );
    return Array.isArray(response) ? response : [];
  }

  async getReviewSummary(userId: string): Promise<ReviewSummary> {
    return apiClient.get(`/reviews/user/${userId}/summary`);
  }

  async getMyReviewsGiven(): Promise<Review[]> {
    // Backend route: GET /reviews/given (added to backend)
    const response = await apiClient.get<Review[]>('/reviews/given');
    return Array.isArray(response) ? response : [];
  }

  async getMyReviewsReceived(): Promise<Review[]> {
    // Backend route: GET /reviews/received (added to backend)
    const response = await apiClient.get<Review[]>('/reviews/received');
    return Array.isArray(response) ? response : [];
  }

  async createReview(data: {
    revieweeId: string;
    contextType: 'service_request' | 'job' | 'project';
    contextId: string;
    rating: number;
    title?: string;
    content?: string;
    communicationRating?: number;
    qualityRating?: number;
    professionalismRating?: number;
    timelinessRating?: number;
  }): Promise<Review> {
    return apiClient.post('/reviews', data);
  }

  async updateReview(
    reviewId: string,
    data: {
      rating?: number;
      title?: string;
      content?: string;
    },
  ): Promise<Review> {
    return apiClient.put(`/reviews/${reviewId}`, data);
  }

  async deleteReview(reviewId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/reviews/${reviewId}`);
  }
}

export const reviewsService = new ReviewsService();
