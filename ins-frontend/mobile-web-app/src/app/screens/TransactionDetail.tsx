import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Download, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import { paymentsService, Transaction } from '@/services';

export default function TransactionDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    paymentsService
      .getTransaction(id)
      .then(setTransaction)
      .catch(() => setError('Failed to load transaction.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/earnings')} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="font-semibold">Transaction Details</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/earnings')} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="font-semibold">Transaction Details</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">{error ?? 'Transaction not found'}</p>
        </div>
      </div>
    );
  }

  const platformFee = transaction.amount * 0.05;
  const netAmount = transaction.amount - platformFee;
  const canDispute = transaction.status === 'completed' || transaction.status === 'pending';

  const getStatusIcon = () => {
    switch (transaction.status) {
      case 'completed': return <CheckCircle className="size-5 text-green-600" />;
      case 'pending': return <Clock className="size-5 text-yellow-600" />;
      case 'failed':
      case 'refunded': return <AlertTriangle className="size-5 text-gray-600" />;
      default: return null;
    }
  };

  const getStatusColor = () => {
    switch (transaction.status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'failed': return 'bg-red-100 text-red-700';
      case 'refunded': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };


  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <button 
          onClick={() => navigate('/earnings')} 
          className="p-2 -ml-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-semibold">Transaction Details</h1>
          <p className="text-xs text-gray-600">{transaction.id}</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 space-y-4">
        {/* Amount Card */}
        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              {getStatusIcon()}
              <Badge className={getStatusColor()}>
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </Badge>
            </div>
            <div className="text-3xl md:text-4xl font-bold mb-1">
              ${netAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-sm text-gray-600">Net amount</p>
          </CardContent>
        </Card>

        {/* Transaction Details */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <h3 className="font-semibold">Transaction Information</h3>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Description</p>
                <p className="font-medium">{transaction.description}</p>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-gray-600">Type</p>
                <p className="font-medium capitalize">{transaction.type}</p>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-medium">{new Date(transaction.createdAt).toLocaleString()}</p>
              </div>

              {transaction.referenceId && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-600">Reference</p>
                    <p className="font-medium">{transaction.referenceId}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Breakdown */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="font-semibold">Payment Breakdown</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Gross Amount</span>
                <span className="font-medium">${transaction.amount.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Platform Fee (5%)</span>
                <span className="font-medium text-red-600">-${platformFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              <Separator />

              <div className="flex justify-between text-lg">
                <span className="font-semibold">Net Amount</span>
                <span className="font-bold text-green-600">${netAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full min-h-[44px]"
          >
            <Download className="size-4 mr-2" />
            Download Receipt
          </Button>

          {canDispute && (
            <Button 
              variant="outline" 
              className="w-full min-h-[44px] text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => navigate(`/dispute/create?transactionId=${transaction.id}`)}
            >
              <AlertTriangle className="size-4 mr-2" />
              Request Refund / Dispute
            </Button>
          )}
        </div>

        {/* Help */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <p className="text-sm text-gray-700">
              Questions about this transaction? <button className="text-blue-600 font-medium" onClick={() => navigate('/support')}>Contact Support</button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

