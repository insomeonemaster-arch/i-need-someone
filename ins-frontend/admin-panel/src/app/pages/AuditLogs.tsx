import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import {
  Card,
  Table,
  Pagination,
} from '../components/ui/AdminComponents';
import { Loader2, FileText, Search } from 'lucide-react';
import { auditService, AuditLogItem } from '../../services/admin.service';

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSearch, setActionSearch] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');

  const fetchLogs = useCallback(async (page = 1, action = actionSearch, entityType = entityTypeFilter) => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = { page: String(page), per_page: '50' };
      if (action) params.action = action;
      if (entityType) params.entity_type = entityType;
      const res = await auditService.getLogs(params);
      setLogs(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.total_pages);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [actionSearch, entityTypeFilter]);

  useEffect(() => { fetchLogs(1); }, [fetchLogs]);

  const columns = [
    {
      key: 'created_at',
      label: 'Timestamp',
      sortable: true,
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      key: 'user',
      label: 'User',
      render: (v: AuditLogItem['user']) => v ? `${v.firstName} ${v.lastName}` : '—',
    },
    { key: 'action', label: 'Action', sortable: true },
    { key: 'entity_type', label: 'Entity Type', sortable: true },
    { key: 'entity_id', label: 'Entity ID' },
    {
      key: 'ip_address',
      label: 'IP',
      render: (v: string) => v || '—',
    },
    {
      key: 'metadata',
      label: 'Details',
      render: (v: Record<string, unknown>) =>
        v ? (
          <span className="text-xs text-[#4C566A] max-w-xs truncate block" title={JSON.stringify(v)}>
            {JSON.stringify(v).slice(0, 60)}{JSON.stringify(v).length > 60 ? '…' : ''}
          </span>
        ) : '—',
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6 flex items-center gap-3">
          <FileText className="w-6 h-6 text-[#5B7CFA]" />
          <div>
            <h1 className="text-2xl font-semibold">Audit Logs</h1>
            <p className="text-[#4C566A] text-sm">
              {total ? `${total.toLocaleString()} records` : 'System activity log'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
        )}

        <div className="flex gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4C566A]" />
            <input
              type="text"
              value={actionSearch}
              onChange={(e) => setActionSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setCurrentPage(1); fetchLogs(1, actionSearch, entityTypeFilter); } }}
              placeholder="Search by action..."
              className="pl-9 pr-3 py-2 border border-[#E5E9F0] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#5B7CFA]/30"
            />
          </div>
          <select
            value={entityTypeFilter}
            onChange={(e) => { setEntityTypeFilter(e.target.value); setCurrentPage(1); fetchLogs(1, actionSearch, e.target.value); }}
            className="px-3 py-2 border border-[#E5E9F0] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#5B7CFA]/30"
          >
            <option value="">All Entity Types</option>
            <option value="User">User</option>
            <option value="ServiceRequest">ServiceRequest</option>
            <option value="JobPosting">JobPosting</option>
            <option value="Project">Project</option>
            <option value="Payment">Payment</option>
            <option value="Dispute">Dispute</option>
            <option value="AdminRole">AdminRole</option>
            <option value="SystemSetting">SystemSetting</option>
          </select>
        </div>

        <Card>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-7 h-7 animate-spin text-[#5B7CFA]" />
            </div>
          ) : (
            <>
              <Table columns={columns} data={logs} />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(p) => { setCurrentPage(p); fetchLogs(p); }}
              />
            </>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
