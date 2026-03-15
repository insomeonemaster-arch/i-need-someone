import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Loader2 } from 'lucide-react';
import { messagingService } from '@/services';

/**
 * Thin redirect screen: given ?recipientId=xxx, creates (or retrieves) a
 * conversation with that user and navigates straight to the ChatThread.
 * Supports optional ?contextType and ?contextId query params so the
 * conversation can be linked to a specific service request / project / job.
 */
export default function StartChat() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const recipientId = searchParams.get('recipientId');
  const contextType = searchParams.get('contextType') ?? undefined;
  const contextId = searchParams.get('contextId') ?? undefined;

  useEffect(() => {
    if (!recipientId) {
      navigate('/messages', { replace: true });
      return;
    }
    messagingService
      .createConversation(recipientId, { contextType, contextId })
      .then((conv) => navigate(`/chat/${conv.id}`, { replace: true }))
      .catch(() => navigate('/messages', { replace: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-full items-center justify-center bg-gray-50">
      <Loader2 className="size-8 animate-spin text-gray-400" />
    </div>
  );
}
