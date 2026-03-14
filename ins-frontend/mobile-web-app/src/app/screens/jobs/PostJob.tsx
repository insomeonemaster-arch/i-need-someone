import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, MapPin, MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { INSIntakeModal } from '@/app/components/ins/INSIntakeModal';

const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Temporary'];
const experienceLevels = ['Entry Level', 'Mid Level', 'Senior', 'Executive'];

export default function PostJob() {
  const navigate = useNavigate();
  const [selectedJobType, setSelectedJobType] = useState('');
  const [selectedExperience, setSelectedExperience] = useState('');
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
            <h1 className="font-semibold">Post a Job</h1>
            <p className="text-xs text-gray-600">Find the right candidate</p>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 space-y-6">
          {/* Job Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Job Title</Label>
            <Input
              id="title"
              placeholder="e.g., Marketing Manager"
              className="bg-white"
            />
          </div>

          {/* Company */}
          <div className="space-y-2">
            <Label htmlFor="company">Company Name</Label>
            <Input
              id="company"
              placeholder="Your company name"
              className="bg-white"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                id="location"
                placeholder="e.g., San Francisco, CA or Remote"
                className="bg-white pl-10"
              />
            </div>
          </div>

          {/* Job Type */}
          <div className="space-y-3">
            <Label>Job Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {jobTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedJobType(type)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    selectedJobType === type
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Experience Level */}
          <div className="space-y-3">
            <Label>Experience Level</Label>
            <div className="grid grid-cols-2 gap-2">
              {experienceLevels.map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedExperience(level)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    selectedExperience === level
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Job Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the role, responsibilities, and requirements..."
              rows={5}
              className="bg-white resize-none"
            />
          </div>

          {/* Salary Range */}
          <div className="space-y-2">
            <Label>Salary Range</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input
                  type="number"
                  placeholder="Min"
                  className="bg-white pl-7"
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input
                  type="number"
                  placeholder="Max"
                  className="bg-white pl-7"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">Per year for full-time positions</p>
          </div>

          {/* Benefits */}
          <div className="space-y-2">
            <Label htmlFor="benefits">Benefits (optional)</Label>
            <Textarea
              id="benefits"
              placeholder="Health insurance, 401k, flexible hours..."
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
            Post Job Opening
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