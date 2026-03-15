import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, MapPin, MessageCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { INSIntakeModal } from '@/app/components/ins/INSIntakeModal';
import { jobsService, categoriesService, Category } from '@/services';

const jobTypes: { label: string; value: string }[] = [
  { label: 'Full-time', value: 'full_time' },
  { label: 'Part-time', value: 'part_time' },
  { label: 'Contract', value: 'contract' },
  { label: 'Temporary', value: 'temporary' },
];

const workLocations: { label: string; value: string }[] = [
  { label: 'On-site', value: 'on_site' },
  { label: 'Remote', value: 'remote' },
  { label: 'Hybrid', value: 'hybrid' },
];

export default function PostJob() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [description, setDescription] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [selectedJobType, setSelectedJobType] = useState('');
  const [selectedWorkLocation, setSelectedWorkLocation] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isINSOpen, setIsINSOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    categoriesService.getCategoriesByModule('jobs').then(setCategories).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !selectedCategoryId || !selectedJobType || !selectedWorkLocation) {
      setSubmitError('Title, description, category, job type, and work location are required.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await jobsService.createJob({
        title,
        description,
        categoryId: selectedCategoryId,
        employmentType: selectedJobType as any,
        workLocation: selectedWorkLocation as any,
        city: city || undefined,
        state: state || undefined,
        salaryMin: salaryMin ? parseFloat(salaryMin) : undefined,
        salaryMax: salaryMax ? parseFloat(salaryMax) : undefined,
        salaryType: 'yearly',
        companyName: company || undefined,
        positionsAvailable: 1,
      });
      navigate('/my-requests');
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to post job. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col h-full bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <h1 className="font-semibold">Post a Job</h1>
            <p className="text-xs text-gray-600">Find the right candidate</p>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 space-y-6">
          {/* Job Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Job Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Marketing Manager"
              className="bg-white"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Company */}
          <div className="space-y-2">
            <Label htmlFor="company">Company Name</Label>
            <Input
              id="company"
              placeholder="Your company name"
              className="bg-white"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label>Location</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  placeholder="City"
                  className="bg-white pl-9"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <Input
                placeholder="State"
                className="bg-white"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Job Category *</Label>
            <select
              id="category"
              className="w-full h-10 px-3 rounded-md border bg-white text-sm"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Job Type */}
          <div className="space-y-3">
            <Label>Job Type *</Label>
            <div className="grid grid-cols-2 gap-2">
              {jobTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSelectedJobType(type.value)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    selectedJobType === type.value
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Work Location */}
          <div className="space-y-3">
            <Label>Work Location *</Label>
            <div className="grid grid-cols-3 gap-2">
              {workLocations.map((loc) => (
                <button
                  key={loc.value}
                  onClick={() => setSelectedWorkLocation(loc.value)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    selectedWorkLocation === loc.value
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {loc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Job Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the role, responsibilities, and requirements..."
              rows={5}
              className="bg-white resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Salary Range */}
          <div className="space-y-2">
            <Label>Salary Range (Annual)</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input
                  type="number"
                  placeholder="Min"
                  className="bg-white pl-7"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input
                  type="number"
                  placeholder="Max"
                  className="bg-white pl-7"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="border-t bg-white p-4 space-y-2">
          {submitError && <p className="text-sm text-red-600">{submitError}</p>}
          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
            {isSubmitting ? 'Posting...' : 'Post Job Opening'}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            size="lg"
            onClick={() => setIsINSOpen(true)}
          >
            <MessageCircle className="size-4 mr-2" />
            Get help from INS
          </Button>
        </div>
      </div>

      {/* INS Modal */}
      <INSIntakeModal
        isOpen={isINSOpen}
        onClose={() => setIsINSOpen(false)}
        category="jobs"
        mode="client"
        onComplete={(data) => {
          navigate('/review-edit', {
            state: {
              collectedData: data,
              category: 'jobs',
              mode: 'client',
            },
          });
        }}
        onManualFallback={() => setIsINSOpen(false)}
      />
    </>
  );
}
