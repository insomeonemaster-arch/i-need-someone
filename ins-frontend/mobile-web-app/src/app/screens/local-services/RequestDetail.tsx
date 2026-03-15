import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, MapPin, Clock, DollarSign, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import { localServicesService, ServiceRequest } from '@/services';

export default function LocalServiceRequestDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id) return;
    localServicesService
      .getRequest(id)
      .then(setRequest)
      .catch(() => setError('Failed to load request.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!id || !window.confirm('Cancel this request?')) return;
    setCancelling(true);
    try {
      await localServicesService.cancelRequest(id);
      navigate('/my-requests');
    } catch {
      setError('Failed to cancel request.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/my-requests')} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="font-semibold">Request Details</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/my-requests')} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="font-semibold">Request Details</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">{error ?? 'Request not found'}</p>
        </div>
      </div>
    );
  }

  const locationLabel = request.location
    ? [request.location.address, request.location.city, request.location.state].filter(Boolean).join(', ')
    : '—';

  const budgetLabel =
    request.budget?.min && request.budget?.max
      ? `$${request.budget.min} – $${request.budget.max}`
      : request.budget?.min
        ? `$${request.budget.min}`
        : '—';

  const statusLabel = request.status === 'in-progress' ? 'In Progress' : request.status.charAt(0).toUpperCase() + request.status.slice(1);
  const canCancel = request.status === 'open' || request.status === 'quoted';

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
        <Badge>{statusLabel}</Badge>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 space-y-4">
        {/* Main Info */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <div>
              {request.category && <Badge variant="secondary" className="mb-2">{request.category}</Badge>}
              <h2 className="text-xl font-semibold mb-2">{request.title || request.description}</h2>
              <p className="text-gray-700">{request.description}</p>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="size-4" />
                <span>{locationLabel}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="size-4" />
                <span>Posted: {new Date(request.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <DollarSign className="size-4" />
                <span>Budget: {budgetLabel}</span>
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
        {canCancel && (
          <Button
            variant="outline"
            className="w-full"
            size="lg"
            onClick={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
            Cancel Request
          </Button>
        )}
      </div>
    </div>
  );
}
