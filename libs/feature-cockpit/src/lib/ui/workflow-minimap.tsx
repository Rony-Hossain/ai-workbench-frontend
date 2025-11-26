import React from 'react';
// 🛑 CRITICAL: This import must be present!
import { useWorkbenchStore } from '@ai-workbench/state-workbench';
import { cn } from '@ai-workbench/shared/utils';

export const WorkflowMiniMap: React.FC = () => {
  // Defensive coding: Handle potential undefined state during hot-reload
  const nodes = useWorkbenchStore((s) => s.workflowNodes) || [];
  const statuses = useWorkbenchStore((s) => s.agentStatuses) || {};

  if (nodes.length === 0) return null;

  return (
    <div className="w-full border border-neutral-800 bg-neutral-900 rounded-md p-4 text-[10px] text-neutral-400 shadow-sm">
      <div className="mb-3 text-[10px] uppercase tracking-wide text-neutral-500 font-bold flex items-center gap-2">
        <span>Graph Visualization</span>
        <span className="h-px flex-1 bg-neutral-800"></span>
      </div>
      
      <div className="flex gap-4 items-center justify-center overflow-x-auto py-2">
        {nodes.map((node, index) => (
          <React.Fragment key={node.id}>
             <div className={cn(
                'flex flex-col items-center justify-center text-center gap-1 px-4 py-2 rounded-md border min-w-[100px] transition-all duration-300',
                node.kind === 'permission' && 'border-yellow-500/40 bg-yellow-900/10 text-yellow-200',
                node.kind === 'user' && 'border-neutral-700 bg-neutral-900/60 text-neutral-300',
                (node.kind === 'planner' || node.kind === 'lead_engineer' || node.kind === 'reviewer') && statuses[node.kind]?.state === 'thinking' &&
                  'shadow-neon-primary border-primary text-white' 
             )}>
               <span className="font-medium text-xs">{node.label}</span>
               {statuses[node.kind] && (
                 <span className="text-[9px] opacity-70 uppercase tracking-wider">
                   {statuses[node.kind].state}
                 </span>
               )}
             </div>

             {index < nodes.length - 1 && (
                <div className="text-neutral-700">→</div>
             )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};