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
import { ShieldCheck, Loader2, ExternalLink } from 'lucide-react';
import { verificationsService, DocumentItem } from '../../services/admin.service';

export default function DocumentApproval() {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [approveTarget, setApproveTarget] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const fetchDocs = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await verificationsService.getPending({ page: String(page), per_page: '20' });
      setDocs(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.total_pages);
      setCurrentPage(page);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs(1);
  }, [fetchDocs]);

  const handleApprove = async (_reason: string) => {
    if (!approveTarget) return;
    setActionLoading(true);
    try {
      await verificationsService.approveDocument(approveTarget);
      setDocs((prev) => prev.filter((d) => d.id !== approveTarget));
      setTotal((t) => t - 1);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Approve failed');
    } finally {
      setActionLoading(false);
      setApproveTarget(null);
    }
  };

  const handleView = async (doc: DocumentItem) => {
    if (!doc.fileUrl) return;
    setViewingId(doc.id);
    try {
      const res = await verificationsService.getViewUrl(doc.fileUrl);
      const signedUrl = res?.data?.signedUrl;
      if (signedUrl) {
        window.open(signedUrl, '_blank', 'noopener,noreferrer');
      } else {
        setError('Could not generate preview URL. Please try again.');
      }
    } catch {
      setError('Failed to load document preview.');
    } finally {
      setViewingId(null);
    }
  };

  const handleReject = async (reason: string) => {
    if (!rejectTarget) return;
    setActionLoading(true);
    try {
      await verificationsService.rejectDocument(rejectTarget, { reason });
      setDocs((prev) => prev.filter((d) => d.id !== rejectTarget));
      setTotal((t) => t - 1);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Reject failed');
    } finally {
      setActionLoading(false);
      setRejectTarget(null);
    }
  };

  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (v: string) => (
        <span className="text-xs font-mono text-[#4C566A]">{v.slice(0, 8)}…</span>
      ),
    },
    {
      key: 'documentType',
      label: 'Document Type',
      render: (v: string) => (
        <span className="font-medium capitalize">{v.replace(/_/g, ' ')}</span>
      ),
    },
    {
      key: 'user',
      label: 'User',
      render: (v: DocumentItem['user']) =>
        v ? (
          <div>
            <div className="font-medium">{`${v.firstName} ${v.lastName}`.trim() || '—'}</div>
            <div className="text-xs text-[#4C566A]">{v.email}</div>
          </div>
        ) : (
          '—'
        ),
    },
    {
      key: 'createdAt',
      label: 'Submitted',
      render: (v: string) => (v ? new Date(v).toLocaleDateString() : '—'),
    },
    {
      key: 'verificationStatus',
      label: 'Status',
      render: (v: string) => <StatusBadge status={v as any} />,
    },
    {
      key: 'fileUrl',
      label: 'File',
      render: (_v: string, row: DocumentItem) =>
        row.fileUrl ? (
          <button
            onClick={() => handleView(row)}
            disabled={viewingId === row.id}
            className="inline-flex items-center gap-1 text-[#5B7CFA] hover:underline text-sm disabled:opacity-50"
          >
            {viewingId === row.id ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <ExternalLink className="w-3 h-3" />
            )}
            View
          </button>
        ) : (
          <span className="text-[#4C566A] text-sm">—</span>
        ),
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_v: string, row: DocumentItem) => (
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setApproveTarget(row.id)}
            disabled={actionLoading}
          >
            Approve
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setRejectTarget(row.id)}
            disabled={actionLoading}
          >
            Reject
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="w-6 h-6 text-[#5B7CFA]" />
          <div>
            <h1 className="text-2xl font-semibold">Document Approval</h1>
            <p className="text-sm text-[#4C566A]">Review and approve pending verification documents</p>
          </div>
          <span className="ml-auto text-sm text-[#4C566A]">{total} pending</span>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
        )}

        <Card>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#5B7CFA]" />
            </div>
          ) : docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#4C566A]">
              <ShieldCheck className="w-10 h-10 mb-3 text-green-400" />
              <p className="font-medium">No pending documents</p>
              <p className="text-sm mt-1">All verification documents have been reviewed.</p>
            </div>
          ) : (
            <>
              <Table columns={columns} data={docs} />
              {totalPages > 1 && (
                <div className="p-4 border-t border-[#E5E9F0]">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={fetchDocs}
                  />
                </div>
              )}
            </>
          )}
        </Card>

        <ConfirmationModal
          isOpen={!!approveTarget}
          onClose={() => setApproveTarget(null)}
          onConfirm={handleApprove}
          title="Approve Document"
          message="Are you sure you want to approve this verification document? The user will be notified."
          confirmText="Approve"
          requireReason={false}
        />

        <ConfirmationModal
          isOpen={!!rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleReject}
          title="Reject Document"
          message="Provide a reason for rejecting this document. The user will be notified."
          confirmText="Reject Document"
          requireReason={true}
        />
      </div>
    </AdminLayout>
  );
}
