import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Search, Star, MapPin, Filter, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { localServicesService, providerService, ProviderPublicProfile } from '@/services';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function BrowseLocalServices() {
  const navigate = useNavigate();
  const [providers, setProviders] = useState<ProviderPublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadProviders = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await localServicesService.browse({ limit: 50 });
      setProviders(data as ProviderPublicProfile[]);
    } catch (err) {
      console.error('Failed to load providers:', err);
      setError('Failed to load providers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const filteredProviders = searchQuery
    ? providers.filter(p => 
        p.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : providers;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <button 
          onClick={() => navigate('/')} 
          className="p-2 -ml-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="font-semibold">Browse Providers</h1>
      </div>

      <div className="p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Search providers..."
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
            onClick={loadProviders}
            className="px-4 py-2 bg-[var(--brand-orange)] text-white rounded-lg hover:bg-orange-600"
          >
            Try Again
          </button>
        </div>
      ) : filteredProviders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <Search className="size-12 text-gray-300 mb-4" />
          <p className="text-gray-500 text-center">No providers found</p>
          <p className="text-gray-400 text-sm text-center mt-1">Try adjusting your search</p>
        </div>
      ) : (
        <div className="flex-1 px-4 pb-24 space-y-3 overflow-y-auto">
          {filteredProviders.map((provider) => (
            <Card
              key={provider.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/provider/local/${provider.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="flex-shrink-0">
                    {provider.avatarUrl ? (
                      <img src={provider.avatarUrl} alt={provider.displayName} className="object-cover w-full h-full" />
                    ) : (
                      <AvatarFallback className="bg-gray-300 text-gray-600">
                        {provider.displayName ? getInitials(provider.displayName) : '?'}
                      </AvatarFallback>
                    )}
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <h3 className="font-semibold leading-tight">{provider.displayName}</h3>
                        <p className="text-sm text-gray-600">{provider.title}</p>
                      </div>
                      {provider.hourlyRate && (
                        <span className="font-semibold text-sm whitespace-nowrap">
                          ${provider.hourlyRate}/hr
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                      <div className="flex items-center gap-1">
                        <Star className="size-3 fill-yellow-400 text-yellow-400" />
                        <span>{provider.ratings?.toFixed(1) || '0.0'}</span>
                      </div>
                      <span>({provider.reviewsCount || 0} reviews)</span>
                      {provider.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="size-3" />
                          <span>{provider.location.city}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {provider.skills?.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
