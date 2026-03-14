import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import {
  Card,
  Table,
  Button,
  StatusBadge,
  Pagination,
} from '../components/ui/AdminComponents';
import { Briefcase, Loader2, Eye, X } from 'lucide-react';
import { employmentService, JobItem } from '../../services/admin.service';

export default function Employment() {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchJobs = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await employmentService.getJobs({ page: String(page), per_page: '20' });
      setJobs(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.total_pages);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchJobs(1); }, [fetchJobs]);

  const handleViewJob = async (id: string) => {
    setDetailLoading(true);
    setSelectedJob(null);
    try {
      const res = await employmentService.getJob(id);
      setSelectedJob(res.data);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to load job details');
    } finally {
      setDetailLoading(false);
    }
  };

  const columns = [
    { key: 'id', label: 'Job ID', sortable: true },
    { key: 'title', label: 'Title', sortable: true },
    {
      key: 'employer',
      label: 'Employer',
      render: (v: JobItem['employer']) => v?.name || '—',
    },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'employment_type', label: 'Type', sortable: true },
    { key: 'work_location', label: 'Location', sortable: true },
    {
      key: 'salary_min',
      label: 'Salary',
      render: (_v: number, row: JobItem) =>
        row.salary_min != null && row.salary_max != null
          ? `$${row.salary_min.toLocaleString()} – $${row.salary_max.toLocaleString()}`
          : row.salary_min != null
          ? `From $${row.salary_min.toLocaleString()}`
          : '—',
    },
    {
      key: 'applications_count',
      label: 'Applications',
      render: (v: number) => v ?? 0,
    },
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
      render: (_: string, row: JobItem) => (
        <Button variant="ghost" size="sm" onClick={() => handleViewJob(row.id)} title="View details">
          <Eye className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6 flex items-center gap-3">
          <Briefcase className="w-6 h-6 text-[#5B7CFA]" />
          <div>
            <h1 className="text-2xl font-semibold">Employment</h1>
            <p className="text-[#4C566A] text-sm">Manage job postings on the platform</p>
          </div>
        </div>

        <Card>
          <div className="p-4 border-b border-[#E5E9F0] flex items-center justify-between">
            <span className="text-sm text-[#4C566A]">
              {loading ? 'Loading…' : `${total} job${total !== 1 ? 's' : ''}`}
            </span>
            <Button variant="secondary" size="sm" onClick={() => fetchJobs(currentPage)}>
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
              <Button onClick={() => fetchJobs(1)}>Retry</Button>
            </div>
          ) : (
            <Table columns={columns} data={jobs} />
          )}

          {!loading && !error && totalPages > 1 && (
            <div className="p-4 border-t border-[#E5E9F0]">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(p) => { setCurrentPage(p); fetchJobs(p); }}
              />
            </div>
          )}
        </Card>
      </div>

      {/* Job Detail Drawer */}
      {(detailLoading || selectedJob) && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setSelectedJob(null); setDetailLoading(false); }} />
          <div className="relative bg-white w-full max-w-md h-full flex flex-col shadow-xl overflow-y-auto">
            <div className="px-5 py-4 border-b border-[#E5E9F0] flex items-center justify-between">
              <h2 className="font-semibold text-lg">Job Details</h2>
              <button onClick={() => { setSelectedJob(null); setDetailLoading(false); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {detailLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#5B7CFA]" /></div>
            ) : selectedJob ? (
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Title</p>
                  <p className="font-medium">{selectedJob.title}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Employer</p>
                  <p>{selectedJob.employer?.name || '—'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Category</p>
                    <p>{selectedJob.category || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Type</p>
                    <p>{selectedJob.employment_type}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Location</p>
                    <p>{selectedJob.work_location}{selectedJob.city ? ` — ${selectedJob.city}` : ''}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                    <StatusBadge status={selectedJob.status} />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Salary</p>
                  <p>{selectedJob.salary_min != null && selectedJob.salary_max != null
                    ? `$${selectedJob.salary_min.toLocaleString()} – $${selectedJob.salary_max.toLocaleString()}`
                    : selectedJob.salary_min != null
                    ? `From $${selectedJob.salary_min.toLocaleString()}`
                    : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Applications</p>
                  <p>{selectedJob.applications_count}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Posted</p>
                  <p>{new Date(selectedJob.created_at).toLocaleString()}</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
