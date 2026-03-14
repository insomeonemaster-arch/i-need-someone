import { useState } from 'react';
import { Mic, Send, Paperclip } from 'lucide-react';
import { Textarea } from '@/app/components/ui/textarea';
import { Button } from '@/app/components/ui/button';

interface INSInputBarProps {
  onSend: (message: string, attachments?: File[]) => void;
  placeholder?: string;
  showAttachment?: boolean;
  className?: string;
  disabled?: boolean;
}

export function INSInputBar({ 
  onSend, 
  placeholder = 'Type your message...', 
  showAttachment = true,
  className = '',
  disabled = false
}: INSInputBarProps) {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  const handleSend = () => {
    if (!input.trim() && attachments.length === 0) return;
    onSend(input, attachments);
    setInput('');
    setAttachments([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  return (
    <div className={`bg-white border-t p-3 ${className}`}>
      {/* Attachment Preview */}
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <div key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
              {file.name}
            </div>
          ))}
        </div>
      )}
      
      <div className="flex items-end gap-2">
        {showAttachment && (
          <label className="p-3 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer">
            <Paperclip className="size-5 text-gray-600" />
            <input 
              type="file" 
              className="hidden" 
              onChange={handleAttachment}
              multiple
              disabled={disabled}
            />
          </label>
        )}

        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="resize-none min-h-[44px] max-h-32"
          rows={1}
          disabled={disabled}
        />

        <button
          onClick={() => setIsRecording(!isRecording)}
          className={`p-3 rounded-full transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center ${
            isRecording ? 'bg-[var(--brand-orange)] text-white' : 'hover:bg-gray-100'
          }`}
          disabled={disabled}
          title="INS Voice Input"
        >
          <Mic className="size-5" />
        </button>

        <Button
          onClick={handleSend}
          disabled={(!input.trim() && attachments.length === 0) || disabled}
          size="icon"
          className="rounded-full flex-shrink-0 min-w-[44px] min-h-[44px] bg-[var(--brand-orange)] hover:bg-[var(--brand-orange)]/90"
        >
          <Send className="size-5" />
        </Button>
      </div>
    </div>
  );
}
