import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, Loader2, Bot, User, Terminal as TerminalIcon, Send } from 'lucide-react';
import { Button } from '@ai-workbench/shared/ui';
import { cn } from '@ai-workbench/shared/utils';
import { useWorkbenchStore } from '@ai-workbench/state-workbench';
import type { ChatMessage } from '@ai-workbench/bounded-contexts';
import { MarkdownRenderer } from './artifacts/markdown-renderer';
import { trpc } from '@ai-workbench/shared/client-api';

export const ChatPane: React.FC = () => {
  const conversationId = 'default-session'; 

  // 1. DATA: Poll for updates
  const { data: dbMessages, refetch } = trpc.getHistory.useQuery(
    { conversationId },
    { 
      refetchInterval: 1000, 
      refetchIntervalInBackground: true
    }
  );

  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);
  // FIX: Use a ref to lock submission, preventing double-enters
  const isSubmittingRef = useRef(false);

  const messages = (dbMessages || []) as ChatMessage[];
  const isStreaming = useWorkbenchStore(s => s.isStreaming);
  
  const lastMsg = messages[messages.length - 1];
  const isThinking = lastMsg?.role === 'user' || (lastMsg?.role === 'assistant' && !lastMsg.content);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, lastMsg?.content]);

  const sendMessage = trpc.sendMessage.useMutation({
    onSuccess: () => {
      refetch();
    }
  });

  const handleSubmit = async () => {
    // 1. Validation & Locking
    const trimmed = input.trim();
    if (!trimmed || isSubmittingRef.current) return;

    // 2. Lock
    isSubmittingRef.current = true;
    setInput(''); // Clear UI immediately

    try {
      await sendMessage.mutateAsync({
        conversationId,
        role: 'user',
        content: trimmed
      });
    } finally {
      // 3. Unlock after a short delay to prevent bounce
      setTimeout(() => {
        isSubmittingRef.current = false;
      }, 500);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900/30">
      {/* HEADER */}
      <div className="h-10 border-b border-neutral-800 flex items-center justify-between px-4 bg-neutral-900/80">
        <span className="text-xs font-semibold flex items-center gap-2 text-neutral-300">
          <MessageSquare className="w-4 h-4 text-primary" />
          Mission Control
        </span>
        <div className={cn("w-2 h-2 rounded-full transition-colors", isThinking ? "bg-green-500 animate-pulse" : "bg-neutral-800")} />
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {messages.map((msg, i) => (
          // Use ID if available, otherwise fallback to composite key
          <ChatMessageBubble key={msg.id || `${msg.role}-${msg.timestamp}-${i}`} message={msg} />
        ))}

        {isThinking && (
           <div className="flex gap-3 animate-in fade-in duration-300">
             <div className="w-6 h-6 rounded bg-emerald-900/30 text-emerald-500 flex items-center justify-center mt-0.5">
               <Bot className="w-3 h-3 animate-bounce" />
             </div>
             <div className="text-xs py-1.5 px-3 text-neutral-500 italic">
               Agent is thinking...
             </div>
           </div>
        )}
        <div ref={endRef} />
      </div>

      {/* INPUT */}
      <div className="p-3 border-t border-neutral-800 bg-neutral-950">
        <div className="relative">
          <textarea
            className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 pr-10 text-xs focus:outline-none focus:border-neutral-600 resize-none h-20 text-neutral-200 font-mono"
            placeholder="Command the agents..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <Button
            variant="ghost"
            className={cn(
              'absolute right-2 bottom-2 p-1 h-8 w-8',
              input.trim() ? 'text-primary' : 'text-neutral-600'
            )}
            onClick={handleSubmit}
            disabled={!input.trim() || sendMessage.isLoading}
          >
             <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const ChatMessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const { role, content } = message;
  const isUser = role === 'user';
  const isAssistant = role === 'assistant';
  const isSystem = role === 'system';

  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : '')}>
      <div className={cn(
          'w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5',
          isAssistant ? 'bg-emerald-900/30 text-emerald-500' : 
          isUser ? 'bg-blue-900/30 text-blue-500' : 'bg-neutral-800 text-neutral-500'
        )}>
        {isAssistant ? <Bot className="w-3 h-3" /> : isUser ? <User className="w-3 h-3" /> : <TerminalIcon className="w-3 h-3" />}
      </div>

      <div className={cn(
          'text-xs py-2 px-3 rounded-md max-w-[85%]',
          isUser 
            ? 'bg-blue-500/10 text-blue-100 border border-blue-500/20' 
            : isSystem
            ? 'bg-red-900/20 text-red-200 border border-red-900/50 font-mono'
            : 'bg-neutral-900 border border-neutral-800 text-neutral-300'
        )}>
        <MarkdownRenderer content={content} />
      </div>
    </div>
  );
};