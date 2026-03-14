import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import {
  Card,
  Table,
  Button,
  StatusBadge,
  Pagination,
} from '../components/ui/AdminComponents';
import { Loader2, Search } from 'lucide-react';
import { useNavigate } from 'react-router';
import { jobsService, ServiceRequestItem } from '../../services/admin.service';

export default function JobsRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ServiceRequestItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchRequests = useCallback(async (page = 1, q = search, status = statusFilter) => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = { page: String(page), per_page: '20' };
      if (q) params.q = q;
      if (status) params.status = status;
      const res = await jobsService.getRequests(params);
      setRequests(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.total_pages);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { fetchRequests(1); }, [fetchRequests]);

  const columns = [
    { key: 'id', label: 'Request ID', sortable: true },
    {
      key: 'customer',
      label: 'Customer',
      render: (v: ServiceRequestItem['customer']) => v?.name || '—',
    },
    {
      key: 'provider',
      label: 'Provider',
      render: (v: ServiceRequestItem['provider']) => v?.name || 'Unassigned',
    },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'title', label: 'Title' },
    {
      key: 'budget',
      label: 'Budget',
      render: (v: number) => v ? `$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—',
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (v: string) => <StatusBadge status={v as any} />,
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      key: 'id',
      label: 'View',
      render: (_: string, row: ServiceRequestItem) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => { (e as React.MouseEvent).stopPropagation(); navigate(`/jobs-requests/${row.id}`); }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Jobs & Requests</h1>
          <p className="text-[#4C566A]">Service requests{total ? ` (${total} total)` : ''}</p>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
        )}

        <div className="flex gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4C566A]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setCurrentPage(1); fetchRequests(1, search, statusFilter); } }}
              placeholder="Search by title..."
              className="pl-9 pr-3 py-2 border border-[#E5E9F0] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#5B7CFA]/30"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); fetchRequests(1, search, e.target.value); }}
            className="px-3 py-2 border border-[#E5E9F0] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#5B7CFA]/30"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <Card>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-7 h-7 animate-spin text-[#5B7CFA]" />
            </div>
          ) : (
            <>
              <Table columns={columns} data={requests} />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(p) => { setCurrentPage(p); fetchRequests(p); }}
              />
            </>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
