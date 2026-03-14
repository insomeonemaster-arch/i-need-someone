import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Download, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';

const mockTransactions: Record<string, {
  id: string;
  title: string;
  client: string;
  provider: string;
  amount: number;
  platformFee: number;
  netAmount: number;
  status: 'completed' | 'pending' | 'disputed' | 'refunded';
  date: string;
  paymentMethod: string;
  transactionId: string;
  linkedItemType: 'request' | 'project' | 'job';
  linkedItemId: string;
  canDispute: boolean;
  canRefund: boolean;
}> = {
  '1': {
    id: '1',
    title: 'Bathroom Renovation',
    client: 'Jane Smith',
    provider: 'John Doe (You)',
    amount: 2100,
    platformFee: 105,
    netAmount: 1995,
    status: 'completed',
    date: '2026-01-28 03:30 PM',
    paymentMethod: 'Credit Card (...4242)',
    transactionId: 'TXN-2026-0128-4521',
    linkedItemType: 'request',
    linkedItemId: '1',
    canDispute: false,
    canRefund: false,
  },
  '3': {
    id: '3',
    title: 'E-commerce SEO Optimization',
    client: 'Fashion Boutique',
    provider: 'John Doe (You)',
    amount: 950,
    platformFee: 47.50,
    netAmount: 902.50,
    status: 'pending',
    date: '2026-01-20 11:15 AM',
    paymentMethod: 'ACH Transfer',
    transactionId: 'TXN-2026-0120-3891',
    linkedItemType: 'project',
    linkedItemId: '1',
    canDispute: true,
    canRefund: true,
  },
};

export default function TransactionDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const transaction = id ? mockTransactions[id] : null;

  if (!transaction) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
          <button 
            onClick={() => navigate('/earnings')} 
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="font-semibold">Transaction Details</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">Transaction not found</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (transaction.status) {
      case 'completed': return <CheckCircle className="size-5 text-green-600" />;
      case 'pending': return <Clock className="size-5 text-yellow-600" />;
      case 'disputed': return <AlertTriangle className="size-5 text-red-600" />;
      case 'refunded': return <AlertTriangle className="size-5 text-gray-600" />;
      default: return null;
    }
  };

  const getStatusColor = () => {
    switch (transaction.status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'disputed': return 'bg-red-100 text-red-700';
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
          <p className="text-xs text-gray-600">{transaction.transactionId}</p>
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
              ${transaction.netAmount.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600">Net amount received</p>
          </CardContent>
        </Card>

        {/* Transaction Details */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <h3 className="font-semibold">Transaction Information</h3>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Service</p>
                <p className="font-medium">{transaction.title}</p>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-gray-600">Client</p>
                <p className="font-medium">{transaction.client}</p>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-gray-600">Provider</p>
                <p className="font-medium">{transaction.provider}</p>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-gray-600">Date & Time</p>
                <p className="font-medium">{transaction.date}</p>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-gray-600">Payment Method</p>
                <p className="font-medium">{transaction.paymentMethod}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Breakdown */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="font-semibold">Payment Breakdown</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Service Amount</span>
                <span className="font-medium">${transaction.amount.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Platform Fee (5%)</span>
                <span className="font-medium text-red-600">-${transaction.platformFee.toLocaleString()}</span>
              </div>

              <Separator />

              <div className="flex justify-between text-lg">
                <span className="font-semibold">Net Amount</span>
                <span className="font-bold text-green-600">${transaction.netAmount.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full min-h-[44px]"
            onClick={() => navigate(`/${transaction.linkedItemType}s/detail/${transaction.linkedItemId}`)}
          >
            View Related {transaction.linkedItemType === 'request' ? 'Request' : transaction.linkedItemType === 'project' ? 'Project' : 'Job'}
          </Button>

          <Button 
            variant="outline" 
            className="w-full min-h-[44px]"
          >
            <Download className="size-4 mr-2" />
            Download Receipt
          </Button>

          {transaction.canDispute && (
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
