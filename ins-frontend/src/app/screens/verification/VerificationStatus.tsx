import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Upload, CheckCircle, Clock, AlertCircle, ShieldCheck, FileText, Loader2, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { verificationService, VerificationStatus as VerificationStatusType, VerificationDocument } from '@/services';
import { API_CONFIG, STORAGE_KEYS } from '@/services/config';

export default function VerificationStatus() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<VerificationStatusType | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [reuploadingId, setReuploadingId] = useState<string | null>(null);
  const [reuploadError, setReuploadError] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [viewingId, setViewingId] = useState<string | null>(null);

  const handleView = async (doc: VerificationDocument) => {
    setViewingId(doc.id);
    try {
      const res = await fetch(
        `${API_CONFIG.baseURL}/upload/view-url?fileUrl=${encodeURIComponent(doc.fileUrl)}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)}` } },
      );
      const json = await res.json();
      const url = json?.data?.signedUrl ?? json?.signedUrl;
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        setReuploadError('Could not generate view URL. Please try again.');
      }
    } catch {
      setReuploadError('Could not fetch view URL. Please try again.');
    } finally {
      setViewingId(null);
    }
  };

  const loadData = () => {
    setLoading(true);
    verificationService.getStatus()
      .then(setData)
      .catch(() => setFetchError('Failed to load verification status'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleReupload = async (doc: VerificationDocument, file: File) => {
    setReuploadingId(doc.id);
    setReuploadError(null);
    try {
      // Step 1: upload file to storage
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch(`${API_CONFIG.baseURL}/upload/document`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)}` },
        body: formData,
      });
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error(err?.error?.message || 'Upload failed');
      }
      const uploadResult = await uploadRes.json();
      const fileUrl: string = uploadResult?.data?.url ?? uploadResult?.url;
      if (!fileUrl) throw new Error('No URL returned from storage');

      // Step 2: delete the rejected document
      await verificationService.deleteDocument(doc.id);

      // Step 3: submit the new document
      await verificationService.submitDocument({
        documentType: doc.documentType,
        fileUrl,
        fileType: file.type,
      });

      loadData();
    } catch (err) {
      setReuploadError(err instanceof Error ? err.message : 'Re-upload failed. Please try again.');
    } finally {
      setReuploadingId(null);
    }
  };

  const documents: VerificationDocument[] = data?.documents ?? [];

  // Derive overall status from individual document statuses
  const overallStatus: 'not_started' | 'pending' | 'verified' | 'rejected' =
    !documents.length ? 'not_started' :
    documents.every(d => d.verificationStatus === 'verified') ? 'verified' :
    documents.some(d => d.verificationStatus === 'rejected') ? 'rejected' :
    'pending';

  const getStatusIcon = () => {
    switch (overallStatus) {
      case 'verified':
        return <CheckCircle className="size-16 text-green-600" />;
      case 'pending':
        return <Clock className="size-16 text-yellow-600" />;
      case 'rejected':
        return <AlertCircle className="size-16 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (overallStatus) {
      case 'verified': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = () => {
    switch (overallStatus) {
      case 'verified': return 'Verified';
      case 'pending': return 'Under Review';
      case 'rejected': return 'Rejected';
      default: return 'Not Started';
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/profile')}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="font-semibold">Verification Status</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 space-y-4">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-8 animate-spin text-gray-400" />
          </div>
        )}

        {fetchError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-5 flex gap-3">
              <AlertCircle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{fetchError}</p>
            </CardContent>
          </Card>
        )}

        {!loading && !fetchError && (
          <>
            {/* Not started state */}
            {overallStatus === 'not_started' && (
              <>
                <Card>
                  <CardContent className="p-8 flex flex-col items-center text-center gap-4">
                    <ShieldCheck className="size-16 text-gray-300" />
                    <div>
                      <h2 className="text-xl font-semibold mb-2">Get Verified</h2>
                      <p className="text-gray-600 text-sm">
                        Submit your identity and credential documents to become a verified provider.
                        Verified providers get more visibility and client trust.
                      </p>
                    </div>
                    <Button
                      className="w-full min-h-[44px]"
                      onClick={() => navigate('/verification/upload')}
                    >
                      <Upload className="size-4 mr-2" />
                      Submit Documents
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <FileText className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-gray-700">
                        <p className="font-semibold mb-1">What you'll need</p>
                        <ul className="space-y-1">
                          <li>• Government-issued photo ID (required)</li>
                          <li>• Professional certification or license (if applicable)</li>
                          <li>• Insurance certificate (if applicable)</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Submitted states */}
            {overallStatus !== 'not_started' && (
              <>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="mb-4 flex justify-center">
                      {getStatusIcon()}
                    </div>
                    <Badge className={`${getStatusColor()} text-base px-4 py-1 mb-3`}>
                      {getStatusLabel()}
                    </Badge>
                    <h2 className="text-xl font-semibold mb-2">
                      {overallStatus === 'verified' && "You're Verified!"}
                      {overallStatus === 'pending' && 'Verification in Progress'}
                      {overallStatus === 'rejected' && 'Verification Issues'}
                    </h2>
                    <p className="text-gray-600 text-sm">
                      {overallStatus === 'verified' && 'Your identity and credentials have been verified. You can now access all provider features.'}
                      {overallStatus === 'pending' && 'Our team is reviewing your documents. This typically takes 2–3 business days.'}
                      {overallStatus === 'rejected' && 'Some of your documents need attention. Please review the details below.'}
                    </p>
                  </CardContent>
                </Card>

                {/* Submitted documents */}
                {documents.length > 0 && (
                  <Card>
                    <CardContent className="p-5 space-y-3">
                      <h3 className="font-semibold">Submitted Documents</h3>
                      {reuploadError && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                          <AlertCircle className="size-4 flex-shrink-0" />
                          <span>{reuploadError}</span>
                        </div>
                      )}
                      {documents.map((doc) => (
                        <div key={doc.id} className="p-3 bg-gray-50 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <FileText className="size-5 text-gray-600 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="font-medium text-sm capitalize">{doc.documentType.replace(/_/g, ' ')}</p>
                                <p className="text-xs text-gray-500">{new Date(doc.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <Badge
                              className={
                                doc.verificationStatus === 'verified' ? 'bg-green-100 text-green-700' :
                                doc.verificationStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }
                            >
                              {doc.verificationStatus === 'verified' ? 'Approved' :
                               doc.verificationStatus === 'rejected' ? 'Rejected' : 'Pending'}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            {/* View button — always available */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              disabled={viewingId === doc.id}
                              onClick={() => handleView(doc)}
                            >
                              {viewingId === doc.id ? (
                                <><Loader2 className="size-3.5 mr-1.5 animate-spin" />Loading…</>
                              ) : (
                                <><ExternalLink className="size-3.5 mr-1.5" />View</>
                              )}
                            </Button>
                            {/* Re-upload — only for rejected docs */}
                            {doc.verificationStatus === 'rejected' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="flex-1"
                                  disabled={reuploadingId === doc.id}
                                  onClick={() => fileInputRefs.current[doc.id]?.click()}
                                >
                                  {reuploadingId === doc.id ? (
                                    <><Loader2 className="size-3.5 mr-1.5 animate-spin" />Uploading…</>
                                  ) : (
                                    <><Upload className="size-3.5 mr-1.5" />Re-upload</>
                                  )}
                                </Button>
                                <input
                                  type="file"
                                  className="hidden"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  ref={(el) => { fileInputRefs.current[doc.id] = el; }}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleReupload(doc, file);
                                    e.target.value = '';
                                  }}
                                />
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {overallStatus === 'pending' && (
                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-gray-700">
                        You'll receive a notification once your verification is complete.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-gray-700">
                  Have questions? <button className="text-blue-600 font-medium" onClick={() => navigate('/support')}>Contact Support</button>
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
