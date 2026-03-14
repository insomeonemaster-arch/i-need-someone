import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Loader2, AlertCircle, ArrowUpRight, ArrowDownRight, Wrench, Rocket, Briefcase } from 'lucide-react';
import { paymentsService, Transaction, EarningsSummary } from '@/services';

interface DisplayTransaction {
  id: string;
  title: string;
  client: string;
  amount: number;
  status: string;
  date: string;
  type: string;
  icon: typeof Wrench;
  color: string;
}

export default function Earnings() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [transactions, setTransactions] = useState<DisplayTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [summaryData, transactionsData] = await Promise.all([
        paymentsService.getEarningsSummary(),
        paymentsService.getTransactions({ limit: 20 }),
      ]);
      
      setSummary(summaryData);

      const displayTxns: DisplayTransaction[] = transactionsData.map((txn: Transaction) => {
        let icon = Wrench;
        let color = 'bg-blue-50 text-blue-600';
        let type = 'Local Service';
        
        if (txn.type === 'earning') {
          type = 'Earning';
          icon = Rocket;
          color = 'bg-purple-50 text-purple-600';
        } else if (txn.type === 'payout') {
          type = 'Payout';
          icon = Briefcase;
          color = 'bg-green-50 text-green-600';
        }

        return {
          id: txn.id,
          title: txn.description || 'Transaction',
          client: 'Client',
          amount: txn.amount,
          status: txn.status,
          date: new Date(txn.createdAt).toLocaleDateString(),
          type,
          icon,
          color,
        };
      });

      setTransactions(displayTxns);
    } catch (err) {
      console.error('Failed to load earnings:', err);
      setError('Failed to load earnings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const percentChange = summary
    ? (() => {
        const thisMonth = summary.thisMonth?.earnings ?? 0;
        const thisWeek  = summary.thisWeek?.earnings  ?? 0;
        if (thisWeek === 0) return '0';
        return (((thisMonth - thisWeek) / thisWeek) * 100).toFixed(1);
      })()
    : '0';
  const isPositive = summary ? (summary.thisMonth?.earnings ?? 0) >= (summary.thisWeek?.earnings ?? 0) : true;

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="p-6">
          <h1 className="text-2xl mb-1">Earnings</h1>
          <p className="text-gray-600">Track your income</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="size-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="p-6">
          <h1 className="text-2xl mb-1">Earnings</h1>
          <p className="text-gray-600">Track your income</p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <AlertCircle className="size-12 text-red-400 mb-4" />
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-[var(--brand-orange)] text-white rounded-lg hover:bg-orange-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="p-6">
        <h1 className="text-2xl mb-1">Earnings</h1>
        <p className="text-gray-600">Track your income</p>
      </div>
      
      <div className="flex-1 px-6 pb-24 space-y-4 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
              <p className="text-2xl font-bold">${(summary?.allTime?.earnings ?? 0).toLocaleString()}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-1">Pending</p>
              <p className="text-2xl font-bold text-[#4C9F9F]">${(summary?.pending?.earnings ?? 0).toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">This Month</p>
              <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                {percentChange}%
              </div>
            </div>
            <p className="text-3xl font-bold">${(summary?.thisMonth?.earnings ?? 0).toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">
              ${(summary?.thisWeek?.earnings ?? 0).toLocaleString()} this week
            </p>
          </CardContent>
        </Card>

        <div>
          <h2 className="font-semibold mb-3 px-1">Recent Transactions</h2>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="size-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <Card 
                  key={transaction.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/transaction/${transaction.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${transaction.color} flex-shrink-0`}>
                        <transaction.icon className="size-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="min-w-0">
                            <h3 className="font-medium text-sm leading-tight truncate">{transaction.title}</h3>
                            <p className="text-xs text-gray-600">{transaction.client}</p>
                          </div>
                          <span className="font-bold text-sm whitespace-nowrap">
                            ${transaction.amount.toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Badge 
                            variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {transaction.status === 'completed' ? 'Paid' : 
                             transaction.status === 'pending' ? 'Pending' : 
                             transaction.status === 'failed' ? 'Failed' : 'In Progress'}
                          </Badge>
                          <span className="text-xs text-gray-500">{transaction.date}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
