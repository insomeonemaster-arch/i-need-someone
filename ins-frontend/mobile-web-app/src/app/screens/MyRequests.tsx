import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Clock, CheckCircle, AlertCircle, Wrench, Briefcase, Rocket, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { localServicesService, jobsService, projectsService, ServiceRequest, Job, Project } from '@/services';

interface RequestItem {
  id: string;
  type: 'Local Service' | 'Job' | 'Project';
  title: string;
  provider: string;
  status: string;
  date: string;
  price: string;
  icon: typeof Wrench;
  color: string;
}

export default function MyRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [serviceRequests, jobs, projects] = await Promise.allSettled([
        localServicesService.getRequests(),
        jobsService.getMyPostings(),
        projectsService.getMyProjects(),
      ]);

      const items: RequestItem[] = [];

      if (serviceRequests.status === 'fulfilled') {
        serviceRequests.value.forEach((req: ServiceRequest) => {
          items.push({
            id: req.id,
            type: 'Local Service',
            title: req.title,
            provider: 'Pending',
            status: req.status,
            date: new Date(req.createdAt).toLocaleDateString(),
            price: req.budget ? `$${req.budget.min} - $${req.budget.max}` : 'TBD',
            icon: Wrench,
            color: 'bg-blue-50 text-blue-600',
          });
        });
      }

      if (jobs.status === 'fulfilled') {
        jobs.value.forEach((job: Job) => {
          items.push({
            id: job.id,
            type: 'Job',
            title: job.title,
            provider: 'Open',
            status: job.status,
            date: new Date(job.createdAt).toLocaleDateString(),
            price: job.budget ? `$${job.budget.min} - $${job.budget.max}/mo` : 'TBD',
            icon: Briefcase,
            color: 'bg-green-50 text-green-600',
          });
        });
      }

      if (projects.status === 'fulfilled') {
        projects.value.forEach((proj: Project) => {
          items.push({
            id: proj.id,
            type: 'Project',
            title: proj.title,
            provider: 'Open',
            status: proj.status,
            date: new Date(proj.createdAt).toLocaleDateString(),
            price: proj.budget ? `$${proj.budget.min} - $${proj.budget.max}` : 'TBD',
            icon: Rocket,
            color: 'bg-purple-50 text-purple-600',
          });
        });
      }

      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRequests(items);
    } catch (err) {
      console.error('Failed to load requests:', err);
      setError('Failed to load requests. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'in-progress':
        return { label: 'In Progress', icon: Clock, variant: 'default' as const, color: 'text-blue-600' };
      case 'completed':
        return { label: 'Completed', icon: CheckCircle, variant: 'secondary' as const, color: 'text-green-600' };
      case 'open':
        return { label: 'Open', icon: AlertCircle, variant: 'outline' as const, color: 'text-[#4C9F9F]' };
      case 'closed':
        return { label: 'Closed', icon: Clock, variant: 'secondary' as const, color: 'text-gray-600' };
      case 'cancelled':
        return { label: 'Cancelled', icon: AlertCircle, variant: 'secondary' as const, color: 'text-red-600' };
      default:
        return { label: status, icon: AlertCircle, variant: 'outline' as const, color: 'text-gray-600' };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b px-4 md:px-6 py-3 md:py-4">
          <h1 className="font-semibold text-lg md:text-xl">My Requests</h1>
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
        <div className="bg-white border-b px-4 md:px-6 py-3 md:py-4">
          <h1 className="font-semibold text-lg md:text-xl">My Requests</h1>
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
      <div className="bg-white border-b px-4 md:px-6 py-3 md:py-4">
        <h1 className="font-semibold text-lg md:text-xl">My Requests</h1>
        <p className="text-xs md:text-sm text-gray-600">{requests.length} total requests</p>
      </div>

      {requests.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <Wrench className="size-12 text-gray-300 mb-4" />
          <p className="text-gray-500 text-center">No requests yet</p>
          <p className="text-gray-400 text-sm text-center mt-1">Create a request from the home screen</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 pb-24 space-y-3 md:space-y-4">
          {requests.map((request) => {
            const statusConfig = getStatusConfig(request.status);
            const StatusIcon = statusConfig.icon;
            const typePath = request.type === 'Local Service' ? 'local-services' : request.type === 'Job' ? 'jobs' : 'projects';

            return (
              <Card
                key={`${request.type}-${request.id}`}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/${typePath}/detail/${request.id}`)}
              >
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className={`p-2.5 md:p-3 rounded-xl ${request.color} flex-shrink-0`}>
                      <request.icon className="size-5 md:size-6" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm md:text-base mb-1 truncate">{request.title}</h3>
                          <p className="text-xs md:text-sm text-gray-600">{request.provider}</p>
                        </div>
                        <Badge variant={statusConfig.variant} className="flex items-center gap-1 flex-shrink-0 text-xs md:text-sm">
                          <StatusIcon className="size-3 md:size-3.5" />
                          {statusConfig.label}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between mt-3 text-xs md:text-sm text-gray-500">
                        <span>{request.date}</span>
                        <span className="font-semibold text-gray-900">{request.price}</span>
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
