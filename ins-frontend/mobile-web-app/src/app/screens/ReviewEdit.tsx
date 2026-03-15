import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { ArrowLeft, Edit2, MessageCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { INSIntakeModal } from '@/app/components/ins/INSIntakeModal';
import { providerService } from '@/services';

export default function ReviewEdit() {
  const navigate = useNavigate();
  const location = useLocation();
  const { collectedData, category, mode } = location.state || {};

  const [formData, setFormData] = useState<any>(collectedData || {});
  const [isINSOpen, setIsINSOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Always call useEffect at the top level - never conditionally
  useEffect(() => {
    if (!collectedData || !category || !mode) {
      navigate('/');
    }
  }, [collectedData, category, mode, navigate]);

  // Return early only after all hooks have been called
  if (!collectedData || !category || !mode) {
    return null;
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      if (mode === 'provider') {
        // Extract profile fields from INS-collected data using common key names as fallbacks
        const title =
          formData.title ||
          formData.businessName ||
          formData.professionalTitle ||
          (Object.values(formData).find(
            (v) => typeof v === 'string' && (v as string).length > 0 && (v as string).length < 100,
          ) as string) ||
          '';
        const bio =
          formData.bio ||
          formData.about ||
          formData.description ||
          (Object.values(formData).find(
            (v) => typeof v === 'string' && (v as string).length >= 100,
          ) as string) ||
          '';
        const rateStr =
          formData.hourlyRate || formData.rate || formData.price || '';
        const hourlyRate = parseFloat(String(rateStr)) || 0;
        await providerService.createProfile({ title, bio, hourlyRate });
        navigate('/');
      } else {
        // Client mode: entity already created by INS, just navigate
        navigate('/my-requests');
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    if (mode === 'client') {
      if (category === 'local-services') return 'Service Request';
      if (category === 'jobs') return 'Job Posting';
      if (category === 'projects') return 'Project Request';
    } else {
      if (category === 'local-services') return 'Service Profile';
      if (category === 'jobs') return 'Job Seeker Profile';
      if (category === 'projects') return 'Freelancer Profile';
    }
    return 'Review & Edit';
  };

  const getCategoryLabel = () => {
    if (category === 'local-services') return 'Local Services';
    if (category === 'jobs') return 'Jobs';
    if (category === 'projects') return 'Projects';
    return '';
  };

  return (
    <>
      <div className="flex flex-col h-full bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b px-4 md:px-6 py-3 md:py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center">
            <ArrowLeft className="size-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-semibold text-base md:text-lg">Review & Edit</h1>
            <p className="text-xs md:text-sm text-gray-600">{getTitle()}</p>
          </div>
          <Badge variant="secondary" className="text-xs md:text-sm">{getCategoryLabel()}</Badge>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6 pb-24 space-y-4">
          {/* AI Summary */}
          <Card className="bg-[#EEF1F5] border-[#D1D5DB]">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#4C9F9F]/10 rounded-full flex-shrink-0">
                  <MessageCircle className="size-5 text-[#4C9F9F]" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm md:text-base mb-1">INS Summary</h3>
                  <p className="text-sm md:text-base text-gray-700">
                    I've collected all the information for your {getTitle().toLowerCase()}. 
                    Please review the details below and make any changes if needed.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Editable Fields */}
          <Card>
            <CardContent className="p-4 md:p-5 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm md:text-base">Details</h3>
                <button
                  onClick={() => setIsINSOpen(true)}
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1 min-h-[44px]"
                >
                  <Edit2 className="size-3.5" />
                  Edit with INS
                </button>
              </div>

              {/* Render fields based on collected data */}
              {Object.entries(formData).map(([key, value]) => {
                if (key === 'category' || key === 'mode') return null;
                
                const fieldLabel = key
                  .replace('question_', 'Field ')
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (l) => l.toUpperCase());

                return (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key} className="text-sm md:text-base">{fieldLabel}</Label>
                    {typeof value === 'string' && value.length > 100 ? (
                      <Textarea
                        id={key}
                        value={value as string}
                        onChange={(e) =>
                          setFormData({ ...formData, [key]: e.target.value })
                        }
                        rows={3}
                        className="bg-white text-sm md:text-base"
                      />
                    ) : (
                      <Input
                        id={key}
                        value={value as string}
                        onChange={(e) =>
                          setFormData({ ...formData, [key]: e.target.value })
                        }
                        className="bg-white text-sm md:text-base min-h-[44px]"
                      />
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Card>
            <CardContent className="p-4 md:p-5 space-y-3">
              <h3 className="font-semibold text-sm md:text-base">Additional Information</h3>
              <p className="text-sm text-gray-600">
                Add any extra details or special requirements
              </p>
              <Textarea
                placeholder="Optional additional notes..."
                rows={3}
                className="bg-white resize-none text-sm md:text-base"
                value={formData.additionalNotes || ''}
                onChange={(e) =>
                  setFormData({ ...formData, additionalNotes: e.target.value })
                }
              />
            </CardContent>
          </Card>

          {/* Preview Card */}
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="p-4 md:p-5">
              <h3 className="font-semibold mb-2 text-sm text-gray-600">Preview</h3>
              <p className="text-xs text-gray-500">
                This is how your {getTitle().toLowerCase()} will appear to others.
              </p>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  {Object.values(formData)
                    .filter((v) => typeof v === 'string' && v.length > 0)
                    .slice(0, 2)
                    .join(' • ')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="border-t bg-white p-4 space-y-2">
          {submitError && (
            <p className="text-sm text-red-600 text-center">{submitError}</p>
          )}
          <Button className="w-full min-h-[44px] md:min-h-[48px]" size="lg" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
          <Button
            variant="outline"
            className="w-full min-h-[44px] md:min-h-[48px]"
            size="lg"
            onClick={() => setIsINSOpen(true)}
          >
            Back to INS
          </Button>
        </div>
      </div>

      {/* INS Modal for editing */}
      <INSIntakeModal
        isOpen={isINSOpen}
        onClose={() => setIsINSOpen(false)}
        category={category}
        mode={mode}
        onComplete={(newData) => {
          setFormData({ ...formData, ...newData });
          setIsINSOpen(false);
        }}
        onManualFallback={() => {
          setIsINSOpen(false);
        }}
      />
    </>
  );
}