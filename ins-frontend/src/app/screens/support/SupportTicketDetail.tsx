import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Paperclip, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { INSInputBar } from '@/app/components/ins/INSInputBar';
import { supportService, SupportTicket, TicketMessage } from '@/services';

export default function SupportTicketDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supportService.getTicket(id),
      supportService.getTicketMessages(id),
    ])
      .then(([t, m]) => { setTicket(t); setMessages(m); })
      .catch(() => setFetchError('Could not load ticket. It may not exist or you may not have access.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-700';
      case 'in-progress': return 'bg-blue-100 text-blue-700';
      case 'awaiting': return 'bg-yellow-100 text-yellow-700';
      case 'resolved': return 'bg-gray-100 text-gray-700';
      case 'closed': return 'bg-gray-100 text-gray-500';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Open';
      case 'in-progress': return 'In Progress';
      case 'awaiting': return 'Awaiting Response';
      case 'resolved': return 'Resolved';
      case 'closed': return 'Closed';
      default: return status;
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!id || !content.trim()) return;
    setSending(true);
    try {
      const newMsg = await supportService.addTicketMessage(id, content);
      setMessages((prev) => [...prev, newMsg]);
    } catch {
      // message failed — silently leave input intact; user can retry
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/support/tickets')} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="font-semibold">Ticket Details</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="size-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (fetchError || !ticket) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/support/tickets')} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="font-semibold">Ticket Details</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <AlertCircle className="size-10 text-red-400" />
          <p className="text-gray-600">{fetchError || 'Ticket not found'}</p>
        </div>
      </div>
    );
  }

  const isClosed = ticket.status === 'resolved' || ticket.status === 'closed';

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate('/support/tickets')}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="font-semibold flex-1">Ticket Details</h1>
        </div>
        <div className="ml-12 space-y-1">
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(ticket.status)}>
              {getStatusLabel(ticket.status)}
            </Badge>
            <span className="text-xs text-gray-500 capitalize">{ticket.category}</span>
          </div>
          <h2 className="font-medium">{ticket.subject}</h2>
          <p className="text-xs text-gray-500">
            Created {new Date(ticket.createdAt).toLocaleDateString()}
            {ticket.resolvedAt && ` · Resolved ${new Date(ticket.resolvedAt).toLocaleDateString()}`}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-32 space-y-4">
        {/* Original description as first bubble */}
        <div className="flex gap-3 flex-row-reverse">
          <Avatar className="flex-shrink-0">
            <AvatarFallback className="bg-[var(--brand-orange)] text-white">U</AvatarFallback>
          </Avatar>
          <div className="flex-1 max-w-[80%] items-end flex flex-col">
            <div className="text-xs text-gray-500 mb-1">You · {new Date(ticket.createdAt).toLocaleString()}</div>
            <div className="rounded-2xl rounded-br-md px-4 py-3 bg-[var(--brand-orange)] text-white">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
            </div>
          </div>
        </div>

        {messages.map((msg) => {
          const isUser = msg.senderId === ticket.userId;
          return (
            <div key={msg.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
              <Avatar className="flex-shrink-0">
                <AvatarFallback className={isUser ? 'bg-[var(--brand-orange)] text-white' : 'bg-blue-500 text-white'}>
                  {isUser ? 'U' : 'S'}
                </AvatarFallback>
              </Avatar>
              <div className={`flex-1 max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className="text-xs text-gray-500 mb-1">
                  {isUser ? 'You' : 'Support'} · {new Date(msg.createdAt).toLocaleString()}
                </div>
                <div className={`rounded-2xl px-4 py-3 ${
                  isUser ? 'bg-[var(--brand-orange)] text-white rounded-br-md' : 'bg-gray-100 text-gray-900 rounded-bl-md'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                </div>
              </div>
            </div>
          );
        })}

        {isClosed && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <CheckCircle className="size-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-900 mb-1">Ticket {ticket.status === 'resolved' ? 'Resolved' : 'Closed'}</h3>
                  {ticket.resolvedAt && (
                    <p className="text-xs text-green-700">On {new Date(ticket.resolvedAt).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div ref={bottomRef} />
      </div>

      {!isClosed && (
        <INSInputBar
          onSend={handleSendMessage}
          placeholder={sending ? 'Sending…' : 'Reply with INS or type…'}
          showAttachment={false}
          className="fixed bottom-0 left-0 right-0 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
        />
      )}
    </div>
  );
}
