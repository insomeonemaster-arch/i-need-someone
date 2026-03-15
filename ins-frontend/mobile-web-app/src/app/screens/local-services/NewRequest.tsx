import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, MapPin, MessageCircle, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { INSIntakeModal } from '@/app/components/ins/INSIntakeModal';
import { localServicesService, categoriesService } from '@/services';

export default function NewLocalServiceRequest() {
  const navigate = useNavigate();
  const [isINSOpen, setIsINSOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    categoryId: '',
    title: '',
    description: '',
    addressLine1: '',
    city: '',
    state: '',
    postalCode: '',
    budgetMin: '',
    budgetMax: '',
    urgency: '' as 'low' | 'medium' | 'high' | 'emergency' | '',
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await categoriesService.getCategories();
      const localServicesCats = cats.filter((c: any) => c.module === 'local-services');
      setCategories(localServicesCats);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const handleSubmit = async () => {
    setError('');
    
    // Validation
    if (!formData.categoryId) {
      setError('Please select a category');
      return;
    }
    if (!formData.title || formData.title.length < 5) {
      setError('Title must be at least 5 characters');
      return;
    }
    if (!formData.description || formData.description.length < 10) {
      setError('Description must be at least 10 characters');
      return;
    }
    if (!formData.addressLine1 || !formData.city || !formData.state || !formData.postalCode) {
      setError('Please fill in all location fields');
      return;
    }

    setLoading(true);
    try {
      const requestData: any = {
        categoryId: formData.categoryId,
        title: formData.title,
        description: formData.description,
        addressLine1: formData.addressLine1,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
      };

      if (formData.urgency) {
        requestData.urgency = formData.urgency;
      }
      if (formData.budgetMin) {
        requestData.budgetMin = parseFloat(formData.budgetMin);
      }
      if (formData.budgetMax) {
        requestData.budgetMax = parseFloat(formData.budgetMax);
      }

      await localServicesService.createRequest(requestData);
      navigate('/my-requests');
    } catch (err: any) {
      console.error('Failed to create request:', err);
      setError(err.message || 'Failed to create request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const urgencyOptions = [
    { value: 'emergency', label: 'ASAP' },
    { value: 'high', label: 'This Week' },
    { value: 'medium', label: 'Flexible' },
  ] as const;

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
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="size-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Category Selection */}
          <div className="space-y-3">
            <Label>What do you need help with?</Label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setFormData({ ...formData, categoryId: category.id })}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    formData.categoryId === category.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {category.name}
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
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="address">Street Address</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                id="address"
                placeholder="Enter your address"
                className="bg-white pl-10"
                value={formData.addressLine1}
                onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
              />
            </div>
          </div>

          {/* City, State, ZIP */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="City"
                className="bg-white"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                placeholder="State"
                className="bg-white"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="zip">ZIP Code</Label>
            <Input
              id="zip"
              placeholder="ZIP Code"
              className="bg-white"
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
            />
          </div>

          {/* Budget */}
          <div className="space-y-2">
            <Label>Budget (optional)</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input
                  type="number"
                  placeholder="Min"
                  className="bg-white pl-7"
                  value={formData.budgetMin}
                  onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input
                  type="number"
                  placeholder="Max"
                  className="bg-white pl-7"
                  value={formData.budgetMax}
                  onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* When needed */}
          <div className="space-y-2">
            <Label>When do you need this?</Label>
            <div className="grid grid-cols-3 gap-2">
              {urgencyOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFormData({ ...formData, urgency: option.value })}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    formData.urgency === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {option.label}
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
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Creating Request...
              </>
            ) : (
              'Post Request'
            )}
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