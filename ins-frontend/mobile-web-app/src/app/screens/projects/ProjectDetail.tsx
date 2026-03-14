import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Clock, DollarSign, User, Star } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';

export default function ProjectDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Mock data
  const project = {
    id,
    title: 'Logo Design for Startup',
    category: 'Graphic Design',
    status: 'in-progress',
    budget: '$450',
    timeline: '2 weeks',
    postedDate: '2026-01-20',
    description: `I'm launching a new tech startup and need a modern, professional logo that represents innovation and trust. The logo should work well in both color and black & white, and be scalable for various uses (website, business cards, social media, etc.).`,
    skills: ['Adobe Illustrator', 'Branding', 'Creative Design', 'Logo Design'],
    deliverables: [
      '3 initial logo concepts',
      '2 rounds of revisions',
      'Final logo in multiple formats (AI, PNG, SVG, PDF)',
      'Brand color palette',
      'Logo usage guidelines',
    ],
    freelancer: {
      name: 'Sarah Chen',
      title: 'Professional Logo Designer',
      rating: 4.9,
      reviews: 127,
      completedProjects: 234,
      responseTime: '2 hours',
    },
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-semibold">Project Details</h1>
        </div>
        <Badge>{project.status === 'in-progress' ? 'In Progress' : 'Active'}</Badge>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 space-y-4">
        {/* Main Info */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <div>
              <Badge variant="secondary" className="mb-2">{project.category}</Badge>
              <h2 className="text-xl font-semibold mb-2">{project.title}</h2>
              <p className="text-gray-700 leading-relaxed">{project.description}</p>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <DollarSign className="size-4" />
                <div>
                  <p className="text-xs text-gray-500">Budget</p>
                  <p className="font-medium text-gray-900">{project.budget}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="size-4" />
                <div>
                  <p className="text-xs text-gray-500">Timeline</p>
                  <p className="font-medium text-gray-900">{project.timeline}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skills Required */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="font-semibold">Skills Required</h3>
            <div className="flex flex-wrap gap-2">
              {project.skills.map((skill, index) => (
                <Badge key={index} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Deliverables */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="font-semibold">Deliverables</h3>
            <ul className="space-y-2">
              {project.deliverables.map((item, index) => (
                <li key={index} className="flex gap-2 text-sm text-gray-700">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Freelancer Info */}
        {project.status === 'in-progress' && (
          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="font-semibold">Working With</h3>
              
              <div className="flex items-start gap-3">
                <div className="p-3 bg-purple-50 rounded-full">
                  <User className="size-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{project.freelancer.name}</h4>
                  <p className="text-sm text-gray-600">{project.freelancer.title}</p>
                  
                  <div className="flex items-center gap-3 mt-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="size-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{project.freelancer.rating}</span>
                      <span className="text-gray-500">({project.freelancer.reviews})</span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600">{project.freelancer.completedProjects} projects</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Avg. response time</span>
                <span className="font-medium">{project.freelancer.responseTime}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Project Timeline */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="font-semibold">Project Timeline</h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="size-2 rounded-full bg-purple-600" />
                  <div className="w-0.5 h-8 bg-purple-200" />
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium">Project Posted</p>
                  <p className="text-xs text-gray-500">{project.postedDate}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="size-2 rounded-full bg-purple-600" />
                  <div className="w-0.5 h-8 bg-purple-200" />
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium">Freelancer Hired</p>
                  <p className="text-xs text-gray-500">2026-01-21</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="size-2 rounded-full bg-purple-600" />
                  <div className="w-0.5 h-8 bg-gray-200" />
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium">First Draft Delivered</p>
                  <p className="text-xs text-gray-500">2026-01-25</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="size-2 rounded-full bg-gray-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-400">Project Complete</p>
                  <p className="text-xs text-gray-400">Expected: 2026-02-03</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="border-t bg-white p-4 space-y-2">
        <Button className="w-full" size="lg" onClick={() => navigate('/messages')}>
          Message Freelancer
        </Button>
        <Button variant="outline" className="w-full" size="lg">
          Request Revision
        </Button>
      </div>
    </div>
  );
}
