import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, Loader2, Bot, User, Terminal as TerminalIcon, Send } from 'lucide-react';
import { Button } from '@ai-workbench/shared/ui';
import { cn } from '@ai-workbench/shared/utils';
import { useWorkbenchStore } from '@ai-workbench/state-workbench';
import { agentService } from '@ai-workbench/feature-agents'; 
import type { ChatMessage } from '@ai-workbench/bounded-contexts';
import { MarkdownRenderer } from './artifacts/markdown-renderer';

export const ChatPane: React.FC = () => {
  const messages = useWorkbenchStore(s => s.chatMessages);
  const isStreaming = useWorkbenchStore(s => s.isStreaming);
  const addMessage = useWorkbenchStore(s => s.addChatMessage);

  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    
    // 1. Add User Message
    addMessage({
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmed,
        timestamp: Date.now()
    });
    
    setInput('');

    // 2. Pass to Service (Fire and Forget)
    agentService.processMessage(trimmed);
  };

  return (
    // ... (KEEP THE JSX EXACTLY THE SAME AS BEFORE) ...
    <div className="flex flex-col h-full bg-neutral-900/30">
      <div className="h-10 border-b border-neutral-800 flex items-center justify-between px-4 bg-neutral-900/80">
        <span className="text-xs font-semibold flex items-center gap-2 text-neutral-300">
          <MessageSquare className="w-4 h-4 text-primary" />
          Mission Control
        </span>
        {isStreaming && (
          <span className="text-[10px] text-blue-400 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            PROCESSING
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {messages.map((msg) => (
          <ChatMessageBubble key={msg.id} message={msg} />
        ))}
        {isStreaming && (
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded bg-emerald-900/30 text-emerald-500 flex items-center justify-center mt-0.5 animate-pulse">
              <Bot className="w-3 h-3" />
            </div>
            <div className="text-xs py-1.5 px-3 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-400">
              Thinking...
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

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
            disabled={!input.trim() || isStreaming}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// (Keep ChatMessageBubble component below)
const ChatMessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const { role, content } = message;
  const isUser = role === 'user';
  const isAssistant = role === 'assistant';

  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : '')}>
      {/* Avatar (Unchanged) */}
      <div className={cn(
          'w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5',
          isAssistant ? 'bg-emerald-900/30 text-emerald-500' : 
          isUser ? 'bg-blue-900/30 text-blue-500' : 'bg-neutral-800 text-neutral-500'
        )}>
        {isAssistant ? <Bot className="w-3 h-3" /> : isUser ? <User className="w-3 h-3" /> : <TerminalIcon className="w-3 h-3" />}
      </div>

      {/* Content Bubble */}
      <div className={cn(
          'text-xs py-2 px-3 rounded-md max-w-[85%]',
          isUser 
            ? 'bg-blue-500/10 text-blue-100 border border-blue-500/20' 
            : 'bg-neutral-900 border border-neutral-800 text-neutral-300'
        )}>
        
        {/* USE RENDERER HERE */}
        <MarkdownRenderer content={content} />

      </div>
    </div>
  );
};