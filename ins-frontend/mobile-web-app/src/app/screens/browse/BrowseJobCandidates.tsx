import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Search, MapPin, Filter, Briefcase } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';

const mockCandidates = [
  {
    id: 1,
    name: 'Alex Thompson',
    title: 'Senior Software Engineer',
    experience: '8 years',
    location: 'San Francisco, CA',
    availability: 'Available immediately',
    skills: ['JavaScript', 'React', 'Python', 'AWS'],
    education: 'BS Computer Science',
    initials: 'AT',
    color: 'bg-blue-500',
  },
  {
    id: 2,
    name: 'Maria Garcia',
    title: 'Marketing Manager',
    experience: '6 years',
    location: 'Los Angeles, CA',
    availability: '2 weeks notice',
    skills: ['Digital Marketing', 'SEO', 'Content Strategy', 'Analytics'],
    education: 'MBA Marketing',
    initials: 'MG',
    color: 'bg-purple-500',
  },
  {
    id: 3,
    name: 'James Wilson',
    title: 'Executive Assistant',
    experience: '4 years',
    location: 'San Diego, CA',
    availability: 'Available immediately',
    skills: ['Calendar Management', 'Travel Coordination', 'Office Administration'],
    education: 'BA Business Admin',
    initials: 'JW',
    color: 'bg-green-500',
  },
  {
    id: 4,
    name: 'Priya Sharma',
    title: 'Data Analyst',
    experience: '5 years',
    location: 'San Jose, CA',
    availability: '1 month notice',
    skills: ['SQL', 'Python', 'Tableau', 'Statistics'],
    education: 'MS Data Science',
    initials: 'PS',
    color: 'bg-primary',
  },
  {
    id: 5,
    name: 'Michael Brown',
    title: 'Customer Support Specialist',
    experience: '3 years',
    location: 'Oakland, CA',
    availability: 'Available immediately',
    skills: ['Customer Service', 'Zendesk', 'Communication', 'Problem Solving'],
    education: 'BA Communications',
    initials: 'MB',
    color: 'bg-pink-500',
  },
];

export default function BrowseJobCandidates() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCandidates = searchQuery
    ? mockCandidates.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : mockCandidates;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-4 py-3 flex items-center gap-3">
          <button 
            onClick={() => navigate('/')} 
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="font-semibold">Browse Candidates</h1>
        </div>

        {/* Search & Filter */}
        <div className="px-4 pb-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name, title, or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 min-h-[44px]"
            />
          </div>

          {/* Category Chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
            {['All', 'Tech', 'Marketing', 'Sales', 'Admin', 'Customer Service', 'Design'].map((cat) => (
              <Button key={cat} variant="outline" size="sm" className="rounded-full whitespace-nowrap">
                {cat}
              </Button>
            ))}
          </div>

          <Button variant="outline" className="w-full min-h-[44px]">
            <Filter className="size-4 mr-2" />
            Filters (Location, Experience, Availability)
          </Button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 space-y-3">
        <p className="text-sm text-gray-600 px-1">
          {filteredCandidates.length} candidates found
        </p>

        {filteredCandidates.map((candidate) => (
          <Card
            key={candidate.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(`/provider/job/${candidate.id}`)}
          >
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Avatar className="size-14 flex-shrink-0">
                  <AvatarFallback className={`${candidate.color} text-white text-lg`}>
                    {candidate.initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="mb-1">
                    <h3 className="font-semibold">{candidate.name}</h3>
                    <p className="text-sm text-gray-600">{candidate.title}</p>
                  </div>

                  <div className="flex items-center gap-2 mb-2 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <Briefcase className="size-3" />
                      <span>{candidate.experience}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="size-3" />
                      <span>{candidate.location}</span>
                    </div>
                  </div>

                  <Badge variant="secondary" className="mb-2 text-xs bg-green-100 text-green-700">
                    {candidate.availability}
                  </Badge>

                  <p className="text-xs text-gray-600 mb-2">{candidate.education}</p>

                  <div className="flex flex-wrap gap-1">
                    {candidate.skills.slice(0, 4).map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {candidate.skills.length > 4 && (
                      <Badge variant="secondary" className="text-xs">
                        +{candidate.skills.length - 4}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredCandidates.length === 0 && (
          <div className="text-center py-12">
            <Search className="size-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No candidates found</h3>
            <p className="text-sm text-gray-600">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}