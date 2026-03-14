import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { INSIntakeModal } from '@/app/components/ins/INSIntakeModal';

const projectCategories = [
  'Web Development',
  'Mobile App',
  'Logo Design',
  'Graphic Design',
  'Video Editing',
  'Content Writing',
  'SEO/Marketing',
  'Audio Production',
  'Animation',
  'Other',
];

const budgetRanges = [
  'Under $500',
  '$500 - $1,000',
  '$1,000 - $2,500',
  '$2,500 - $5,000',
  '$5,000+',
];

export default function NewProject() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBudget, setSelectedBudget] = useState('');
  const [isINSOpen, setIsINSOpen] = useState(false);

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
            <Label htmlFor="title">Project Title</Label>
            <Input
              id="title"
              placeholder="e.g., Design a logo for my startup"
              className="bg-white"
            />
          </div>

          {/* Category */}
          <div className="space-y-3">
            <Label>Project Category</Label>
            <div className="grid grid-cols-2 gap-2">
              {projectCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    selectedCategory === category
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Project Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your project in detail, including goals, requirements, and deliverables..."
              rows={5}
              className="bg-white resize-none"
            />
          </div>

          {/* Skills Required */}
          <div className="space-y-2">
            <Label htmlFor="skills">Skills Required</Label>
            <Input
              id="skills"
              placeholder="e.g., Adobe Illustrator, Branding, Creative Design"
              className="bg-white"
            />
            <p className="text-xs text-gray-500">Separate skills with commas</p>
          </div>

          {/* Budget */}
          <div className="space-y-3">
            <Label>Budget Range</Label>
            <div className="grid grid-cols-2 gap-2">
              {budgetRanges.map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedBudget(range)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    selectedBudget === range
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {range}
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
            />
          </div>

          {/* Deliverables */}
          <div className="space-y-2">
            <Label htmlFor="deliverables">Expected Deliverables</Label>
            <Textarea
              id="deliverables"
              placeholder="List what you expect to receive (e.g., 3 logo concepts, source files, revisions...)"
              rows={3}
              className="bg-white resize-none"
            />
          </div>

          {/* Additional Details */}
          <div className="space-y-2">
            <Label htmlFor="additional">Additional Details (optional)</Label>
            <Textarea
              id="additional"
              placeholder="Any other information freelancers should know..."
              rows={3}
              className="bg-white resize-none"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="border-t bg-white p-4 space-y-2">
          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              navigate('/my-requests');
            }}
          >
            Post Project
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