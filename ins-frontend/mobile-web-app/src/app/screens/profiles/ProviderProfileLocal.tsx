import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Star, MapPin, CheckCircle, MessageSquare, Flag } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { Separator } from '@/app/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/app/components/ui/tabs';
import { providerService, ProviderPublicProfile } from '@/services';

export default function ProviderProfileLocal() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [provider, setProvider] = useState<ProviderPublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    providerService
      .getPublicProfile(id)
      .then(setProvider)
      .catch(() => setError('Failed to load provider profile.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="font-semibold">Provider Profile</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="font-semibold">Provider Profile</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">{error ?? 'Provider not found'}</p>
        </div>
      </div>
    );
  }

  const initials = provider.displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const locationLabel = provider.location
    ? [provider.location.city, provider.location.state].filter(Boolean).join(', ')
    : null;



  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 -ml-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="font-semibold flex-1">Provider Profile</h1>
        <button 
          onClick={() => navigate(`/report?type=user&userId=${provider.id}&name=${encodeURIComponent(provider.displayName)}`)}
          className="p-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <Flag className="size-5 text-gray-600" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-32">
        {/* Profile Header */}
        <Card className="rounded-none border-x-0">
          <CardContent className="p-5">
            <div className="flex gap-4 mb-4">
              <Avatar className="size-20 flex-shrink-0">
                <AvatarFallback className="bg-blue-500 text-white text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-semibold">{provider.displayName}</h2>
                </div>
                <p className="text-gray-600 mb-2">{provider.title}</p>
                
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="size-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{provider.ratings?.toFixed(1) ?? '—'}</span>
                    <span className="text-gray-500">({provider.reviewsCount})</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">{provider.completedJobs} completed</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm mb-4">
              {locationLabel && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="size-4" />
                  <span>{locationLabel}</span>
                </div>
              )}
              {provider.hourlyRate && (
                <div className="text-lg font-semibold text-[var(--brand-orange)]">
                  ${provider.hourlyRate}/hour
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button className="flex-1 min-h-[44px]" onClick={() => navigate('/local-services/new')}>
                Request Service
              </Button>
              <Button variant="outline" size="icon" className="min-w-[44px] min-h-[44px]" onClick={() => navigate('/chat/' + provider.userId)}>
                <MessageSquare className="size-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="about" className="bg-white">
          <TabsList className="w-full border-b rounded-none">
            <TabsTrigger value="about" className="flex-1">About</TabsTrigger>
            <TabsTrigger value="portfolio" className="flex-1">Portfolio</TabsTrigger>
            <TabsTrigger value="reviews" className="flex-1">Reviews</TabsTrigger>
          </TabsList>

          {/* About Tab */}
          <TabsContent value="about" className="p-5 space-y-4">
            <div>
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-gray-700 leading-relaxed">{provider.bio}</p>
            </div>

            {provider.skills && provider.skills.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3">Skills & Services</h3>
                  <div className="flex flex-wrap gap-2">
                    {provider.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="p-5">
            {provider.portfolio && provider.portfolio.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {provider.portfolio.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No portfolio items yet.</p>
            )}
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="p-5 space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold">{provider.ratings?.toFixed(1) ?? '—'}</div>
                <div className="flex items-center gap-1 justify-center mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="size-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <div className="text-sm text-gray-600">{provider.reviewsCount} reviews</div>
              </div>
            </div>
            <p className="text-sm text-gray-500">Reviews coming soon.</p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

