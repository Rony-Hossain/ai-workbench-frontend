import React, { useState } from 'react';
import { Bot, Plus, Settings2, Power } from 'lucide-react';
import { Button, ScrollArea } from '@ai-workbench/shared/ui';
import { cn } from '@ai-workbench/shared/utils';
import { trpc } from '@ai-workbench/shared/client-api';
import type { Agent } from '@ai-workbench/bounded-contexts';
// FIX: Import the Modal directly
import { AgentBuilderModal } from './agent-builder-modal';

export const AgentRosterList: React.FC = () => {
  // 1. Data Fetching
  const { data: dbAgents, isLoading } = trpc.agent.list.useQuery();
  const { data: providers } = trpc.provider.list.useQuery();

  // 2. Local State Management (Replaces Zustand)
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  // Helper: Open Modal in "Create" or "Edit" mode
  const openBuilder = (agent?: Agent) => {
    setSelectedAgent(agent || null);
    setIsBuilderOpen(true);
  };

  const getProviderName = (id: string) => {
    const p = providers?.find(prov => prov.id === id);
    return p?.label || p?.name || 'Unknown Node';
  };

  if (isLoading) return <div className="p-4 text-xs text-neutral-500">Loading roster...</div>;

  return (
    <div className="h-full flex flex-col bg-neutral-900/30 relative">
      {/* Header */}
      <div className="h-9 border-b border-neutral-800 flex items-center justify-between px-4 bg-neutral-900/50">
        <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
          Active Units ({dbAgents?.length || 0})
        </span>
        <button
          onClick={() => openBuilder()} // Create Mode
          className="text-neutral-500 hover:text-primary transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* List */}
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-2">
          {dbAgents?.map((agent) => (
            <div
              key={agent.id}
              className="group relative bg-neutral-900/40 border border-neutral-800/50 rounded-lg p-3 hover:bg-neutral-800/60 hover:border-neutral-700 transition-all"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="relative mt-0.5">
                  <div className={cn(
                    "w-9 h-9 rounded-md flex items-center justify-center border transition-colors",
                    agent.isActive ? "bg-neutral-800 border-neutral-700" : "bg-neutral-900 border-neutral-800 opacity-50"
                  )}>
                    <Bot className={cn("w-5 h-5", agent.isActive ? "text-primary" : "text-neutral-600")} />
                  </div>
                  {/* Simple Active Dot (No Zustand Runtime State) */}
                  {agent.isActive && (
                    <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-neutral-900 bg-neutral-600" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={cn("text-xs font-bold truncate", agent.isActive ? "text-neutral-200" : "text-neutral-500")}>
                      {agent.name}
                    </h4>
                    {/* Edit Button */}
                    <button 
                      onClick={() => openBuilder(agent)} // Edit Mode
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-700 rounded text-neutral-400 hover:text-white transition-all"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <div className="text-[10px] text-neutral-500 font-mono mt-0.5 flex items-center gap-2">
                    <span className="capitalize text-primary/80">{agent.role}</span>
                    <span className="w-0.5 h-2 bg-neutral-700 block"/>
                    <span className="truncate max-w-[80px]" title="Connected Provider">
                      {getProviderName(agent.modelId)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-neutral-800">
        <Button
          variant="outline"
          className="w-full gap-2 border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white"
          onClick={() => openBuilder()}
        >
          <Plus className="w-3 h-3" />
          Recruit Agent
        </Button>
      </div>

      {/* MODAL IS NOW RENDERED HERE, CONTROLLED BY LOCAL STATE */}
      {isBuilderOpen && (
        <AgentBuilderModal 
          isOpen={isBuilderOpen}
          onClose={() => setIsBuilderOpen(false)}
          agentToEdit={selectedAgent}
        />
      )}
    </div>
  );
};