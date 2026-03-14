import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Clock, CheckCircle, Send, MapPin, Briefcase, Wrench, Rocket, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { jobsService, localServicesService, projectsService, JobApplication, Job, ServiceRequest, Project } from '@/services';
import { useAppMode } from '@/app/context/AppModeContext';

interface DisplayJob {
  id: string;
  type: 'Job Application' | 'Active Gig' | 'Project Proposal';
  title: string;
  company: string;
  location: string;
  status: string;
  appliedDate: string;
  salary: string;
  icon: typeof Briefcase;
  color: string;
  detailPath: string;
}

function getStatusConfig(status: string) {
  switch (status) {
    case 'in-progress':
      return { label: 'In Progress', icon: Clock, variant: 'default' as const };
    case 'completed':
      return { label: 'Completed', icon: CheckCircle, variant: 'default' as const };
    case 'accepted':
      return { label: 'Accepted', icon: CheckCircle, variant: 'default' as const };
    case 'applied':
      return { label: 'Applied', icon: Send, variant: 'secondary' as const };
    case 'pending':
      return { label: 'Pending Review', icon: Clock, variant: 'secondary' as const };
    case 'withdrawn':
      return { label: 'Withdrawn', icon: Clock, variant: 'secondary' as const };
    default:
      return { label: status, icon: Clock, variant: 'secondary' as const };
  }
}

export default function MyJobs() {
  const navigate = useNavigate();
  const { mode } = useAppMode();
  const [jobs, setJobs] = useState<DisplayJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const items: DisplayJob[] = [];

      if (mode === 'provider') {
        const [applications, proposals] = await Promise.allSettled([
          jobsService.getMyApplications(),
          projectsService.getMyProposals().catch(() => []),
        ]);

        if (applications.status === 'fulfilled') {
          applications.value.forEach((app: JobApplication) => {
            items.push({
              id: app.id,
              type: 'Job Application',
              title: 'Job Application',
              company: 'Employer',
              location: 'See details',
              status: app.status,
              appliedDate: new Date(app.createdAt).toLocaleDateString(),
              salary: app.proposedBudget ? `$${app.proposedBudget}` : 'TBD',
              icon: Briefcase,
              color: 'bg-green-50 text-green-600',
              detailPath: `/jobs/detail/${app.jobId}`,
            });
          });
        }

        if (proposals.status === 'fulfilled') {
          proposals.value.forEach((proposal: any) => {
            items.push({
              id: proposal.id,
              type: 'Project Proposal',
              title: 'Project Proposal',
              company: 'Client',
              location: 'Remote',
              status: proposal.status,
              appliedDate: new Date(proposal.createdAt).toLocaleDateString(),
              salary: proposal.proposedBudget ? `$${proposal.proposedBudget}` : 'TBD',
              icon: Rocket,
              color: 'bg-purple-50 text-purple-600',
              detailPath: `/projects/detail/${proposal.projectId}`,
            });
          });
        }
      } else {
        const [postings, requests, projects] = await Promise.allSettled([
          jobsService.getMyPostings(),
          localServicesService.getRequests(),
          projectsService.getMyProjects(),
        ]);

        if (postings.status === 'fulfilled') {
          postings.value.forEach((job: Job) => {
            items.push({
              id: job.id,
              type: 'Job Application',
              title: job.title,
              company: 'Job Posting',
              location: 'See details',
              status: job.status,
              appliedDate: new Date(job.createdAt).toLocaleDateString(),
              salary: job.budget ? `$${job.budget.min} - $${job.budget.max}/mo` : 'TBD',
              icon: Briefcase,
              color: 'bg-green-50 text-green-600',
              detailPath: `/jobs/detail/${job.id}`,
            });
          });
        }

        if (requests.status === 'fulfilled') {
          requests.value.forEach((req: ServiceRequest) => {
            items.push({
              id: req.id,
              type: 'Active Gig',
              title: req.title,
              company: 'Service Request',
              location: req.location?.city || 'See details',
              status: req.status,
              appliedDate: new Date(req.createdAt).toLocaleDateString(),
              salary: req.budget ? `$${req.budget.min} - $${req.budget.max}` : 'TBD',
              icon: Wrench,
              color: 'bg-blue-50 text-blue-600',
              detailPath: `/local-services/detail/${req.id}`,
            });
          });
        }

        if (projects.status === 'fulfilled') {
          projects.value.forEach((proj: Project) => {
            items.push({
              id: proj.id,
              type: 'Project Proposal',
              title: proj.title,
              company: 'Project',
              location: 'Remote',
              status: proj.status,
              appliedDate: new Date(proj.createdAt).toLocaleDateString(),
              salary: proj.budget ? `$${proj.budget.min} - $${proj.budget.max}` : 'TBD',
              icon: Rocket,
              color: 'bg-purple-50 text-purple-600',
              detailPath: `/projects/detail/${proj.id}`,
            });
          });
        }
      }

      items.sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime());
      setJobs(items);
    } catch (err) {
      console.error('Failed to load jobs:', err);
      setError('Failed to load jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="p-6">
          <h1 className="text-2xl mb-1">My Jobs</h1>
          <p className="text-gray-600">Your active opportunities</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="size-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="p-6">
          <h1 className="text-2xl mb-1">My Jobs</h1>
          <p className="text-gray-600">Your active opportunities</p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <AlertCircle className="size-12 text-red-400 mb-4" />
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-[var(--brand-orange)] text-white rounded-lg hover:bg-orange-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="p-6">
        <h1 className="text-2xl mb-1">My Jobs</h1>
        <p className="text-gray-600">Your active opportunities</p>
      </div>

      {jobs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <Briefcase className="size-12 text-gray-300 mb-4" />
          <p className="text-gray-500 text-center">No jobs yet</p>
          <p className="text-gray-400 text-sm text-center mt-1">
            {mode === 'provider' ? 'Browse jobs and apply' : 'Post a job to get started'}
          </p>
        </div>
      ) : (
        <div className="flex-1 px-6 pb-24 space-y-3 overflow-y-auto">
          {jobs.map((job) => {
            const statusConfig = getStatusConfig(job.status);
            const StatusIcon = statusConfig.icon;

            return (
              <Card
                key={job.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(job.detailPath)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-lg ${job.color} flex-shrink-0`}>
                      <job.icon className="size-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <h3 className="font-medium leading-tight mb-0.5">{job.title}</h3>
                          <p className="text-sm text-gray-600">{job.company}</p>
                        </div>
                        <span className="font-semibold text-sm whitespace-nowrap">{job.salary}</span>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                        <MapPin className="size-3" />
                        {job.location}
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge variant={statusConfig.variant} className="gap-1.5">
                          <StatusIcon className="size-3" />
                          {statusConfig.label}
                        </Badge>
                        <span className="text-xs text-gray-500">{job.appliedDate}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
