import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { AdminLayout } from '../components/AdminLayout';
import {
  Card,
  Table,
  Button,
  StatusBadge,
  Pagination,
} from '../components/ui/AdminComponents';
import { Download, Search, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { usersService, UserItem } from '../../services/admin.service';

export default function Users() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleFilter = searchParams.get('role');
  const statusFilter = searchParams.get('status');

  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    const params: Record<string, string> = { page: String(page), per_page: '20' };
    if (searchQuery) params.q = searchQuery;
    if (roleFilter) params.role = roleFilter;
    if (statusFilter) params.status = statusFilter;
    try {
      const res = await usersService.getUsers(params);
      setUsers(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.total_pages);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, roleFilter, statusFilter]);

  useEffect(() => { fetchUsers(currentPage); }, [currentPage, fetchUsers]);

  const handlePageChange = (p: number) => { setCurrentPage(p); fetchUsers(p); };

  const handleSuspend = async (e: React.MouseEvent, id: string, isSuspended: boolean) => {
    e.stopPropagation();
    setActionLoading(id);
    try {
      if (isSuspended) {
        await usersService.unsuspendUser(id);
      } else {
        await usersService.suspendUser(id);
      }
      fetchUsers(currentPage);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const pageTitle = roleFilter === 'provider' ? 'Providers' : 'Users';
  const pageDescription = roleFilter === 'provider'
    ? 'Manage all service providers'
    : `Manage all platform users${total ? ` (${total} total)` : ''}`;

  const columns = [
    {
      key: 'email',
      label: 'User',
      sortable: true,
      render: (_: string, row: UserItem) => (
        <div>
          <div className="font-medium text-[#2E3440]">{row.first_name} {row.last_name}</div>
          <div className="text-xs text-[#4C566A]">{row.email}</div>
        </div>
      ),
    },
    {
      key: 'roles',
      label: 'Role(s)',
      sortable: false,
      render: (value: string[]) => (
        <div className="flex gap-1 flex-wrap">
          {value.map((role, idx) => (
            <span key={idx} className="px-2 py-0.5 bg-[#E5E9F0] text-[#2E3440] rounded text-xs capitalize">
              {role}
            </span>
          ))}
        </div>
      ),
    },
    { key: 'phone', label: 'Phone', sortable: false, render: (v: string) => v || '—' },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => <StatusBadge status={value as any} />,
    },
    {
      key: 'email_verified',
      label: 'Verified',
      sortable: false,
      render: (_: boolean, row: UserItem) => (
        <div className="flex gap-1">
          <span title="Email">{row.email_verified ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-gray-300" />}</span>
          <span title="Phone">{row.phone_verified ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-gray-300" />}</span>
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'Joined',
      sortable: true,
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_: string, row: UserItem) => (
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={() => navigate(`/users/${row.id}`)}>
            View
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => handleSuspend(e, row.id, row.status === 'suspended')}
            disabled={actionLoading === row.id}
          >
            {actionLoading === row.id ? '...' : row.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">{pageTitle}</h1>
          <p className="text-[#4C566A]">{pageDescription}</p>
        </div>

        <Card>
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="w-5 h-5 text-[#4C566A] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, email, phone..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                onKeyDown={(e) => e.key === 'Enter' && fetchUsers(1)}
                className="w-full pl-10 pr-4 py-2 border border-[#E5E9F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B7CFA]/30"
              />
            </div>
            <Button variant="secondary" onClick={() => fetchUsers(currentPage)}>
              <Download className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {error && <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-7 h-7 animate-spin text-[#5B7CFA]" />
            </div>
          ) : (
            <>
              <Table columns={columns} data={users} onRowClick={(row) => navigate(`/users/${row.id}`)} />
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            </>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
