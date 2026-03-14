import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Star, MapPin, CheckCircle, MessageSquare, Flag } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { Separator } from '@/app/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/app/components/ui/tabs';

const mockProviderData: Record<string, any> = {
  '1': {
    id: '1',
    name: 'Mike Johnson',
    title: 'Licensed Plumber',
    rating: 4.9,
    reviews: 127,
    hourlyRate: 75,
    location: 'San Francisco, CA',
    serviceArea: '15 miles radius',
    experience: '15 years',
    initials: 'MJ',
    color: 'bg-blue-500',
    verified: true,
    skills: ['Plumbing', 'Pipe Repair', 'Water Heaters', 'Drain Cleaning', 'Leak Detection'],
    about: 'Licensed and insured plumber with 15 years of experience. Specializing in residential and commercial plumbing repairs, installations, and emergency services. Available 24/7 for urgent repairs.',
    portfolio: [
      { id: 1, title: 'Bathroom Renovation', image: '🏠', description: 'Complete bathroom plumbing installation' },
      { id: 2, title: 'Kitchen Sink Repair', image: '🔧', description: 'Fixed major leak and replaced fixtures' },
      { id: 3, title: 'Water Heater Installation', image: '💧', description: 'Installed new tankless water heater' },
    ],
    reviewsList: [
      { id: 1, client: 'Jane Smith', rating: 5, comment: 'Excellent work! Fixed my bathroom leak quickly and professionally.', date: '2 weeks ago' },
      { id: 2, client: 'Robert Davis', rating: 5, comment: 'Very knowledgeable and fair pricing. Highly recommend!', date: '1 month ago' },
      { id: 3, client: 'Lisa Wong', rating: 4, comment: 'Good service, arrived on time and completed the job well.', date: '2 months ago' },
    ],
  },
};

export default function ProviderProfileLocal() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const provider = id ? mockProviderData[id] : null;

  if (!provider) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="font-semibold">Provider Profile</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">Provider not found</p>
        </div>
      </div>
    );
  }

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
          onClick={() => navigate(`/report?type=user&userId=${provider.id}&name=${provider.name}`)}
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
                <AvatarFallback className={`${provider.color} text-white text-2xl`}>
                  {provider.initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-semibold">{provider.name}</h2>
                  {provider.verified && (
                    <CheckCircle className="size-5 text-blue-600" />
                  )}
                </div>
                <p className="text-gray-600 mb-2">{provider.title}</p>
                
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="size-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{provider.rating}</span>
                    <span className="text-gray-500">({provider.reviews})</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">{provider.experience}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="size-4" />
                <span>{provider.location} • {provider.serviceArea}</span>
              </div>
              <div className="text-lg font-semibold text-[var(--brand-orange)]">
                ${provider.hourlyRate}/hour
              </div>
            </div>

            {provider.verified && (
              <Badge className="bg-blue-100 text-blue-700 mb-4">
                <CheckCircle className="size-3 mr-1" />
                Identity Verified • Background Checked
              </Badge>
            )}

            <div className="flex gap-2">
              <Button className="flex-1 min-h-[44px]" onClick={() => {
                // Open INS with prefilled context
                navigate('/?requestHelp=' + provider.id);
              }}>
                Request Service
              </Button>
              <Button variant="outline" size="icon" className="min-w-[44px] min-h-[44px]" onClick={() => navigate('/chat/' + provider.id)}>
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
              <p className="text-gray-700 leading-relaxed">{provider.about}</p>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-3">Skills & Services</h3>
              <div className="flex flex-wrap gap-2">
                {provider.skills.map((skill: string) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="p-5">
            <div className="grid grid-cols-1 gap-4">
              {provider.portfolio.map((item: any) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="size-16 rounded-lg bg-gray-100 flex items-center justify-center text-3xl flex-shrink-0">
                        {item.image}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium mb-1">{item.title}</h4>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="p-5 space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold">{provider.rating}</div>
                <div className="flex items-center gap-1 justify-center mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="size-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <div className="text-sm text-gray-600">{provider.reviews} reviews</div>
              </div>
            </div>

            <Separator />

            {provider.reviewsList.map((review: any) => (
              <Card key={review.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{review.client}</p>
                      <p className="text-xs text-gray-500">{review.date}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="size-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{review.comment}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
