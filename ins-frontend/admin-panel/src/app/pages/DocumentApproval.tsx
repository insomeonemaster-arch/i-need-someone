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
import { ShieldCheck, Loader2, ExternalLink, CheckCircle2, XCircle } from 'lucide-react';
import { verificationsService, DocumentItem } from '../../services/admin.service';

export default function DocumentApproval() {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [approvedDocs, setApprovedDocs] = useState<DocumentItem[]>([]);
  const [approvedTotal, setApprovedTotal] = useState(0);
  const [approvedPages, setApprovedPages] = useState(1);
  const [approvedPage, setApprovedPage] = useState(1);
  const [approvedLoading, setApprovedLoading] = useState(false);

  const [rejectedDocs, setRejectedDocs] = useState<DocumentItem[]>([]);
  const [rejectedTotal, setRejectedTotal] = useState(0);
  const [rejectedPages, setRejectedPages] = useState(1);
  const [rejectedPage, setRejectedPage] = useState(1);
  const [rejectedLoading, setRejectedLoading] = useState(false);

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

  const fetchApproved = useCallback(async (page = 1) => {
    setApprovedLoading(true);
    try {
      const res = await verificationsService.getByStatus('verified', { page: String(page), per_page: '20' });
      setApprovedDocs(res.data);
      setApprovedTotal(res.meta.total);
      setApprovedPages(res.meta.total_pages);
      setApprovedPage(page);
    } catch {
      // silently fail for secondary sections
    } finally {
      setApprovedLoading(false);
    }
  }, []);

  const fetchRejected = useCallback(async (page = 1) => {
    setRejectedLoading(true);
    try {
      const res = await verificationsService.getByStatus('rejected', { page: String(page), per_page: '20' });
      setRejectedDocs(res.data);
      setRejectedTotal(res.meta.total);
      setRejectedPages(res.meta.total_pages);
      setRejectedPage(page);
    } catch {
      // silently fail for secondary sections
    } finally {
      setRejectedLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs(1);
    fetchApproved(1);
    fetchRejected(1);
  }, [fetchDocs, fetchApproved, fetchRejected]);

  const handleApprove = async (_reason: string) => {
    if (!approveTarget) return;
    setActionLoading(true);
    try {
      await verificationsService.approveDocument(approveTarget);
      setDocs((prev) => prev.filter((d) => d.id !== approveTarget));
      setTotal((t) => t - 1);
      fetchApproved(1);
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
      fetchRejected(1);
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

  // Shared view-only columns for approved/rejected sections
  const baseColumns = [
    {
      key: 'id',
      label: 'ID',
      render: (v: string) => <span className="text-xs font-mono text-[#4C566A]">{v.slice(0, 8)}…</span>,
    },
    {
      key: 'documentType',
      label: 'Document Type',
      render: (v: string) => <span className="font-medium capitalize">{v.replace(/_/g, ' ')}</span>,
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
        ) : '—',
    },
    {
      key: 'createdAt',
      label: 'Submitted',
      render: (v: string) => (v ? new Date(v).toLocaleDateString() : '—'),
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
            {viewingId === row.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
            View
          </button>
        ) : (
          <span className="text-[#4C566A] text-sm">—</span>
        ),
    },
  ];

  const readOnlyColumns = [
    ...baseColumns,
    {
      key: 'verificationStatus',
      label: 'Status',
      render: (v: string) => <StatusBadge status={v as any} />,
    },
  ];

  const rejectedColumns = [
    ...baseColumns,
    {
      key: 'rejectionReason',
      label: 'Reason',
      render: (v: string) => <span className="text-sm text-red-600">{v || '—'}</span>,
    },
    {
      key: 'verificationStatus',
      label: 'Status',
      render: (v: string) => <StatusBadge status={v as any} />,
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-[#5B7CFA]" />
          <div>
            <h1 className="text-2xl font-semibold">Document Approval</h1>
            <p className="text-sm text-[#4C566A]">Review and approve pending verification documents</p>
          </div>
          <span className="ml-auto text-sm text-[#4C566A]">{total} pending</span>
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
        )}

        {/* Pending Documents */}
        <Card>
          <div className="px-6 py-4 border-b border-[#E5E9F0]">
            <h2 className="font-semibold text-base">Pending Review</h2>
          </div>
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
                  <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={fetchDocs} />
                </div>
              )}
            </>
          )}
        </Card>

        {/* Approved Documents */}
        <Card>
          <div className="px-6 py-4 border-b border-[#E5E9F0] flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <h2 className="font-semibold text-base">Approved Documents</h2>
            <span className="ml-auto text-sm text-[#4C566A]">{approvedTotal} total</span>
          </div>
          {approvedLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-[#5B7CFA]" />
            </div>
          ) : approvedDocs.length === 0 ? (
            <p className="px-6 py-8 text-sm text-[#4C566A] text-center">No approved documents yet.</p>
          ) : (
            <>
              <Table columns={readOnlyColumns} data={approvedDocs} />
              {approvedPages > 1 && (
                <div className="p-4 border-t border-[#E5E9F0]">
                  <Pagination currentPage={approvedPage} totalPages={approvedPages} onPageChange={fetchApproved} />
                </div>
              )}
            </>
          )}
        </Card>

        {/* Rejected Documents */}
        <Card>
          <div className="px-6 py-4 border-b border-[#E5E9F0] flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-400" />
            <h2 className="font-semibold text-base">Rejected Documents</h2>
            <span className="ml-auto text-sm text-[#4C566A]">{rejectedTotal} total</span>
          </div>
          {rejectedLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-[#5B7CFA]" />
            </div>
          ) : rejectedDocs.length === 0 ? (
            <p className="px-6 py-8 text-sm text-[#4C566A] text-center">No rejected documents.</p>
          ) : (
            <>
              <Table columns={rejectedColumns} data={rejectedDocs} />
              {rejectedPages > 1 && (
                <div className="p-4 border-t border-[#E5E9F0]">
                  <Pagination currentPage={rejectedPage} totalPages={rejectedPages} onPageChange={fetchRejected} />
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
