import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { supportService } from '@/services';

const categories = [
  { value: 'technical', label: 'Technical Problem' },
  { value: 'billing', label: 'Payment Issue' },
  { value: 'account', label: 'Account Issue' },
  { value: 'dispute', label: 'Safety Issue' },
  { value: 'other', label: 'General Inquiry' },
];

// Map URL param category aliases to backend category values
const categoryAliasMap: Record<string, string> = {
  problem: 'technical',
  payment: 'billing',
  safety: 'dispute',
  account: 'account',
  general: 'other',
};

export default function CreateSupportTicket() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawCategory = searchParams.get('category') || '';
  const preselectedCategory = categoryAliasMap[rawCategory] || rawCategory;

  const [category, setCategory] = useState(preselectedCategory);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!category || !subject.trim() || !description.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await supportService.createTicket({
        subject: subject.trim(),
        description: description.trim(),
        category: category as any,
      });
      navigate('/support/tickets');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/support')}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="font-semibold">Create Support Ticket</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-8">
        <Card>
          <CardContent className="p-5 space-y-4">
            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category" className="min-h-[44px]">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                placeholder="Brief description of your issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="bg-white"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your issue in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="bg-white resize-none"
              />
            </div>

            {/* Error */}
            {submitError && (
              <p className="text-sm text-red-600">{submitError}</p>
            )}

            {/* Submit Button */}
            <Button
              className="w-full min-h-[44px]"
              onClick={handleSubmit}
              disabled={!category || !subject.trim() || !description.trim() || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Ticket'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
