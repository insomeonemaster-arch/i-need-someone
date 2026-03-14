import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import {
  Card,
  Table,
  Button,
  StatusBadge,
  Tabs,
  Pagination,
  ConfirmationModal,
} from '../components/ui/AdminComponents';
import { Loader2, DollarSign } from 'lucide-react';
import { paymentsService, PaymentItem, PayoutItem } from '../../services/admin.service';

export default function Payments() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [paymentsTotal, setPaymentsTotal] = useState(0);
  const [payoutsTotal, setPayoutsTotal] = useState(0);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [payoutsPage, setPayoutsPage] = useState(1);
  const [paymentsTotalPages, setPaymentsTotalPages] = useState(1);
  const [payoutsTotalPages, setPayoutsTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);

  const fetchPayments = useCallback(async (page = 1) => {
    try {
      const res = await paymentsService.getPayments({ page: String(page), per_page: '20' });
      setPayments(res.data);
      setPaymentsTotal(res.meta.total);
      setPaymentsTotalPages(res.meta.total_pages);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load payments');
    }
  }, []);

  const fetchPayouts = useCallback(async (page = 1) => {
    try {
      const res = await paymentsService.getPayouts({ page: String(page), per_page: '20' });
      setPayouts(res.data);
      setPayoutsTotal(res.meta.total);
      setPayoutsTotalPages(res.meta.total_pages);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load payouts');
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchPayments(1), fetchPayouts(1)]).finally(() => setLoading(false));
  }, [fetchPayments, fetchPayouts]);

  const handleRefund = async () => {
    if (!selectedPaymentId) return;
    try {
      await paymentsService.refundPayment(selectedPaymentId);
      fetchPayments(paymentsPage);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Refund failed');
    } finally {
      setSelectedPaymentId(null);
    }
  };

  const handleProcessPayout = async (id: string) => {
    try {
      await paymentsService.processPayout(id);
      fetchPayouts(payoutsPage);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to process payout');
    }
  };

  const paymentColumns = [
    { key: 'payment_id', label: 'Payment ID', sortable: true },
    {
      key: 'payer',
      label: 'Payer',
      sortable: false,
      render: (v: PaymentItem['payer']) => v?.name || '—',
    },
    {
      key: 'payee',
      label: 'Payee',
      sortable: false,
      render: (v: PaymentItem['payee']) => v?.name || '—',
    },
    {
      key: 'entity_type',
      label: 'Type',
      sortable: true,
      render: (v: string) => <StatusBadge status={v as any} />,
    },
    { key: 'entity_display', label: 'Entity', sortable: false },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (v: number) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (v: string) => <StatusBadge status={v as any} />,
    },
    {
      key: 'created_at',
      label: 'Date',
      sortable: true,
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      key: 'id',
      label: 'Action',
      render: (_: string, row: PaymentItem) =>
        row.status === 'completed' ? (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => { setSelectedPaymentId(row.id); setShowRefundModal(true); }}
          >
            Refund
          </Button>
        ) : null,
    },
  ];

  const payoutColumns = [
    { key: 'payout_id', label: 'Payout ID', sortable: true },
    {
      key: 'provider',
      label: 'Provider',
      sortable: false,
      render: (v: PayoutItem['provider']) => v?.name || '—',
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (v: number) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    },
    {
      key: 'net_amount',
      label: 'Net',
      sortable: true,
      render: (v: number) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (v: string) => <StatusBadge status={v as any} />,
    },
    { key: 'method', label: 'Method', sortable: false },
    {
      key: 'created_at',
      label: 'Date',
      sortable: true,
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      key: 'id',
      label: 'Action',
      render: (_: string, row: PayoutItem) =>
        row.status === 'pending' ? (
          <Button variant="primary" size="sm" onClick={() => handleProcessPayout(row.id)}>
            Process
          </Button>
        ) : null,
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Payments & Payouts</h1>
          <p className="text-[#4C566A]">Manage all payment transactions and provider payouts</p>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-[#EEF1F5] rounded-lg border border-[#E5E9F0] p-6 flex items-start gap-4">
            <DollarSign className="w-8 h-8 text-[#5B7CFA]" />
            <div>
              <div className="text-sm text-[#4C566A]">Total Payments</div>
              <div className="text-2xl font-semibold">{paymentsTotal}</div>
            </div>
          </div>
          <div className="bg-[#EEF1F5] rounded-lg border border-[#E5E9F0] p-6 flex items-start gap-4">
            <DollarSign className="w-8 h-8 text-green-500" />
            <div>
              <div className="text-sm text-[#4C566A]">Total Payouts</div>
              <div className="text-2xl font-semibold">{payoutsTotal}</div>
            </div>
          </div>
        </div>

        <Card>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-7 h-7 animate-spin text-[#5B7CFA]" />
            </div>
          ) : (
            <Tabs
              tabs={[
                {
                  id: 'payments',
                  label: 'Payments',
                  content: (
                    <>
                      <Table columns={paymentColumns} data={payments} />
                      <Pagination
                        currentPage={paymentsPage}
                        totalPages={paymentsTotalPages}
                        onPageChange={(p) => { setPaymentsPage(p); fetchPayments(p); }}
                      />
                    </>
                  ),
                },
                {
                  id: 'payouts',
                  label: 'Payouts',
                  content: (
                    <>
                      <Table columns={payoutColumns} data={payouts} />
                      <Pagination
                        currentPage={payoutsPage}
                        totalPages={payoutsTotalPages}
                        onPageChange={(p) => { setPayoutsPage(p); fetchPayouts(p); }}
                      />
                    </>
                  ),
                },
              ]}
            />
          )}
        </Card>

        <ConfirmationModal
          isOpen={showRefundModal}
          onClose={() => { setShowRefundModal(false); setSelectedPaymentId(null); }}
          onConfirm={handleRefund}
          title="Issue Refund"
          message="Are you sure you want to refund this payment? This action cannot be undone."
          confirmText="Issue Refund"
        />
      </div>
    </AdminLayout>
  );
}
