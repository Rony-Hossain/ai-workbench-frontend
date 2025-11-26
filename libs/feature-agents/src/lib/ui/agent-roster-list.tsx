import React, { useMemo } from 'react'; // Import useMemo
import { Bot, Plus, MoreVertical, Circle } from 'lucide-react';
import { useWorkbenchStore } from '@ai-workbench/state-workbench';
import { Button, ScrollArea } from '@ai-workbench/shared/ui';
import { cn } from '@ai-workbench/shared/utils';
import { useAgentBuilderStore } from '../store/agent-builder.store'; // <--- Import

export const AgentRosterList: React.FC = () => {
  // FIX: Select the stable object, NOT the result of Object.values()
  const agentStatuses = useWorkbenchStore((s) => s.agentStatuses);

  // Convert to array safely
  const agents = useMemo(() => Object.values(agentStatuses), [agentStatuses]);
  const openBuilder = useAgentBuilderStore((s) => s.openBuilder);

  return (
    <div className="h-full flex flex-col bg-neutral-900/30">
      {/* ... Header ... */}
      <div className="h-9 border-b border-neutral-800 flex items-center justify-between px-4 bg-neutral-900/50">
        <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
          Staff Roster
        </span>
        <button
          onClick={openBuilder}
          className="text-neutral-500 hover:text-primary transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* List */}
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1">
          {agents.map((agent) => (
            <div
              key={agent.agentId}
              className="group flex items-center gap-3 px-3 py-2 rounded-md hover:bg-neutral-800/50 cursor-pointer border border-transparent hover:border-neutral-800 transition-all"
            >
              {/* Avatar */}
              <div className="relative">
                <div className="w-8 h-8 rounded bg-neutral-800 flex items-center justify-center border border-neutral-700 group-hover:border-primary/50 transition-colors">
                  <Bot className="w-4 h-4 text-neutral-400 group-hover:text-primary" />
                </div>
                {/* Status Dot */}
                <div
                  className={cn(
                    'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-neutral-900',
                    agent.state === 'thinking'
                      ? 'bg-blue-500 animate-pulse shadow-neon-primary'
                      : agent.state === 'done'
                      ? 'bg-emerald-500'
                      : agent.state === 'blocked'
                      ? 'bg-yellow-500'
                      : 'bg-neutral-600'
                  )}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-neutral-200 truncate">
                  {agent.label}
                </div>
                <div className="text-[10px] text-neutral-500 truncate capitalize">
                  {agent.kind.replace('_', ' ')}
                </div>
              </div>

              {/* Menu */}
              <button className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-neutral-300">
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer Action */}
      <div className="p-3 border-t border-neutral-800">
        <Button
          variant="secondary"
          className="w-full gap-2"
          onClick={openBuilder}
        >
          <Plus className="w-3 h-3" />
          Recruit Agent
        </Button>
      </div>
    </div>
  );
};
