import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Clock, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import { projectsService, Project } from '@/services';

export default function ProjectDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    projectsService
      .getProject(id)
      .then(setProject)
      .catch(() => setError('Failed to load project.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="font-semibold">Project Details</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="font-semibold">Project Details</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">{error ?? 'Project not found'}</p>
        </div>
      </div>
    );
  }

  const budgetLabel =
    project.budget?.min && project.budget?.max
      ? `$${project.budget.min.toLocaleString()} – $${project.budget.max.toLocaleString()}`
      : 'Negotiable';

  const statusLabel =
    project.status === 'in-progress' ? 'In Progress' : project.status.charAt(0).toUpperCase() + project.status.slice(1);

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
        <Badge>{statusLabel}</Badge>
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
                  <p className="font-medium text-gray-900">{budgetLabel}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="size-4" />
                <div>
                  <p className="text-xs text-gray-500">Posted</p>
                  <p className="font-medium text-gray-900">{new Date(project.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skills Required */}
        {project.skills && project.skills.length > 0 && (
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
        )}
      </div>

      {/* Action Buttons */}
      <div className="border-t bg-white p-4 space-y-2">
        <Button className="w-full" size="lg" onClick={() => navigate('/messages')}>
          Message Client
        </Button>
        <Button variant="outline" className="w-full" size="lg" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>
    </div>
  );
}
