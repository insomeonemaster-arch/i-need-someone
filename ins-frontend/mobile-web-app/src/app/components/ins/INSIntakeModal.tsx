import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Mic, Paperclip, Send } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Progress } from '@/app/components/ui/progress';
import { motion, AnimatePresence } from 'motion/react';
import { insService } from '@/services/ins.service';

interface Message {
  id: string;
  role: 'ins' | 'user';
  content: string;
  timestamp: Date;
}

interface QuickAction {
  label: string;
  action: () => void;
}

export interface INSIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: 'local-services' | 'jobs' | 'projects';
  mode: 'client' | 'provider';
  onComplete: (data: any) => void;
  onManualFallback: () => void;
}

export function INSIntakeModal({
  isOpen,
  onClose,
  category,
  mode,
  onComplete,
  onManualFallback,
}: INSIntakeModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [progress, setProgress] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const currentYRef = useRef<number>(0);
  const initStartedRef = useRef(false);

  const handleClose = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setProgress(0);
    setIsTyping(false);
    setQuickActions([]);
    initStartedRef.current = false;
    onClose();
  }, [onClose]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleClose]);

  // Handle Android back button
  useEffect(() => {
    const handlePopState = () => {
      if (isOpen) {
        handleClose();
        window.history.pushState(null, '', window.location.href);
      }
    };

    if (isOpen) {
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', handlePopState);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, handleClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const addINSMessage = useCallback((content: string, actions?: QuickAction[]) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `ins-${Date.now()}`,
        role: 'ins',
        content,
        timestamp: new Date(),
      },
    ]);
    if (actions) {
      setQuickActions(actions);
    }
  }, []);

  const addUserMessage = (content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date(),
      },
    ]);
  };

  // Start a new conversation with the backend when the modal opens
  useEffect(() => {
    if (isOpen && !initStartedRef.current) {
      initStartedRef.current = true;

      setIsTyping(true);
      setProgress(5);
      insService.startConversation(category, mode)
        .then((data) => {
          setConversationId(data.conversation.id);
          setIsTyping(false);
          setProgress(10);
          addINSMessage(data.greeting);
        })
        .catch(() => {
          setIsTyping(false);
          addINSMessage(
            "I'm sorry, I'm having trouble connecting right now. You can try again or use the manual setup below.",
          );
        });
    }

    if (!isOpen) {
      initStartedRef.current = false;
    }
  }, [isOpen, category, mode, addINSMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !conversationId || isTyping) return;

    const content = input.trim();
    addUserMessage(content);
    setInput('');
    setQuickActions([]);
    setIsTyping(true);

    try {
      const response = await insService.sendMessage(conversationId, content);
      setIsTyping(false);
      setProgress((prev) => Math.min(prev + 12, 90));
      addINSMessage(response.message.content);

      if (response.isComplete) {
        setProgress(100);
        setTimeout(async () => {
          if (mode === 'client') {
            try {
              const submitResult = await insService.submitConversation(conversationId);
              onComplete({ ...response.collectedData, ...submitResult });
            } catch {
              // If entity creation fails, still let the user proceed with collected data
              onComplete(response.collectedData ?? {});
            }
          } else {
            onComplete(response.collectedData ?? {});
          }
          handleClose();
        }, 1200);
      }
    } catch {
      setIsTyping(false);
      addINSMessage(
        "Sorry, I had trouble processing that. Please try again or use the manual option below.",
      );
    }
  }, [input, conversationId, isTyping, mode, addINSMessage, handleClose, onComplete]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle swipe down to close on mobile (only from top of scroll)
  const handleTouchStart = (e: React.TouchEvent) => {
    const scrollElement = scrollRef.current;
    if (scrollElement && scrollElement.scrollTop === 0) {
      startYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startYRef.current > 0) {
      currentYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = () => {
    const diff = currentYRef.current - startYRef.current;
    // If swiped down more than 100px, close modal
    if (diff > 100) {
      handleClose();
    }
    startYRef.current = 0;
    currentYRef.current = 0;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50" onClick={handleClose}>
          <motion.div
            ref={modalRef}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-full md:w-[90%] md:max-w-2xl h-[90vh] md:h-[85vh] lg:h-[80vh] bg-white rounded-t-3xl md:rounded-3xl flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Swipe Indicator (Mobile Only) */}
            <div className="md:hidden flex justify-center pt-2 pb-1">
              <div className="w-12 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b bg-[var(--brand-orange)] rounded-t-3xl md:rounded-t-3xl shrink-0">
              <div className="flex items-center gap-3">
                <div className="size-10 md:size-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                  <div className="size-6 md:size-7 rounded-full bg-white" />
                </div>
                <div className="text-white">
                  <h2 className="font-semibold text-sm md:text-base">INS Assistant</h2>
                  <p className="text-xs text-white/80">
                    {conversationId ? `${messages.filter(m => m.role === 'user').length} exchanges` : 'Connecting…'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="px-4 md:px-6 py-3 border-b bg-gray-50 shrink-0">
              <Progress value={progress} className="h-2" />
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-[var(--brand-orange)] text-white rounded-br-md'
                        : 'bg-gray-100 text-gray-900 rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                </div>
              ))}

              {/* Quick Actions */}
              {quickActions.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-start">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={action.action}
                      className="rounded-full min-h-[44px]"
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1 items-center h-5">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t bg-white p-3 md:p-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:pb-4 space-y-3 rounded-b-3xl md:rounded-b-3xl shrink-0">
              <div className="flex items-end gap-2">
                <button className="p-3 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center">
                  <Paperclip className="size-5 text-gray-600" />
                </button>

                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your answer..."
                  className="resize-none min-h-[44px] max-h-32"
                  rows={1}
                />

                <button
                  onClick={() => setIsRecording(!isRecording)}
                  className={`p-3 rounded-full transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center ${
                    isRecording ? 'bg-red-500 text-white' : 'hover:bg-gray-100'
                  }`}
                >
                  <Mic className="size-5" />
                </button>

                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || !conversationId || isTyping}
                  size="icon"
                  className="rounded-full flex-shrink-0 min-w-[44px] min-h-[44px]"
                >
                  <Send className="size-5" />
                </Button>
              </div>

              {/* Manual Fallback Button */}
              <Button
                variant="ghost"
                className="w-full text-gray-600 min-h-[44px]"
                onClick={() => {
                  handleClose();
                  onManualFallback();
                }}
              >
                Do it manually
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}