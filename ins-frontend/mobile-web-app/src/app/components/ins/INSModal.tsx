import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { X, Mic, Send, History, Paperclip } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Card, CardContent } from '@/app/components/ui/card';
import { Progress } from '@/app/components/ui/progress';
import { motion, AnimatePresence } from 'motion/react';
import { useINS } from '@/app/context/INSContext';
import { insService, InsConversation } from '@/services/ins.service';

interface Message {
  id: string;
  role: 'ins' | 'user';
  content: string;
}

type INSPhase = 'idle' | 'chatting' | 'complete';

const CHIP_ACTIONS = [
  { label: 'Find local services', category: 'local-services', type: 'conversation' as const },
  { label: 'Post a job',          category: 'jobs',           type: 'conversation' as const },
  { label: 'Create a project',    category: 'projects',       type: 'conversation' as const },
  { label: 'Check my requests',   route: '/my-requests',      type: 'navigation' as const },
  { label: 'View earnings',       route: '/earnings',         type: 'navigation' as const },
];

export default function INSModal() {
  const { isINSOpen, closeINS } = useINS();
  const location = useLocation();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<INSPhase>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('chat');
  const [history, setHistory] = useState<InsConversation[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const currentYRef = useRef<number>(0);

  // Reset state when modal closes
  useEffect(() => {
    if (!isINSOpen) {
      setPhase('idle');
      setMessages([]);
      setInput('');
      setConversationId(null);
      setProgress(0);
      setActiveTab('chat');
    }
  }, [isINSOpen]);

  // Load real history when that tab is opened
  useEffect(() => {
    if (activeTab === 'history' && isINSOpen) {
      setHistoryLoading(true);
      insService.getConversations()
        .then(setHistory)
        .catch(() => setHistory([]))
        .finally(() => setHistoryLoading(false));
    }
  }, [activeTab, isINSOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ESC key closes modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isINSOpen) closeINS();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isINSOpen, closeINS]);

  const addMessage = (role: 'ins' | 'user', content: string) =>
    setMessages((prev) => [...prev, { id: `${role}-${Date.now()}`, role, content }]);

  // Start an INS conversation for the given category, optionally sending a first user message
  const startConversation = useCallback(async (category: string, firstMessage?: string) => {
    setPhase('chatting');
    setIsTyping(true);
    setProgress(5);

    try {
      const data = await insService.startConversation(category, 'client');
      const convId = data.conversation.id;
      setConversationId(convId);
      setProgress(10);
      addMessage('ins', data.greeting);

      if (firstMessage) {
        addMessage('user', firstMessage);
        const response = await insService.sendMessage(convId, firstMessage);
        setIsTyping(false);
        setProgress((p) => Math.min(p + 12, 90));
        addMessage('ins', response.message.content);

        if (response.isComplete) {
          setProgress(100);
          setPhase('complete');
          setTimeout(async () => {
            try { await insService.submitConversation(convId); } catch { /* proceed */ }
            closeINS();
          }, 1500);
        }
      } else {
        setIsTyping(false);
      }
    } catch {
      setIsTyping(false);
      addMessage('ins', "I'm sorry, I'm having trouble connecting right now. Please try again.");
    }
  }, [closeINS]);

  const handleChipClick = (chip: typeof CHIP_ACTIONS[number]) => {
    if (chip.type === 'navigation') {
      closeINS();
      navigate(chip.route);
      return;
    }
    startConversation(chip.category);
  };

  const handleSend = useCallback(async () => {
    if (!input.trim() || isTyping || phase === 'complete') return;

    const content = input.trim();
    setInput('');

    // If no conversation started yet, start one with the typed text
    if (!conversationId) {
      startConversation('', content);
      return;
    }

    addMessage('user', content);
    setIsTyping(true);

    try {
      const response = await insService.sendMessage(conversationId, content);
      setIsTyping(false);
      setProgress((p) => Math.min(p + 12, 90));
      addMessage('ins', response.message.content);

      if (response.isComplete) {
        setProgress(100);
        setPhase('complete');
        setTimeout(async () => {
          try { await insService.submitConversation(conversationId); } catch { /* proceed */ }
          closeINS();
        }, 1500);
      }
    } catch {
      setIsTyping(false);
      addMessage('ins', "Sorry, I had trouble processing that. Please try again.");
    }
  }, [input, conversationId, isTyping, phase, startConversation, closeINS]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Swipe down to close (only when scrolled to top)
  const handleTouchStart = (e: React.TouchEvent) => {
    const el = scrollRef.current;
    if (el && el.scrollTop === 0) startYRef.current = e.touches[0].clientY;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (startYRef.current > 0) currentYRef.current = e.touches[0].clientY;
  };
  const handleTouchEnd = () => {
    if (currentYRef.current - startYRef.current > 100) closeINS();
    startYRef.current = 0;
    currentYRef.current = 0;
  };

  const getCurrentContext = () => {
    const path = location.pathname;
    if (path === '/') return 'Home';
    if (path.startsWith('/my-requests')) return 'My Requests';
    if (path.startsWith('/my-jobs')) return 'My Jobs';
    if (path.startsWith('/messages')) return 'Messages';
    if (path.startsWith('/profile')) return 'Profile';
    return 'I Need Someone';
  };

  return (
    <AnimatePresence>
      {isINSOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center"
          onClick={closeINS}
        >
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="bg-white w-full md:max-w-2xl md:rounded-3xl rounded-t-3xl max-h-[85vh] md:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            ref={modalRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Swipe Indicator (Mobile Only) */}
            <div className="md:hidden flex justify-center pt-2 pb-1">
              <div className="w-12 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--brand-orange)] flex items-center justify-center">
                  <span className="text-sm font-bold text-white">INS</span>
                </div>
                <div>
                  <h2 className="font-semibold">INS Assistant</h2>
                  <p className="text-xs text-gray-600">You're on: {getCurrentContext()}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={closeINS} className="min-w-[44px] min-h-[44px]">
                <X className="size-5" />
              </Button>
            </div>

            {/* Progress bar — only visible when a conversation is active */}
            {phase !== 'idle' && (
              <div className="px-4 py-2 border-b bg-gray-50 shrink-0">
                <Progress value={progress} className="h-1.5" />
              </div>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="w-full grid grid-cols-2 h-12 rounded-none border-b shrink-0">
                <TabsTrigger value="chat" className="min-h-[44px]">Chat</TabsTrigger>
                <TabsTrigger value="history" className="min-h-[44px]">History</TabsTrigger>
              </TabsList>

              {/* Chat Tab */}
              <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden mt-0">
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Idle state: show action chips */}
                  {phase === 'idle' && (
                    <div className="text-center py-8">
                      <p className="text-gray-600 mb-4">What can I help you with?</p>
                      <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
                        {CHIP_ACTIONS.map((chip) => (
                          <button
                            key={chip.label}
                            onClick={() => handleChipClick(chip)}
                            className="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-sm transition-colors min-h-[44px]"
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Conversation messages */}
                  {phase !== 'idle' && messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-[var(--brand-orange)] text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-900 rounded-bl-md'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}

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
                <div className="border-t p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-3 bg-white shrink-0">
                  <div className="flex items-end gap-2">
                    <Button variant="outline" size="icon" className="min-w-[44px] min-h-[44px] flex-shrink-0">
                      <Paperclip className="size-5" />
                    </Button>
                    <Button variant="outline" size="icon" className="min-w-[44px] min-h-[44px] flex-shrink-0">
                      <Mic className="size-5" />
                    </Button>
                    <Textarea
                      placeholder={phase === 'idle' ? 'Or ask INS anything...' : 'Type your message...'}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="flex-1 min-h-[44px] max-h-32 resize-none"
                      rows={1}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!input.trim() || isTyping || phase === 'complete'}
                      size="icon"
                      className="rounded-full flex-shrink-0 min-w-[44px] min-h-[44px] bg-primary hover:bg-[#4A6BE8]"
                    >
                      <Send className="size-5" />
                    </Button>
                  </div>

                  {/* Back to menu */}
                  {phase !== 'idle' && (
                    <button
                      onClick={() => {
                        setPhase('idle');
                        setMessages([]);
                        setConversationId(null);
                        setProgress(0);
                        setInput('');
                      }}
                      className="w-full text-xs text-gray-500 hover:text-gray-700 py-1"
                    >
                      ← Back to menu
                    </button>
                  )}

                  <p className="text-xs text-gray-500 text-center">
                    For safety, keep contact info inside the app
                  </p>
                </div>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="flex-1 overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-3 mt-0">
                {historyLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="flex gap-1">
                      {[0, 150, 300].map((delay) => (
                        <div
                          key={delay}
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${delay}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <History className="size-10 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No conversations yet</p>
                  </div>
                ) : (
                  history.map((conv) => (
                    <Card key={conv.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4 flex items-start gap-3 min-h-[60px]">
                        <History className="size-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate capitalize">{conv.category || 'General'}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(conv.lastInteractionAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`text-xs capitalize px-2 py-0.5 rounded-full ${
                            conv.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : conv.status === 'active'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {conv.status}
                        </span>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
