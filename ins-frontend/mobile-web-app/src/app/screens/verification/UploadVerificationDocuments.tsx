import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Upload, CheckCircle, FileText, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { verificationService } from '@/services';
import { STORAGE_KEYS, API_CONFIG } from '@/services/config';

const documentTypes = [
  { id: 'government_id', label: 'Government-issued ID', description: "Driver's license, passport, or national ID", required: true },
  { id: 'certification', label: 'Professional Certification', description: 'License or certification for your services', required: false },
  { id: 'insurance', label: 'Insurance Certificate', description: 'Proof of liability insurance', required: false },
  { id: 'portfolio', label: 'Portfolio / Resume', description: 'Examples of your work or professional resume', required: false },
];

export default function UploadVerificationDocuments() {
  const navigate = useNavigate();
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, File | null>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleFileUpload = (docId: string, file: File | null) => {
    setUploadedDocs(prev => ({ ...prev, [docId]: file }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const entries = Object.entries(uploadedDocs).filter(([, file]) => file !== null);

      for (const [docType, file] of entries) {
        // Step 1: upload the raw file to Supabase via the upload endpoint
        const formData = new FormData();
        formData.append('file', file!);

        const uploadRes = await fetch(
          `${API_CONFIG.baseURL}/upload/document`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)}`,
            },
            body: formData,
          },
        );

        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({}));
          throw new Error(err?.error?.message || `Failed to upload ${docType}`);
        }

        const uploadResult = await uploadRes.json();
        const fileUrl: string = uploadResult?.data?.url ?? uploadResult?.url;
        if (!fileUrl) throw new Error(`No URL returned for ${docType}`);

        // Step 2: register the document in the verification system
        await verificationService.submitDocument({
          documentType: docType,
          fileUrl,
          fileType: file!.type,
        });
      }

      navigate('/verification/status');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const hasRequiredDocs = !!uploadedDocs['government_id'];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/verification/status')}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="font-semibold">Upload Documents</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 space-y-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <FileText className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-semibold mb-1">Document Requirements</p>
                <ul className="space-y-1">
                  <li>• Files must be in PDF, JPG, or PNG format</li>
                  <li>• Maximum file size: 10MB per document</li>
                  <li>• Documents must be clear and readable</li>
                  <li>• Personal information must be visible</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {documentTypes.map((docType) => (
          <Card key={docType.id}>
            <CardContent className="p-5 space-y-3">
              <div>
                <Label className="flex items-center gap-1.5">
                  {docType.label}
                  {docType.required && <span className="text-red-600 text-xs">*Required</span>}
                </Label>
                <p className="text-sm text-gray-600 mt-1">{docType.description}</p>
              </div>

              {uploadedDocs[docType.id] ? (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="size-5 text-green-600" />
                    <div>
                      <p className="font-medium text-sm">{uploadedDocs[docType.id]!.name}</p>
                      <p className="text-xs text-gray-600">
                        {(uploadedDocs[docType.id]!.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleFileUpload(docType.id, null)} disabled={submitting}>
                    Remove
                  </Button>
                </div>
              ) : (
                <label className="block">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 cursor-pointer transition-colors">
                    <Upload className="size-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700 mb-1">Click to upload</p>
                    <p className="text-xs text-gray-500">PDF, JPG, or PNG (max 10MB)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(docType.id, file);
                    }}
                  />
                </label>
              )}
            </CardContent>
          </Card>
        ))}

        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-4 text-xs text-gray-600">
            <p className="font-semibold mb-2">Privacy & Security</p>
            <p>
              Your documents are encrypted and stored securely. They are only used for verification
              purposes and will not be shared with other users.
            </p>
          </CardContent>
        </Card>

        {submitError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertCircle className="size-4 flex-shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <Button
          className="w-full min-h-[44px]"
          onClick={handleSubmit}
          disabled={!hasRequiredDocs || submitting}
        >
          {submitting ? (
            <><Loader2 className="size-4 mr-2 animate-spin" />Uploading...</>
          ) : (
            'Submit for Review'
          )}
        </Button>

        {!hasRequiredDocs && (
          <p className="text-sm text-center text-gray-600">
            * A government-issued ID is required before submitting
          </p>
        )}
      </div>
    </div>
  );
}
