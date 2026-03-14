import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, CheckCircle, MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';
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
];

export default function LocalServiceProviderSetup() {
  const navigate = useNavigate();
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isINSOpen, setIsINSOpen] = useState(false);

  const toggleService = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
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
            <h1 className="font-semibold">Setup Service Profile</h1>
            <p className="text-xs text-gray-600">Offer local services</p>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 space-y-6">
          {/* Business Name */}
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              placeholder="e.g., Mike's Plumbing Services"
              className="bg-white"
            />
          </div>

          {/* Services Offered */}
          <div className="space-y-3">
            <Label>Services You Offer</Label>
            <div className="grid grid-cols-2 gap-2">
              {serviceCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => toggleService(category)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all flex items-center justify-between ${
                    selectedServices.includes(category)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {category}
                  {selectedServices.includes(category) && (
                    <CheckCircle className="size-4 ml-1" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">About Your Services</Label>
            <Textarea
              id="bio"
              placeholder="Tell clients about your experience and what makes you stand out..."
              rows={4}
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
          </div>

          {/* Service Area */}
          <div className="space-y-2">
            <Label htmlFor="serviceArea">Service Area (miles)</Label>
            <Input
              id="serviceArea"
              type="number"
              placeholder="e.g., 15"
              className="bg-white"
            />
          </div>

          {/* Availability */}
          <Card className="bg-white">
            <CardContent className="p-4 space-y-3">
              <Label>Availability</Label>
              {['Available for immediate jobs', 'Weekend availability', 'Emergency services'].map(
                (option) => (
                  <div key={option} className="flex items-center justify-between">
                    <span className="text-sm">{option}</span>
                    <Switch />
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </div>

        {/* Submit Button */}
        <div className="border-t bg-white p-4 space-y-2">
          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              // Simulate submission
              navigate('/');
            }}
          >
            Start Offering Services
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
        mode="provider"
        onComplete={(data) => {
          navigate('/review-edit', {
            state: {
              collectedData: data,
              category: 'local-services',
              mode: 'provider',
            },
          });
        }}
        onManualFallback={() => setIsINSOpen(false)}
      />
    </>
  );
}