import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, MapPin, MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { INSIntakeModal } from '@/app/components/ins/INSIntakeModal';

const serviceCategories = [
  'Plumbing',
  'Electrical',
  'Painting',
  'Carpentry',
  'Cleaning',
  'Handyman',
  'Landscaping',
  'HVAC',
  'Other',
];

export default function NewLocalServiceRequest() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('');
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
            <h1 className="font-semibold">Request Local Service</h1>
            <p className="text-xs text-gray-600">Find help nearby</p>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 space-y-6">
          {/* Category Selection */}
          <div className="space-y-3">
            <Label>What do you need help with?</Label>
            <div className="grid grid-cols-3 gap-2">
              {serviceCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    selectedCategory === category
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Service Title</Label>
            <Input
              id="title"
              placeholder="e.g., Fix leaking kitchen sink"
              className="bg-white"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what needs to be done..."
              rows={4}
              className="bg-white resize-none"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                id="location"
                placeholder="Enter your address"
                className="bg-white pl-10"
              />
            </div>
          </div>

          {/* Budget */}
          <div className="space-y-2">
            <Label htmlFor="budget">Budget (optional)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                id="budget"
                type="number"
                placeholder="0"
                className="bg-white pl-7"
              />
            </div>
          </div>

          {/* When needed */}
          <div className="space-y-2">
            <Label>When do you need this?</Label>
            <div className="grid grid-cols-3 gap-2">
              {['ASAP', 'This Week', 'Flexible'].map((option) => (
                <button
                  key={option}
                  className="p-3 rounded-lg border-2 border-gray-200 bg-white text-sm font-medium hover:border-gray-300 transition-colors"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="border-t bg-white p-4 space-y-2">
          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              // Simulate submission
              navigate('/my-requests');
            }}
          >
            Post Request
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
        category="local-services"
        mode="client"
        onComplete={(data) => {
          navigate('/review-edit', {
            state: {
              collectedData: data,
              category: 'local-services',
              mode: 'client',
            },
          });
        }}
        onManualFallback={() => setIsINSOpen(false)}
      />
    </>
  );
}