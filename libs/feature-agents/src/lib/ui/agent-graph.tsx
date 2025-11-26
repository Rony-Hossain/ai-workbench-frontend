import React from 'react';
import { useWorkbenchStore } from '@ai-workbench/state-workbench';
import { cn } from '@ai-workbench/shared/utils';
import {
  CheckCircle2,
  AlertCircle,
  Loader,
  GitBranch,
  Share2,
} from 'lucide-react';
import type {
  AgentNodeStatus,
  EdgeStatus,
} from '@ai-workbench/bounded-contexts';

const statusIcon = (status: AgentNodeStatus) => {
  switch (status) {
    case 'running':
      return <Loader className="w-3 h-3 animate-spin text-blue-400" />;
    case 'success':
      return <CheckCircle2 className="w-3 h-3 text-emerald-400" />;
    case 'error':
      return <AlertCircle className="w-3 h-3 text-red-400" />;
    case 'pending':
    default:
      return <GitBranch className="w-3 h-3 text-neutral-500" />;
  }
};

const edgeColor = (status: EdgeStatus) => {
  switch (status) {
    case 'running':
      return 'stroke-blue-500';
    case 'blocked':
      return 'stroke-yellow-500';
    case 'success':
      return 'stroke-emerald-500';
    case 'idle':
    default:
      return 'stroke-neutral-700';
  }
};

export const AgentGraph: React.FC = () => {
  // We use the store data we defined in Phase 2
  const nodes = useWorkbenchStore((s) => s.workflowNodes);
  const edges = useWorkbenchStore((s) => s.workflowEdges);

  // Simple horizontal layout calculation
  const nodePositions = nodes.reduce((acc, node, index) => {
    acc[node.id] = { x: index * 140 + 70, y: 50 };
    return acc;
  }, {} as Record<string, { x: number; y: number }>);

  return (
    <div className="p-4 border-b border-neutral-800 bg-neutral-950/50">
      <div className="flex items-center gap-2 mb-3">
        <Share2 className="w-4 h-4 text-neutral-400" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Agent Workflow
        </h3>
      </div>
      <div className="relative h-28">
        <svg className="absolute top-0 left-0 w-full h-full" overflow="visible">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="0"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
            </marker>
          </defs>
          {edges.map((edge) => {
            const sourcePos = nodePositions[edge.source];
            const targetPos = nodePositions[edge.target];
            if (!sourcePos || !targetPos) return null;
            return (
              <line
                key={`${edge.source}-${edge.target}`}
                x1={sourcePos.x + 40}
                y1={sourcePos.y}
                x2={targetPos.x - 40}
                y2={targetPos.y}
                className={cn(
                  'stroke-2 transition-colors',
                  edgeColor(edge.status)
                )}
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />
            );
          })}
        </svg>

        {nodes.map((node) => {
          const pos = nodePositions[node.id];
          return (
            <div
              key={node.id}
              className="absolute flex flex-col items-center"
              style={{
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="flex items-center gap-2 bg-neutral-800 border border-neutral-700 rounded-full px-3 py-1.5 text-xs shadow-sm z-10">
                {statusIcon(node.status)}
                <span className="text-neutral-200">{node.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
