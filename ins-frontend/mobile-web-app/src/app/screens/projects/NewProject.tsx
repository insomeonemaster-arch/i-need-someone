import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { INSIntakeModal } from '@/app/components/ins/INSIntakeModal';
import { projectsService, categoriesService, Category } from '@/services';

const budgetRanges: { label: string; min: number; max: number }[] = [
  { label: 'Under $500', min: 0, max: 500 },
  { label: '$500 - $1,000', min: 500, max: 1000 },
  { label: '$1,000 - $2,500', min: 1000, max: 2500 },
  { label: '$2,500 - $5,000', min: 2500, max: 5000 },
  { label: '$5,000+', min: 5000, max: 0 },
];

export default function NewProject() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState('');
  const [timeline, setTimeline] = useState('');
  const [deliverables, setDeliverables] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedBudget, setSelectedBudget] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isINSOpen, setIsINSOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    categoriesService.getCategoriesByModule('projects').then(setCategories).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !selectedCategoryId) {
      setSubmitError('Title, description, and category are required.');
      return;
    }
    if (title.trim().length < 5) {
      setSubmitError('Title must be at least 5 characters.');
      return;
    }
    if (description.trim().length < 10) {
      setSubmitError('Description must be at least 10 characters.');
      return;
    }
    const budgetRange = budgetRanges.find((r) => r.label === selectedBudget);
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await projectsService.createProject({
        title,
        description,
        categoryId: selectedCategoryId,
        budgetMin: budgetRange?.min,
        budgetMax: budgetRange && budgetRange.max > 0 ? budgetRange.max : undefined,
        requiredSkills: skills ? skills.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
        estimatedDuration: timeline || undefined,
        deliverables: deliverables
          ? deliverables.split('\n').map((d) => d.trim()).filter(Boolean)
          : undefined,
      });
      navigate('/my-requests');
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to post project. Please try again.');
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
            <h1 className="font-semibold">Post a Project</h1>
            <p className="text-xs text-gray-600">Hire remote talent</p>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 space-y-6">
          {/* Project Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Project Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Design a logo for my startup"
              className="bg-white"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Project Category *</Label>
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

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Project Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe your project in detail, including goals, requirements, and deliverables..."
              rows={5}
              className="bg-white resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Skills Required */}
          <div className="space-y-2">
            <Label htmlFor="skills">Skills Required</Label>
            <Input
              id="skills"
              placeholder="e.g., Adobe Illustrator, Branding, Creative Design"
              className="bg-white"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
            />
            <p className="text-xs text-gray-500">Separate skills with commas</p>
          </div>

          {/* Budget */}
          <div className="space-y-3">
            <Label>Budget Range</Label>
            <div className="grid grid-cols-2 gap-2">
              {budgetRanges.map((range) => (
                <button
                  key={range.label}
                  onClick={() => setSelectedBudget(range.label)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    selectedBudget === range.label
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-2">
            <Label htmlFor="timeline">Expected Timeline</Label>
            <Input
              id="timeline"
              placeholder="e.g., 2 weeks, 1 month"
              className="bg-white"
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
            />
          </div>

          {/* Deliverables */}
          <div className="space-y-2">
            <Label htmlFor="deliverables">Expected Deliverables</Label>
            <Textarea
              id="deliverables"
              placeholder="List what you expect to receive (one per line)..."
              rows={3}
              className="bg-white resize-none"
              value={deliverables}
              onChange={(e) => setDeliverables(e.target.value)}
            />
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
            {isSubmitting ? 'Posting...' : 'Post Project'}
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
        category="projects"
        mode="client"
        onComplete={(data) => {
          navigate('/review-edit', {
            state: {
              collectedData: data,
              category: 'projects',
              mode: 'client',
            },
          });
        }}
        onManualFallback={() => setIsINSOpen(false)}
      />
    </>
  );
}
