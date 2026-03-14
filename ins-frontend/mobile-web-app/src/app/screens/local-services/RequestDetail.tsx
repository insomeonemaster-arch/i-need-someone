import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, MapPin, Clock, DollarSign, User, Phone, Mail } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';

export default function LocalServiceRequestDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Mock data - in real app, fetch based on id
  const request = {
    id,
    title: 'Kitchen Sink Repair',
    category: 'Plumbing',
    description: 'Kitchen sink is leaking underneath. Water pools in the cabinet. Need someone to fix it ASAP.',
    location: '123 Main St, San Francisco, CA',
    budget: 120,
    urgency: 'ASAP',
    status: 'in-progress',
    postedDate: '2026-01-28',
    provider: {
      name: 'Mike Johnson',
      business: "Mike's Plumbing Services",
      rating: 4.8,
      phone: '(555) 123-4567',
      email: 'mike@plumbing.com',
    },
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/my-requests')} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-semibold">Request Details</h1>
        </div>
        <Badge>{request.status === 'in-progress' ? 'In Progress' : 'Active'}</Badge>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 space-y-4">
        {/* Main Info */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <div>
              <Badge variant="secondary" className="mb-2">{request.category}</Badge>
              <h2 className="text-xl font-semibold mb-2">{request.title}</h2>
              <p className="text-gray-700">{request.description}</p>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="size-4" />
                <span>{request.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="size-4" />
                <span>Needed: {request.urgency}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <DollarSign className="size-4" />
                <span>Budget: ${request.budget}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Provider Info */}
        {request.status === 'in-progress' && (
          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="font-semibold">Service Provider</h3>
              
              <div className="flex items-start gap-3">
                <div className="p-3 bg-blue-50 rounded-full">
                  <User className="size-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{request.provider.name}</h4>
                  <p className="text-sm text-gray-600">{request.provider.business}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-sm font-medium">{request.provider.rating}</span>
                    <span className="text-yellow-500">★</span>
                    <span className="text-xs text-gray-500">(48 reviews)</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <button className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                  <Phone className="size-4" />
                  {request.provider.phone}
                </button>
                <button className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                  <Mail className="size-4" />
                  {request.provider.email}
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="font-semibold">Timeline</h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="size-2 rounded-full bg-blue-600" />
                  <div className="w-0.5 h-8 bg-blue-200" />
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium">Request Posted</p>
                  <p className="text-xs text-gray-500">{request.postedDate}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="size-2 rounded-full bg-blue-600" />
                  <div className="w-0.5 h-8 bg-gray-200" />
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium">Provider Accepted</p>
                  <p className="text-xs text-gray-500">2026-01-28</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="size-2 rounded-full bg-gray-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-400">Work Completed</p>
                  <p className="text-xs text-gray-400">Pending</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="border-t bg-white p-4 space-y-2">
        <Button className="w-full" size="lg" onClick={() => navigate('/messages')}>
          Message Provider
        </Button>
        <Button variant="outline" className="w-full" size="lg">
          Cancel Request
        </Button>
      </div>
    </div>
  );
}
