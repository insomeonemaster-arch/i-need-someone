/**
 * Verification Service
 */

import { apiClient } from './api-client';

// Matches actual backend getStatus response shape
export interface VerificationStatus {
  documents: VerificationDocument[];
  backgroundChecks: any[];
  providerVerification: {
    verificationStatus: string;
    verificationLevel: string;
  } | null;
}

export interface VerificationDocument {
  id: string;
  userId: string;
  documentType: string;
  documentNumber?: string;
  issuingAuthority?: string;
  issueDate?: string;
  expiryDate?: string;
  fileUrl: string;
  fileType?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  createdAt: string;
}

export interface UploadDocumentRequest {
  documentType: string;
  fileUrl: string;
  fileType?: string;
  documentNumber?: string;
  issuingAuthority?: string;
  issueDate?: string;
  expiryDate?: string;
}

class VerificationService {
  async getStatus(): Promise<VerificationStatus> {
    return apiClient.get('/verification/status');
  }

  async getDocuments(): Promise<VerificationDocument[]> {
    const response = await apiClient.get<VerificationDocument[]>('/verification/documents');
    return Array.isArray(response) ? response : [];
  }

  async submitDocument(data: UploadDocumentRequest): Promise<VerificationDocument> {
    // Backend expects: documentType, fileUrl, fileType, documentNumber, etc.
    return apiClient.post('/verification/documents', data);
  }

  async deleteDocument(documentId: string): Promise<{ message: string }> {
    return apiClient.delete(`/verification/documents/${documentId}`);
  }

  async requestBackgroundCheck(): Promise<{ message: string }> {
    return apiClient.post('/verification/background-check');
  }
}

export const verificationService = new VerificationService();
