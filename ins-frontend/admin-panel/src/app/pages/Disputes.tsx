import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import {
  Card,
  Table,
  Button,
  StatusBadge,
  Pagination,
  ConfirmationModal,
} from '../components/ui/AdminComponents';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { disputesService, DisputeItem } from '../../services/admin.service';

export default function Disputes() {
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchDisputes = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await disputesService.getDisputes({ page: String(page), per_page: '20' });
      setDisputes(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.total_pages);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load disputes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDisputes(1); }, [fetchDisputes]);

  const handleResolve = async (reason: string) => {
    if (!selectedId) return;
    try {
      await disputesService.resolveDispute(selectedId, { resolution: 'resolved_by_admin', notes: reason || undefined });
      fetchDisputes(currentPage);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to resolve dispute');
    } finally {
      setSelectedId(null);
    }
  };

  const columns = [
    { key: 'dispute_id', label: 'Case ID', sortable: true },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (value: string) => (
        <span className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          {value}
        </span>
      ),
    },
    {
      key: 'claimant',
      label: 'Claimant',
      sortable: false,
      render: (v: DisputeItem['claimant']) => v?.name || '—',
    },
    {
      key: 'respondent',
      label: 'Respondent',
      sortable: false,
      render: (v: DisputeItem['respondent']) => v?.name || '—',
    },
    {
      key: 'amount_in_dispute',
      label: 'Amount',
      sortable: true,
      render: (v: number) => v ? `$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—',
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => <StatusBadge status={value as any} />,
    },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      render: (v: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          v === 'urgent' || v === 'high'
            ? 'bg-red-50 text-red-700'
            : v === 'medium'
            ? 'bg-yellow-50 text-yellow-700'
            : 'bg-blue-50 text-blue-700'
        }`}>
          {v}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      key: 'id',
      label: 'Action',
      render: (_: string, row: DisputeItem) =>
        row.status !== 'resolved' && row.status !== 'closed' ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => { setSelectedId(row.id); setShowResolveModal(true); }}
          >
            Resolve
          </Button>
        ) : null,
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Disputes</h1>
          <p className="text-[#4C566A]">Manage dispute cases{total ? ` (${total} total)` : ''}</p>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
        )}

        <Card>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-7 h-7 animate-spin text-[#5B7CFA]" />
            </div>
          ) : (
            <>
              <Table columns={columns} data={disputes} />
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => { setCurrentPage(p); fetchDisputes(p); }} />
            </>
          )}
        </Card>

        <ConfirmationModal
          isOpen={showResolveModal}
          onClose={() => { setShowResolveModal(false); setSelectedId(null); }}
          onConfirm={handleResolve}
          title="Resolve Dispute"
          message="Mark this dispute as resolved? This will close the case."
          confirmText="Resolve"
        />
      </div>
    </AdminLayout>
  );
}

