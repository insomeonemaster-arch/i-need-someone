import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent } from '@/app/components/ui/card';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { Badge } from '@/app/components/ui/badge';
import { Loader2, AlertCircle } from 'lucide-react';
import { messagingService, Conversation } from '@/services';
import { useAuth } from '@/context/AuthContext';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getColor(index: number): string {
  const colors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-green-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-red-500',
  ];
  return colors[index % colors.length];
}

function formatTimestamp(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function Messages() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await messagingService.getConversations();
      setConversations(data);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setError('Failed to load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="p-6">
          <h1 className="text-2xl mb-1">Messages</h1>
          <p className="text-gray-600">Your conversations</p>
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
          <h1 className="text-2xl mb-1">Messages</h1>
          <p className="text-gray-600">Your conversations</p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <AlertCircle className="size-12 text-red-400 mb-4" />
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <button
            onClick={loadConversations}
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
        <h1 className="text-2xl mb-1">Messages</h1>
        <p className="text-gray-600">Your conversations</p>
      </div>

      {conversations.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-gray-500 text-center">No messages yet</p>
          <p className="text-gray-400 text-sm text-center mt-1">Start a conversation by contacting a provider</p>
        </div>
      ) : (
        <div className="flex-1 pb-24 overflow-y-auto">
          {conversations.map((conversation, index) => {
            const otherParticipant =
              conversation.participants?.find((p) => p.id !== user?.id) ??
              conversation.participants?.[0];
            const displayName = otherParticipant?.displayName || 'Unknown';
            const avatarUrl = otherParticipant?.avatarUrl;

            return (
              <div key={conversation.id}>
                <Card
                  className="rounded-none border-x-0 border-t-0 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/chat/${conversation.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="flex-shrink-0">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={displayName} className="object-cover w-full h-full" />
                        ) : (
                          <AvatarFallback className={`${getColor(index)} text-white`}>
                            {getInitials(displayName)}
                          </AvatarFallback>
                        )}
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="min-w-0">
                            <h3 className="font-medium leading-tight truncate">{displayName}</h3>
                            <p className="text-xs text-gray-500">
                              {conversation.lastMessage?.messageType === 'text' || !conversation.lastMessage?.messageType
                                ? conversation.lastMessage?.content?.slice(0, 50)
                                : 'Sent an attachment'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {conversation.lastMessage && (
                              <span className="text-xs text-gray-500">
                                {formatTimestamp(conversation.lastMessage.createdAt)}
                              </span>
                            )}
                            {conversation.unreadCount > 0 && (
                              <Badge className="bg-blue-600 hover:bg-blue-600 h-5 min-w-5 px-1.5 flex items-center justify-center">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
