import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { INSInputBar } from '@/app/components/ins/INSInputBar';
import { disputesService } from '@/services';

const disputeReasons = [
  { value: 'not-received', label: 'Service/Product not received' },
  { value: 'not-described', label: 'Not as described' },
  { value: 'quality', label: 'Poor quality work' },
  { value: 'incomplete', label: 'Work incomplete' },
  { value: 'overcharged', label: 'Overcharged or unauthorized charge' },
  { value: 'cancelled', label: 'Service was cancelled' },
  { value: 'other', label: 'Other reason' },
];

export default function DisputeFlow() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const transactionId = searchParams.get('transactionId');
  const requestId = searchParams.get('requestId');
  const projectId = searchParams.get('projectId');

  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleINSMessage = (message: string, files?: File[]) => {
    setDescription(prev => prev ? `${prev}\n${message}` : message);
    if (files && files.length > 0) {
      setAttachments(prev => [...prev, ...files.map(f => f.name)]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedReason || !description) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await disputesService.createDispute({
        transactionId: transactionId || undefined,
        contextType: requestId ? 'service_request' : projectId ? 'project' : undefined,
        contextId: requestId || projectId || undefined,
        reason: selectedReason,
        description,
        evidence: attachments,
      });
      setIsSubmitted(true);
    } catch {
      setSubmitError('Failed to submit dispute. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
          <button 
            onClick={() => navigate('/earnings')} 
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="font-semibold">Dispute Submitted</h1>
        </div>

        <div className="flex-1 flex items-center justify-center px-6">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center space-y-4">
              <div className="size-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                <CheckCircle className="size-8 text-blue-600" />
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-2">Dispute Submitted</h2>
                <p className="text-gray-600">
                  Your dispute has been received and is under review.
                </p>
              </div>

              <Card className="border-blue-200 bg-blue-50 text-left">
                <CardContent className="p-4 space-y-2 text-sm">
                  <p className="font-semibold text-blue-900">What happens next?</p>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Our team will review your case within 2-3 business days</li>
                    <li>• You'll receive updates via email and notifications</li>
                    <li>• Additional information may be requested</li>
                    <li>• Resolution typically takes 5-7 business days</li>
                  </ul>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Button 
                  className="w-full min-h-[44px]"
                  onClick={() => navigate('/support/tickets')}
                >
                  View in Support Tickets
                </Button>
                <Button 
                  variant="outline"
                  className="w-full min-h-[44px]"
                  onClick={() => navigate('/earnings')}
                >
                  Back to Earnings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 -ml-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="font-semibold">Request Refund / Dispute</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-32">
        {/* Warning */}
        <Card className="border-[#4C9F9F]/30 bg-[#4C9F9F]/5 mb-4">
          <CardContent className="p-4 flex gap-3">
            <AlertTriangle className="size-5 text-[#4C9F9F] flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-700">
              <p className="font-semibold mb-1">Important Information</p>
              <p>Disputes should only be filed for legitimate issues. Misuse may result in account restrictions. Both parties will be notified and given a chance to respond.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-5">
            {/* Transaction Info */}
            {transactionId && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Transaction ID:</p>
                <p className="font-medium">{transactionId}</p>
              </div>
            )}

            {/* Reason Selection */}
            <div className="space-y-3">
              <Label>Reason for dispute *</Label>
              <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
                {disputeReasons.map((reason) => (
                  <div key={reason.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <RadioGroupItem value={reason.value} id={reason.value} />
                    <Label htmlFor={reason.value} className="flex-1 cursor-pointer">
                      {reason.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Description Preview */}
            <div className="space-y-2">
              <Label>Detailed explanation *</Label>
              {description ? (
                <div className="border rounded-lg p-3 bg-gray-50 min-h-[120px] text-sm whitespace-pre-wrap">
                  {description}
                </div>
              ) : (
                <div className="border rounded-lg p-3 bg-gray-50 min-h-[120px] flex items-center justify-center text-gray-400 text-sm text-center">
                  Use the INS input below to explain why you're disputing this transaction
                </div>
              )}
            </div>

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                <Label>Evidence (Photos, screenshots, documents)</Label>
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                      📎 {file}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Terms Agreement */}
            <Card className="border-gray-200 bg-gray-50">
              <CardContent className="p-3 text-xs text-gray-600">
                By submitting this dispute, you acknowledge that:
                <ul className="mt-2 space-y-1 ml-4">
                  <li>• You've attempted to resolve this directly with the other party</li>
                  <li>• The information provided is accurate and truthful</li>
                  <li>• You understand both parties will be involved in the resolution process</li>
                </ul>
              </CardContent>
            </Card>

            {/* Submit Button */}
            {submitError && (
              <p className="text-sm text-red-600">{submitError}</p>
            )}
            <Button 
              className="w-full min-h-[44px]"
              onClick={handleSubmit}
              disabled={!selectedReason || !description || isSubmitting}
            >
              {isSubmitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
              {isSubmitting ? 'Submitting...' : 'Submit Dispute'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* INS Input Bar */}
      <INSInputBar
        onSend={handleINSMessage}
        placeholder="Explain your dispute with INS or type..."
        showAttachment={true}
        className="fixed bottom-0 left-0 right-0 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
      />
    </div>
  );
}