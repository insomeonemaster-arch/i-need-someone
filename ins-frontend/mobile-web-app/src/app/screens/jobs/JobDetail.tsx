import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, MapPin, Briefcase, DollarSign, Clock, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';

export default function JobDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Mock data
  const job = {
    id,
    title: 'Marketing Manager',
    company: 'TechStart Inc.',
    location: 'San Francisco, CA',
    type: 'Full-time',
    experience: 'Mid Level',
    salary: '$85k - $110k',
    postedDate: '2026-01-22',
    applicants: 32,
    description: `We're looking for an experienced Marketing Manager to lead our growing marketing team. You'll be responsible for developing and executing marketing strategies that drive brand awareness and customer acquisition.`,
    responsibilities: [
      'Develop and execute comprehensive marketing strategies',
      'Lead a team of 3-5 marketing professionals',
      'Manage marketing budget and ROI tracking',
      'Collaborate with sales and product teams',
      'Oversee digital marketing campaigns and social media',
    ],
    requirements: [
      '5+ years of marketing experience',
      'Proven track record in B2B marketing',
      'Strong analytical and strategic thinking skills',
      'Experience with marketing automation tools',
      'Excellent communication and leadership abilities',
    ],
    benefits: [
      'Health, dental, and vision insurance',
      '401(k) matching',
      'Flexible work hours',
      'Remote work options',
      'Professional development budget',
      'Unlimited PTO',
    ],
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-semibold">Job Details</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 space-y-4">
        {/* Main Info */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-1">{job.title}</h2>
              <p className="text-gray-600 flex items-center gap-1 mb-3">
                <Building2 className="size-4" />
                {job.company}
              </p>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{job.type}</Badge>
                <Badge variant="secondary">{job.experience}</Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="size-4" />
                <span>{job.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <DollarSign className="size-4" />
                <span>{job.salary}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="size-4" />
                <span>Posted on {job.postedDate}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Briefcase className="size-4" />
                <span>{job.applicants} applicants</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="font-semibold">About the Role</h3>
            <p className="text-gray-700 text-sm leading-relaxed">{job.description}</p>
          </CardContent>
        </Card>

        {/* Responsibilities */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="font-semibold">Key Responsibilities</h3>
            <ul className="space-y-2">
              {job.responsibilities.map((item, index) => (
                <li key={index} className="flex gap-2 text-sm text-gray-700">
                  <span className="text-green-600 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="font-semibold">Requirements</h3>
            <ul className="space-y-2">
              {job.requirements.map((item, index) => (
                <li key={index} className="flex gap-2 text-sm text-gray-700">
                  <span className="text-green-600 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="font-semibold">Benefits</h3>
            <div className="flex flex-wrap gap-2">
              {job.benefits.map((benefit, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {benefit}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="border-t bg-white p-4 space-y-2">
        <Button
          className="w-full"
          size="lg"
          onClick={() => {
            navigate('/my-jobs');
          }}
        >
          Apply Now
        </Button>
        <Button variant="outline" className="w-full" size="lg">
          Save Job
        </Button>
      </div>
    </div>
  );
}
