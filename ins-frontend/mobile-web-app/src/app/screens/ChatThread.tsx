import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, MoreVertical, Flag, Ban, HelpCircle, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { INSInputBar } from '@/app/components/ins/INSInputBar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { messagingService, socketService, Conversation, Message } from '@/services';
import { useAuth } from '@/context/AuthContext';

const MESSAGES_PER_PAGE = 10;

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function ChatThread() {
  const navigate = useNavigate();
  const { id: conversationId } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // If same-user demo (messaging yourself), fall back to the user's own info
  const otherParticipant =
    conversation?.participants?.find((p) => p.id !== user?.id) ??
    conversation?.participants?.[0];

  // ── Initial load ──────────────────────────────────────────────────────────
  const loadMessages = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    setError(null);
    try {
      const [conv, msgs] = await Promise.all([
        messagingService.getConversation(conversationId),
        messagingService.getMessages(conversationId, 1, MESSAGES_PER_PAGE),
      ]);
      setConversation(conv);
      setMessages(msgs);
      setHasMore(msgs.length === MESSAGES_PER_PAGE);
      setPage(1);
    } catch (err) {
      console.error('Failed to load chat:', err);
      setError('Failed to load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Scroll to bottom after initial load (instant, no animation)
  useEffect(() => {
    if (!loading) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
    }
  }, [loading]);

  // ── Load older messages when scrolling to top ─────────────────────────────
  const loadOlderMessages = useCallback(async () => {
    if (!conversationId || loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    const container = scrollContainerRef.current;
    const prevScrollHeight = container?.scrollHeight ?? 0;
    try {
      const older = await messagingService.getMessages(conversationId, nextPage, MESSAGES_PER_PAGE);
      if (older.length === 0) {
        setHasMore(false);
        return;
      }
      setMessages((prev) => [...older, ...prev]);
      setHasMore(older.length === MESSAGES_PER_PAGE);
      setPage(nextPage);
      // Restore scroll position so the view doesn't jump
      if (container) {
        requestAnimationFrame(() => {
          container.scrollTop = container.scrollHeight - prevScrollHeight;
        });
      }
    } catch {
      // silent — user can scroll up again to retry
    } finally {
      setLoadingMore(false);
    }
  }, [conversationId, loadingMore, hasMore, page]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container && container.scrollTop < 80 && hasMore && !loadingMore) {
      loadOlderMessages();
    }
  }, [hasMore, loadingMore, loadOlderMessages]);

  // ── Socket: real-time new messages ────────────────────────────────────────
  useEffect(() => {
    if (!conversationId) return;

    socketService.connect().then(() => {
      socketService.joinConversation(conversationId);
    });

    const unsubscribe = socketService.on('message:new', (data: Message) => {
      if (data.conversationId === conversationId) {
        setMessages((prev) => {
          // Deduplicate: the sender already appended via handleSendMessage
          if (prev.some((m) => m.id === data.id)) return prev;
          return [...prev, data];
        });
        // Scroll to bottom for incoming messages
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      }
    });

    return () => {
      unsubscribe();
      if (conversationId) socketService.leaveConversation(conversationId);
    };
  }, [conversationId]);

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSendMessage = async (content: string, _files?: File[]) => {
    if (!conversationId || !content.trim()) return;
    setSending(true);
    try {
      const newMessage = await messagingService.sendMessage(conversationId, content.trim());
      setMessages((prev) => [...prev, newMessage]);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // ── Loading / Error states ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/messages')}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="font-semibold">Chat</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="size-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error && !conversation) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/messages')}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="font-semibold">Chat</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadMessages}
            className="px-4 py-2 bg-[var(--brand-orange)] text-white rounded-lg hover:bg-orange-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/messages')}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <ArrowLeft className="size-5" />
        </button>

        <Avatar className="flex-shrink-0">
          {otherParticipant?.avatarUrl ? (
            <img src={otherParticipant.avatarUrl} alt={otherParticipant.displayName} className="object-cover w-full h-full" />
          ) : (
            <AvatarFallback className="bg-gray-300 text-gray-600">
              {otherParticipant ? getInitials(otherParticipant.displayName) : '?'}
            </AvatarFallback>
          )}
        </Avatar>

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold leading-tight truncate">
            {otherParticipant?.displayName || 'Chat'}
          </h2>
          <p className="text-xs text-gray-500">Tap for more info</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="p-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center">
            <MoreVertical className="size-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => otherParticipant && navigate(`/report?type=user&userId=${otherParticipant.id}`)}>
              <Flag className="size-4 mr-2" />
              Report User
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600" onClick={async () => {
              if (conversationId) {
                await messagingService.archiveConversation(conversationId);
                navigate('/messages');
              }
            }}>
              <Ban className="size-4 mr-2" />
              Block User
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/support')}>
              <HelpCircle className="size-4 mr-2" />
              Get Help
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 pb-4 space-y-4"
      >
        {/* Load older messages indicator */}
        {loadingMore && (
          <div className="flex justify-center py-2">
            <Loader2 className="size-5 animate-spin text-gray-400" />
          </div>
        )}
        {!hasMore && messages.length > 0 && (
          <p className="text-center text-xs text-gray-400 py-2">Beginning of conversation</p>
        )}

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isMe = message.senderId === user?.id;
            return (
              <div key={message.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                <Avatar className="flex-shrink-0">
                  <AvatarFallback className={isMe ? 'bg-[var(--brand-orange)] text-white' : 'bg-gray-300 text-gray-600'}>
                    {isMe ? 'U' : (otherParticipant ? getInitials(otherParticipant.displayName) : '?')}
                  </AvatarFallback>
                </Avatar>

                <div className={`flex-1 max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`rounded-2xl px-4 py-3 ${
                    isMe
                      ? 'bg-[var(--brand-orange)] text-white rounded-br-md'
                      : 'bg-white border text-gray-900 rounded-bl-md'
                  }`}>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                  <span className="text-xs text-gray-500 mt-1">
                    {formatMessageTime(message.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar — inline so it sits above the BottomNav (which is fixed at z-40) */}
      <INSInputBar
        onSend={handleSendMessage}
        placeholder="Type a message..."
        showAttachment={true}
        disabled={sending}
        className="pb-16"
      />
    </div>
  );
}

