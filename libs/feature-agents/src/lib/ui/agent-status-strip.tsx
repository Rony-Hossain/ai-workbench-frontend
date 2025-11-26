import React from 'react';
import { Circle } from 'lucide-react';
import { useWorkbenchStore } from '@ai-workbench/state-workbench';
import { cn } from '@ai-workbench/shared/utils';

export const AgentStatusStrip: React.FC = () => {
  const statuses = useWorkbenchStore((s) => s.agentStatuses);
  // We iterate over the keys present in the store
  const agentKeys = Object.keys(statuses);

  return (
    <div className="h-7 border-b border-neutral-800 bg-neutral-900/80 flex items-center px-3 gap-4 text-[11px]">
      {agentKeys.map((key) => {
        const st = statuses[key];
        return (
          <div key={key} className="flex items-center gap-1.5 text-neutral-400">
            <Circle
              className={cn(
                'w-2.5 h-2.5',
                st.state === 'idle' && 'text-neutral-600',
                st.state === 'thinking' && 'text-blue-400 animate-pulse shadow-neon-primary', // Added Neon!
                st.state === 'blocked' && 'text-yellow-400',
                st.state === 'done' && 'text-emerald-400',
              )}
              fill="currentColor"
            />
            <span className="text-[11px] font-medium">{st.label}</span>
            <span className="text-[10px] text-neutral-500 uppercase">{st.state}</span>
          </div>
        );
      })}
    </div>
  );
};