import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router';
import { X, Mic, Send, History, Image, Paperclip } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Card, CardContent } from '@/app/components/ui/card';
import { motion, AnimatePresence } from 'motion/react';
import { useINS } from '@/app/context/INSContext';

type INSState = 'idle' | 'listening' | 'thinking' | 'confirming';

export default function INSModal() {
  const { isINSOpen, closeINS } = useINS();
  const location = useLocation();
  const [insState, setInsState] = useState<INSState>('idle');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const modalRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const currentYRef = useRef<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      closeINS();
    }
    startYRef.current = 0;
    currentYRef.current = 0;
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isINSOpen) {
      setInsState('idle');
      setActiveTab('chat');
      // Don't clear message to preserve context
    }
  }, [isINSOpen]);

  const handleSend = () => {
    if (!message.trim()) return;
    setInsState('thinking');
    setTimeout(() => {
      setInsState('idle');
      setMessage('');
    }, 1500);
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

  const mockHistory = [
    {
      date: 'Today',
      items: [
        { title: 'Find a plumber near me', time: '2h ago', type: 'service' },
        { title: 'Post web developer job', time: '3h ago', type: 'job' },
      ],
    },
    {
      date: 'This Week',
      items: [
        { title: 'Create logo design project', time: 'Monday', type: 'project' },
        { title: 'Find local painter', time: 'Sunday', type: 'service' },
      ],
    },
  ];

  const actionChips = [
    'Find local services',
    'Post a job',
    'Create a project',
    'Check my requests',
    'View earnings',
  ];

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

            {/* Header - Sticky */}
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

            {/* Tabs - Scrollable Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="w-full grid grid-cols-2 h-12 rounded-none border-b shrink-0">
                <TabsTrigger value="chat" className="min-h-[44px]">Chat</TabsTrigger>
                <TabsTrigger value="history" className="min-h-[44px]">History</TabsTrigger>
              </TabsList>

              {/* Chat Tab */}
              <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden mt-0">
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                  {insState === 'idle' && (
                    <div className="space-y-4">
                      <div className="text-center py-8">
                        <p className="text-gray-600 mb-4">Ask INS anything...</p>
                        <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
                          {actionChips.map((chip) => (
                            <button
                              key={chip}
                              onClick={() => setMessage(chip)}
                              className="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-sm transition-colors min-h-[44px]"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {insState === 'listening' && (
                    <div className="flex flex-col items-center justify-center py-12">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="w-20 h-20 rounded-full bg-[#5B7CFA] flex items-center justify-center mb-4"
                      >
                        <Mic className="size-8 text-white" />
                      </motion.div>
                      <p className="text-lg font-medium">Listening...</p>
                      <div className="flex gap-1 mt-4">
                        {[...Array(5)].map((_, i) => (
                          <motion.div
                            key={i}
                            animate={{ height: [12, 24, 12] }}
                            transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }}
                            className="w-2 bg-[#5B7CFA] rounded-full"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {insState === 'thinking' && (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="flex gap-2 mb-4">
                        <motion.div
                          animate={{ y: [0, -10, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                          className="w-3 h-3 bg-[#5B7CFA] rounded-full"
                        />
                        <motion.div
                          animate={{ y: [0, -10, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                          className="w-3 h-3 bg-[#5B7CFA] rounded-full"
                        />
                        <motion.div
                          animate={{ y: [0, -10, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                          className="w-3 h-3 bg-[#5B7CFA] rounded-full"
                        />
                      </div>
                      <p className="text-lg font-medium">Working on it...</p>
                    </div>
                  )}
                </div>

                {/* Input Area - Sticky with safe area padding */}
                <div className="border-t p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-3 bg-white shrink-0">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setInsState(insState === 'listening' ? 'idle' : 'listening')}
                      className={`min-w-[44px] min-h-[44px] ${insState === 'listening' ? 'bg-red-50 border-red-300' : ''}`}
                    >
                      <Mic className={`size-5 ${insState === 'listening' ? 'text-red-600' : ''}`} />
                    </Button>
                    <Button variant="outline" size="icon" className="min-w-[44px] min-h-[44px]">
                      <Image className="size-5" />
                    </Button>
                    <Button variant="outline" size="icon" className="min-w-[44px] min-h-[44px]">
                      <Paperclip className="size-5" />
                    </Button>
                    <Input
                      placeholder="Type your message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      className="flex-1 min-h-[44px]"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!message.trim()}
                      className="bg-primary hover:bg-[#4A6BE8] min-w-[44px] min-h-[44px]"
                    >
                      <Send className="size-5" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    For safety, keep contact info inside the app
                  </p>
                </div>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="flex-1 overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-6 mt-0">
                {mockHistory.map((group) => (
                  <div key={group.date} className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-500">{group.date}</h3>
                    <div className="space-y-2">
                      {group.items.map((item, index) => (
                        <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardContent className="p-4 flex items-start gap-3 min-h-[60px]">
                            <History className="size-5 text-gray-400 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{item.title}</p>
                              <p className="text-xs text-gray-500">{item.time}</p>
                            </div>
                            <span className="text-xs text-gray-400 capitalize">{item.type}</span>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}