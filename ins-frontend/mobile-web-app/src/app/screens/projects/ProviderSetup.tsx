import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, CheckCircle, MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { INSIntakeModal } from '@/app/components/ins/INSIntakeModal';

const skillCategories = [
  'Web Development',
  'Mobile Development',
  'UI/UX Design',
  'Graphic Design',
  'Video Editing',
  'Content Writing',
  'SEO/Marketing',
  'Photography',
  'Audio Production',
  'Animation',
  '3D Modeling',
  'Data Analysis',
];

export default function ProjectProviderSetup() {
  const navigate = useNavigate();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [isINSOpen, setIsINSOpen] = useState(false);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
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
            <h1 className="font-semibold">Setup Freelancer Profile</h1>
            <p className="text-xs text-gray-600">Offer your skills remotely</p>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 space-y-6">
          {/* Professional Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Professional Title</Label>
            <Input
              id="title"
              placeholder="e.g., Senior Web Developer"
              className="bg-white"
            />
          </div>

          {/* Skills */}
          <div className="space-y-3">
            <Label>Your Skills & Services</Label>
            <div className="grid grid-cols-2 gap-2">
              {skillCategories.map((skill) => (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all flex items-center justify-between ${
                    selectedSkills.includes(skill)
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="truncate">{skill}</span>
                  {selectedSkills.includes(skill) && (
                    <CheckCircle className="size-4 ml-1 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Professional Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell clients about your experience, expertise, and what makes you unique..."
              rows={5}
              className="bg-white resize-none"
            />
          </div>

          {/* Experience */}
          <div className="space-y-2">
            <Label htmlFor="experience">Years of Experience</Label>
            <Input
              id="experience"
              type="number"
              placeholder="0"
              className="bg-white"
            />
          </div>

          {/* Hourly Rate */}
          <div className="space-y-2">
            <Label htmlFor="rate">Hourly Rate</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                id="rate"
                type="number"
                placeholder="0"
                className="bg-white pl-7"
              />
            </div>
            <p className="text-xs text-gray-500">This is your standard hourly rate. You can adjust pricing for each project.</p>
          </div>

          {/* Portfolio */}
          <div className="space-y-2">
            <Label htmlFor="portfolio">Portfolio URL (optional)</Label>
            <Input
              id="portfolio"
              type="url"
              placeholder="https://yourportfolio.com"
              className="bg-white"
            />
          </div>

          {/* Languages */}
          <div className="space-y-2">
            <Label htmlFor="languages">Languages</Label>
            <Input
              id="languages"
              placeholder="e.g., English (Native), Spanish (Fluent)"
              className="bg-white"
            />
          </div>

          {/* Availability */}
          <Card className="bg-white">
            <CardContent className="p-4 space-y-2">
              <Label>Work Preferences</Label>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="hoursPerWeek" className="text-sm font-normal">Available Hours Per Week</Label>
                  <Input
                    id="hoursPerWeek"
                    type="number"
                    placeholder="e.g., 20"
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone" className="text-sm font-normal">Timezone</Label>
                  <Input
                    id="timezone"
                    placeholder="e.g., PST (GMT-8)"
                    className="bg-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Certifications */}
          <div className="space-y-2">
            <Label htmlFor="certifications">Certifications & Education (optional)</Label>
            <Textarea
              id="certifications"
              placeholder="List any relevant certifications, degrees, or training..."
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
              navigate('/');
            }}
          >
            Start Freelancing
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
        mode="provider"
        onComplete={(data) => {
          navigate('/review-edit', {
            state: {
              collectedData: data,
              category: 'projects',
              mode: 'provider',
            },
          });
        }}
        onManualFallback={() => setIsINSOpen(false)}
      />
    </>
  );
}