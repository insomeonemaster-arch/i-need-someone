import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, MapPin, Briefcase, DollarSign, Clock, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import { jobsService, Job } from '@/services';

export default function JobDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    jobsService
      .getJob(id)
      .then(setJob)
      .catch(() => setError('Failed to load job.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="font-semibold">Job Details</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="font-semibold">Job Details</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">{error ?? 'Job not found'}</p>
        </div>
      </div>
    );
  }

  const salaryLabel =
    job.budget?.min && job.budget?.max
      ? `$${(job.budget.min / 1000).toFixed(0)}k – $${(job.budget.max / 1000).toFixed(0)}k`
      : 'Negotiable';

  const locationLabel = [job.city, job.state].filter(Boolean).join(', ') || job.workLocation || '—';

  const typeLabel = job.employmentType
    ? job.employmentType.replace(/_/g, '-').replace(/\b\w/g, (l) => l.toUpperCase())
    : '—';

  const postedDate = new Date(job.createdAt).toLocaleDateString();

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
              {job.companyName && (
                <p className="text-gray-600 flex items-center gap-1 mb-3">
                  <Building2 className="size-4" />
                  {job.companyName}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{typeLabel}</Badge>
                {job.workLocation && <Badge variant="secondary">{job.workLocation.replace(/_/g, ' ')}</Badge>}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="size-4" />
                <span>{locationLabel}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <DollarSign className="size-4" />
                <span>{salaryLabel}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="size-4" />
                <span>Posted on {postedDate}</span>
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

        {/* Skills */}
        {job.skills && job.skills.length > 0 && (
          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="font-semibold">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Buttons */}
      <div className="border-t bg-white p-4 space-y-2">
        <Button
          className="w-full"
          size="lg"
          onClick={() => navigate('/my-jobs')}
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
