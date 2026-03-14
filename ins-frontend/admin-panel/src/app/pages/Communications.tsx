import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import {
  Card,
  Table,
  Button,
  StatusBadge,
  Pagination,
} from '../components/ui/AdminComponents';
import { MessageSquare, Loader2, Eye, Ban, X } from 'lucide-react';
import { communicationsService, ConversationItem, MessageItem } from '../../services/admin.service';

export default function Communications() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [blockingId, setBlockingId] = useState<string | null>(null);
  const [viewConvId, setViewConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const fetchConversations = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await communicationsService.getConversations({ page: String(page), per_page: '20' });
      setConversations(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.total_pages);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConversations(1); }, [fetchConversations]);

  const handleBlock = async (id: string) => {
    setBlockingId(id);
    try {
      const res = await communicationsService.blockConversation(id);
      setConversations(prev =>
        prev.map(c => c.id === id ? { ...c, is_blocked: res.data.is_blocked } : c)
      );
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to update block status');
    } finally {
      setBlockingId(null);
    }
  };

  const handleViewThread = async (id: string) => {
    setViewConvId(id);
    setMessagesLoading(true);
    setMessages([]);
    try {
      const res = await communicationsService.getMessages(id, { per_page: '50' });
      setMessages(res.data);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  };

  const columns = [
    { key: 'id', label: 'ID', sortable: true },
    {
      key: 'participant1',
      label: 'Participant 1',
      render: (v: ConversationItem['participant1']) => v?.name || '—',
    },
    {
      key: 'participant2',
      label: 'Participant 2',
      render: (v: ConversationItem['participant2']) => v?.name || '—',
    },
    { key: 'context_type', label: 'Context', sortable: true },
    {
      key: 'last_message',
      label: 'Last Message',
      render: (v: string) =>
        v ? (
          <span className="max-w-xs truncate block text-sm text-[#4C566A]" title={v}>
            {v.length > 60 ? v.slice(0, 60) + '…' : v}
          </span>
        ) : '—',
    },
    {
      key: 'last_message_at',
      label: 'Last Activity',
      render: (v: string) => v ? new Date(v).toLocaleDateString() : '—',
    },
    {
      key: 'is_blocked',
      label: 'Blocked',
      render: (v: boolean) =>
        v ? (
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Blocked</span>
        ) : (
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span>
        ),
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_: string, row: ConversationItem) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleViewThread(row.id)} title="View thread">
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleBlock(row.id)}
            disabled={blockingId === row.id}
            title={row.is_blocked ? 'Unblock' : 'Block'}
          >
            {blockingId === row.id
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Ban className={`w-4 h-4 ${row.is_blocked ? 'text-orange-500' : 'text-red-500'}`} />}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6 flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-[#5B7CFA]" />
          <div>
            <h1 className="text-2xl font-semibold">Communications</h1>
            <p className="text-[#4C566A] text-sm">Monitor platform conversations</p>
          </div>
        </div>

        <Card>
          <div className="p-4 border-b border-[#E5E9F0] flex items-center justify-between">
            <span className="text-sm text-[#4C566A]">
              {loading ? 'Loading…' : `${total} conversation${total !== 1 ? 's' : ''}`}
            </span>
            <Button variant="secondary" size="sm" onClick={() => fetchConversations(currentPage)}>
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-[#5B7CFA]" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-16 gap-4">
              <p className="text-red-500">{error}</p>
              <Button onClick={() => fetchConversations(1)}>Retry</Button>
            </div>
          ) : (
            <Table columns={columns} data={conversations} />
          )}

          {!loading && !error && totalPages > 1 && (
            <div className="p-4 border-t border-[#E5E9F0]">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(p) => { setCurrentPage(p); fetchConversations(p); }}
              />
            </div>
          )}
        </Card>
      </div>

      {/* Message Thread Drawer */}
      {viewConvId && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setViewConvId(null)} />
          <div className="relative bg-white w-full max-w-md h-full flex flex-col shadow-xl">
            <div className="px-5 py-4 border-b border-[#E5E9F0] flex items-center justify-between">
              <h2 className="font-semibold text-lg">Conversation Thread</h2>
              <button onClick={() => setViewConvId(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messagesLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#5B7CFA]" /></div>
              ) : messages.length === 0 ? (
                <p className="text-center text-gray-500 text-sm py-8">No messages found.</p>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-700">{msg.sender.firstName} {msg.sender.lastName}</span>
                      <span className="text-xs text-gray-400">{new Date(msg.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}


