import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    // FIX: Apply styling to this wrapper div, NOT ReactMarkdown itself
    <div className="prose prose-invert prose-sm max-w-none text-xs">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            
            if (inline) {
              return (
                <code className="bg-neutral-800 text-primary px-1 py-0.5 rounded font-mono text-[10px]" {...props}>
                  {children}
                </code>
              );
            }

            return match ? (
              <div className="relative group rounded-md overflow-hidden border border-neutral-800 my-2 shadow-sm">
                <div className="absolute top-0 right-0 px-2 py-1 text-[9px] font-bold text-neutral-500 bg-neutral-900/80 uppercase rounded-bl-md">
                  {match[1]}
                </div>
                
                <SyntaxHighlighter
                  {...props}
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    padding: '1rem',
                    background: '#0a0a0a',
                    fontSize: '11px',
                    lineHeight: '1.5',
                  }}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code className="bg-neutral-800/50 p-1 rounded block my-1 whitespace-pre-wrap" {...props}>
                {children}
              </code>
            );
          },
          p: ({children}) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
          ul: ({children}) => <ul className="list-disc ml-4 mb-2 space-y-1 text-neutral-300">{children}</ul>,
          ol: ({children}) => <ol className="list-decimal ml-4 mb-2 space-y-1 text-neutral-300">{children}</ol>,
          a: ({href, children}) => <a href={href} target="_blank" rel="noreferrer" className="text-primary underline hover:text-primary/80">{children}</a>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};