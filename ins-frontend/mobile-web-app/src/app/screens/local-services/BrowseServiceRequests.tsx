import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, MapPin, Clock, Search, Loader2, AlertCircle, Wrench } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { localServicesService, ServiceRequest } from '@/services';

export default function BrowseServiceRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await localServicesService.browseOpenRequests({ limit: 50 });
      setRequests(data);
    } catch (err) {
      console.error('Failed to load service requests:', err);
      setError('Failed to load service requests. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const filtered = searchQuery
    ? requests.filter(
        (r) =>
          r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : requests;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="font-semibold">Browse Service Requests</h1>
      </div>

      <div className="p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="size-8 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <AlertCircle className="size-12 text-red-400 mb-4" />
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <button
            onClick={loadRequests}
            className="px-4 py-2 bg-[var(--brand-orange)] text-white rounded-lg hover:bg-orange-600"
          >
            Try Again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <Wrench className="size-12 text-gray-300 mb-4" />
          <p className="text-gray-500 text-center">No open requests</p>
          <p className="text-gray-400 text-sm text-center mt-1">Check back soon for new service requests</p>
        </div>
      ) : (
        <div className="flex-1 px-4 pb-24 space-y-3 overflow-y-auto">
          {filtered.map((request) => (
            <Card
              key={request.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/local-services/detail/${request.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-semibold leading-tight">{request.title}</h3>
                    <p className="text-sm text-gray-600">
                      {typeof request.category === 'object' && request.category !== null
                        ? (request.category as any).name
                        : request.category || 'General'}
                    </p>
                  </div>
                  {request.budget && (
                    <span className="font-semibold text-sm whitespace-nowrap">
                      ${request.budget.min} - ${request.budget.max}
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {request.description?.slice(0, 150)}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="size-3" />
                      <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                    </div>
                    {request.location?.city && (
                      <div className="flex items-center gap-1">
                        <MapPin className="size-3" />
                        <span>{request.location.city}</span>
                      </div>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-xs">Open</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
