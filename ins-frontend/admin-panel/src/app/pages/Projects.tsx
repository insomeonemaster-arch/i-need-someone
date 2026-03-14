import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import {
  Card,
  Table,
  Button,
  StatusBadge,
  Pagination,
} from '../components/ui/AdminComponents';
import { FolderOpen, Loader2, Eye, X } from 'lucide-react';
import { projectsService, ProjectAdminItem } from '../../services/admin.service';

export default function Projects() {
  const [projects, setProjects] = useState<ProjectAdminItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProject, setSelectedProject] = useState<ProjectAdminItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchProjects = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await projectsService.getProjects({ page: String(page), per_page: '20' });
      setProjects(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.total_pages);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(1); }, [fetchProjects]);

  const handleViewProject = async (id: string) => {
    setDetailLoading(true);
    setSelectedProject(null);
    try {
      const res = await projectsService.getProject(id);
      setSelectedProject(res.data);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to load project details');
    } finally {
      setDetailLoading(false);
    }
  };

  const columns = [
    { key: 'id', label: 'Project ID', sortable: true },
    { key: 'title', label: 'Title', sortable: true },
    {
      key: 'client',
      label: 'Client',
      render: (v: ProjectAdminItem['client']) => v?.name || '—',
    },
    { key: 'category', label: 'Category', sortable: true },
    {
      key: 'budget_min',
      label: 'Budget',
      render: (_v: number, row: ProjectAdminItem) =>
        row.budget_min != null && row.budget_max != null
          ? `$${row.budget_min.toLocaleString()} – $${row.budget_max.toLocaleString()}`
          : row.budget_min != null
          ? `From $${row.budget_min.toLocaleString()}`
          : '—',
    },
    {
      key: 'proposals_count',
      label: 'Proposals',
      render: (v: number) => v ?? 0,
    },
    { key: 'estimated_duration', label: 'Duration' },
    {
      key: 'status',
      label: 'Status',
      render: (v: string) => <StatusBadge status={v as any} />,
    },
    {
      key: 'created_at',
      label: 'Posted',
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_: string, row: ProjectAdminItem) => (
        <Button variant="ghost" size="sm" onClick={() => handleViewProject(row.id)} title="View details">
          <Eye className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6 flex items-center gap-3">
          <FolderOpen className="w-6 h-6 text-[#5B7CFA]" />
          <div>
            <h1 className="text-2xl font-semibold">Projects</h1>
            <p className="text-[#4C566A] text-sm">Manage projects posted on the platform</p>
          </div>
        </div>

        <Card>
          <div className="p-4 border-b border-[#E5E9F0] flex items-center justify-between">
            <span className="text-sm text-[#4C566A]">
              {loading ? 'Loading…' : `${total} project${total !== 1 ? 's' : ''}`}
            </span>
            <Button variant="secondary" size="sm" onClick={() => fetchProjects(currentPage)}>
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-[#5B7CFA]" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-16 gap-4">
              <p className="text-red-500">{error}</p>
              <Button onClick={() => fetchProjects(1)}>Retry</Button>
            </div>
          ) : (
            <Table columns={columns} data={projects} />
          )}

          {!loading && !error && totalPages > 1 && (
            <div className="p-4 border-t border-[#E5E9F0]">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(p) => { setCurrentPage(p); fetchProjects(p); }}
              />
            </div>
          )}
        </Card>
      </div>

      {/* Project Detail Drawer */}
      {(detailLoading || selectedProject) && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setSelectedProject(null); setDetailLoading(false); }} />
          <div className="relative bg-white w-full max-w-md h-full flex flex-col shadow-xl overflow-y-auto">
            <div className="px-5 py-4 border-b border-[#E5E9F0] flex items-center justify-between">
              <h2 className="font-semibold text-lg">Project Details</h2>
              <button onClick={() => { setSelectedProject(null); setDetailLoading(false); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {detailLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#5B7CFA]" /></div>
            ) : selectedProject ? (
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Title</p>
                  <p className="font-medium">{selectedProject.title}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Client</p>
                  <p>{selectedProject.client?.name || '—'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Category</p>
                    <p>{selectedProject.category || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                    <StatusBadge status={selectedProject.status} />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Budget</p>
                  <p>{selectedProject.budget_min != null && selectedProject.budget_max != null
                    ? `$${selectedProject.budget_min.toLocaleString()} – $${selectedProject.budget_max.toLocaleString()}`
                    : selectedProject.budget_min != null
                    ? `From $${selectedProject.budget_min.toLocaleString()}`
                    : '—'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Proposals</p>
                    <p>{selectedProject.proposals_count}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Duration</p>
                    <p>{selectedProject.estimated_duration || '—'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Posted</p>
                  <p>{new Date(selectedProject.created_at).toLocaleString()}</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
