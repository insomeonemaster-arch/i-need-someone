import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { supportService, SupportTicket } from '@/services';

function formatTimestamp(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function SupportTicketList() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await supportService.getTickets();
      setTickets(data);
    } catch (err) {
      console.error('Failed to load tickets:', err);
      setError('Failed to load tickets. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const openTickets = tickets.filter(t => t.status !== 'resolved' && t.status !== 'closed');
  const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-700';
      case 'in-progress': return 'bg-blue-100 text-blue-700';
      case 'awaiting': return 'bg-yellow-100 text-yellow-700';
      case 'resolved': 
      case 'closed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Open';
      case 'in-progress': return 'In Progress';
      case 'awaiting': return 'Awaiting Response';
      case 'resolved': 
      case 'closed': return 'Resolved';
      default: return status;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'billing': return 'Billing';
      case 'technical': return 'Technical';
      case 'account': return 'Account';
      case 'dispute': return 'Dispute';
      case 'other': return 'Other';
      default: return category;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
          <button 
            onClick={() => navigate('/support')} 
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-semibold">My Support Tickets</h1>
          </div>
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
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
          <button 
            onClick={() => navigate('/support')} 
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-semibold">My Support Tickets</h1>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <AlertCircle className="size-12 text-red-400 mb-4" />
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <button
            onClick={loadTickets}
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
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <button 
          onClick={() => navigate('/support')} 
          className="p-2 -ml-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-semibold">My Support Tickets</h1>
          {openTickets.length > 0 && (
            <p className="text-xs text-gray-600">{openTickets.length} active tickets</p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 space-y-6">
        <Button 
          className="w-full min-h-[44px]"
          onClick={() => navigate('/support/create')}
        >
          Create New Ticket
        </Button>

        {openTickets.length > 0 && (
          <div>
            <h2 className="font-semibold mb-3 px-1">Active Tickets</h2>
            <div className="space-y-3">
              {openTickets.map((ticket) => (
                <Card
                  key={ticket.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/support/ticket/${ticket.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-500">#{ticket.id.slice(-6)}</span>
                          <Badge className={getStatusColor(ticket.status)}>
                            {getStatusLabel(ticket.status)}
                          </Badge>
                        </div>
                        <h3 className="font-medium mb-1">{ticket.subject}</h3>
                        <p className="text-sm text-gray-600">{getCategoryLabel(ticket.category)}</p>
                      </div>
                      <ChevronRight className="size-5 text-gray-400 flex-shrink-0" />
                    </div>
                    <div className="text-xs text-gray-500">
                      Last updated: {formatTimestamp(ticket.updatedAt)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {resolvedTickets.length > 0 && (
          <div>
            <h2 className="font-semibold mb-3 px-1">Resolved Tickets</h2>
            <div className="space-y-3">
              {resolvedTickets.map((ticket) => (
                <Card
                  key={ticket.id}
                  className="cursor-pointer hover:shadow-md transition-shadow opacity-75"
                  onClick={() => navigate(`/support/ticket/${ticket.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-500">#{ticket.id.slice(-6)}</span>
                          <Badge className={getStatusColor(ticket.status)}>
                            {getStatusLabel(ticket.status)}
                          </Badge>
                        </div>
                        <h3 className="font-medium mb-1">{ticket.subject}</h3>
                        <p className="text-sm text-gray-600">{getCategoryLabel(ticket.category)}</p>
                      </div>
                      <ChevronRight className="size-5 text-gray-400 flex-shrink-0" />
                    </div>
                    <div className="text-xs text-gray-500">
                      Resolved: {ticket.resolvedAt ? formatTimestamp(ticket.resolvedAt) : 'N/A'}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {tickets.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
            <div className="size-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <svg className="size-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-lg mb-2">No tickets yet</h3>
            <p className="text-gray-600 text-sm">Create a ticket to get help from our support team</p>
          </div>
        )}
      </div>
    </div>
  );
}
