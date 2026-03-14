import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { X, Mic, Paperclip, Send, ChevronDown } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Progress } from '@/app/components/ui/progress';
import { motion, AnimatePresence } from 'motion/react';

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

// Question sets for different categories and modes
const questionSets = {
  'local-services-client': [
    'What type of service do you need?',
    'Can you describe what needs to be done?',
    'Where is the service needed?',
    'When do you need this done?',
    'What\'s your budget for this service?',
  ],
  'local-services-provider': [
    'What services do you offer?',
    'What\'s your business or professional name?',
    'How many years of experience do you have?',
    'What\'s your hourly rate?',
    'How far are you willing to travel for jobs?',
  ],
  'jobs-client': [
    'What position are you hiring for?',
    'What\'s your company name?',
    'Where is this position located?',
    'Is this full-time, part-time, or contract?',
    'What\'s the salary range?',
    'What are the key responsibilities?',
  ],
  'jobs-provider': [
    'What type of job are you looking for?',
    'What\'s your professional title?',
    'What\'s your experience level?',
    'What location are you interested in?',
    'What\'s your expected salary range?',
  ],
  'projects-client': [
    'What type of project do you need help with?',
    'Can you describe the project in detail?',
    'What skills are required?',
    'What\'s your budget range?',
    'When do you need this completed?',
    'What are the expected deliverables?',
  ],
  'projects-provider': [
    'What\'s your professional title?',
    'What services do you offer?',
    'How many years of experience do you have?',
    'What\'s your hourly rate?',
    'Do you have a portfolio website?',
  ],
};

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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [collectedData, setCollectedData] = useState<any>({});
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const currentYRef = useRef<number>(0);

  const questionKey = `${category}-${mode}` as keyof typeof questionSets;
  const questions = useMemo(() => questionSets[questionKey] || [], [questionKey]);
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  const handleClose = useCallback(() => {
    setMessages([]);
    setCurrentQuestionIndex(0);
    setCollectedData({});
    setQuickActions([]);
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

  const getCategoryAction = useCallback((cat: string, md: string) => {
    if (md === 'client') {
      if (cat === 'local-services') return 'request a local service';
      if (cat === 'jobs') return 'post a job opening';
      if (cat === 'projects') return 'post your project';
    } else {
      if (cat === 'local-services') return 'set up your service profile';
      if (cat === 'jobs') return 'set up your job seeker profile';
      if (cat === 'projects') return 'set up your freelancer profile';
    }
    return 'get started';
  }, []);

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

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Initial greeting
      const greeting = mode === 'client' 
        ? `Hi! I'm INS, your AI assistant. I'll help you ${getCategoryAction(category, mode)}. Let's get started!`
        : `Hi! I'm INS, your AI assistant. I'll help you ${getCategoryAction(category, mode)}. Ready to get started?`;
      
      setTimeout(() => {
        addINSMessage(greeting);
        setTimeout(() => {
          if (questions[0]) {
            addINSMessage(questions[0]);
          }
        }, 800);
      }, 300);
    }
  }, [isOpen, messages.length, mode, category, getCategoryAction, addINSMessage, questions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const handleSend = () => {
    if (!input.trim()) return;

    addUserMessage(input);
    const userResponse = input;
    setInput('');
    setQuickActions([]);

    // Store the answer
    const fieldKey = `question_${currentQuestionIndex}`;
    setCollectedData((prev: any) => ({
      ...prev,
      [fieldKey]: userResponse,
    }));

    // Move to next question
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        addINSMessage(questions[nextIndex]);
      } else {
        // All questions answered
        addINSMessage("Perfect! I've collected all the information. Let me prepare a summary for you to review...");
        setTimeout(() => {
          onComplete({
            ...collectedData,
            [fieldKey]: userResponse,
            category,
            mode,
          });
          handleClose();
        }, 1500);
      }
    }, 600);
  };

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
                    {currentQuestionIndex + 1} of {questions.length} questions
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
                  disabled={!input.trim()}
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