import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { INSInputBar } from '@/app/components/ins/INSInputBar';

const reportReasons = {
  user: [
    { value: 'harassment', label: 'Harassment or bullying' },
    { value: 'scam', label: 'Scam or fraud' },
    { value: 'inappropriate', label: 'Inappropriate behavior' },
    { value: 'spam', label: 'Spam or advertising' },
    { value: 'fake', label: 'Fake profile or identity' },
    { value: 'other', label: 'Other' },
  ],
  content: [
    { value: 'offensive', label: 'Offensive or hateful content' },
    { value: 'violence', label: 'Violence or dangerous content' },
    { value: 'illegal', label: 'Illegal activity' },
    { value: 'copyright', label: 'Copyright violation' },
    { value: 'misinformation', label: 'Misinformation' },
    { value: 'other', label: 'Other' },
  ],
  service: [
    { value: 'quality', label: 'Poor quality work' },
    { value: 'noshow', label: 'Provider didn\'t show up' },
    { value: 'overcharge', label: 'Overcharging or hidden fees' },
    { value: 'unsafe', label: 'Unsafe practices' },
    { value: 'unprofessional', label: 'Unprofessional conduct' },
    { value: 'other', label: 'Other' },
  ],
};

export default function ReportFlow() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const reportType = searchParams.get('type') || 'user'; // user, content, service
  const entityId = searchParams.get('userId') || searchParams.get('contentId') || searchParams.get('serviceId');
  const entityName = searchParams.get('name');

  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const reasons = reportReasons[reportType as keyof typeof reportReasons] || reportReasons.user;

  const handleINSMessage = (message: string, files?: File[]) => {
    setDescription(prev => prev ? `${prev}\n${message}` : message);
    if (files && files.length > 0) {
      setAttachments(prev => [...prev, ...files.map(f => f.name)]);
    }
  };

  const handleSubmit = () => {
    // Mock submit
    console.log('Submit report:', { reportType, entityId, selectedReason, description, attachments });
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="font-semibold">Report Submitted</h1>
        </div>

        <div className="flex-1 flex items-center justify-center px-6">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="size-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="size-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Report Received</h2>
              <p className="text-gray-600 mb-6">
                Thank you for your report. Our team will review this within 24-48 hours and take appropriate action.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                We take safety seriously and investigate all reports thoroughly. You'll receive an update via email once the review is complete.
              </p>
              <Button 
                className="w-full min-h-[44px]"
                onClick={() => navigate('/')}
              >
                Back to Home
              </Button>
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
        <h1 className="font-semibold">
          Report {reportType === 'user' ? 'User' : reportType === 'content' ? 'Content' : 'Service Issue'}
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-32">
        <Card>
          <CardContent className="p-5 space-y-5">
            {/* Entity Info */}
            {entityName && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Reporting:</p>
                <p className="font-medium">{entityName}</p>
              </div>
            )}

            {/* Reason Selection */}
            <div className="space-y-3">
              <Label>Reason for report *</Label>
              <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
                {reasons.map((reason) => (
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
              <Label>Additional details (optional)</Label>
              {description ? (
                <div className="border rounded-lg p-3 bg-gray-50 min-h-[100px] text-sm whitespace-pre-wrap">
                  {description}
                </div>
              ) : (
                <div className="border rounded-lg p-3 bg-gray-50 min-h-[100px] flex items-center justify-center text-gray-400 text-sm">
                  Use the INS input below to provide more details
                </div>
              )}
            </div>

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                <Label>Attachments</Label>
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                      📎 {file}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-gray-700 leading-relaxed">
                <strong>Important:</strong> False reports may result in account suspension. 
                All reports are reviewed by our moderation team. You may be contacted for additional information.
              </p>
            </div>

            {/* Submit Button */}
            <Button 
              className="w-full min-h-[44px]"
              onClick={handleSubmit}
              disabled={!selectedReason}
            >
              Submit Report
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* INS Input Bar */}
      <INSInputBar
        onSend={handleINSMessage}
        placeholder="Add details with INS or type..."
        showAttachment={true}
        className="fixed bottom-0 left-0 right-0 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
      />
    </div>
  );
}
