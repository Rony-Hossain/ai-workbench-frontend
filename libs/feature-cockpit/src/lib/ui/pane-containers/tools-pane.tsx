import React, { useState } from 'react';
import { TerminalView } from '@ai-workbench/feature-terminal';
import { WorkflowMiniMap } from '../workflow-minimap';
import { cn } from '@ai-workbench/shared/utils';
import { TerminalSquare, GitMerge, AlertCircle } from 'lucide-react';

type ToolTab = 'terminal' | 'workflow' | 'problems';

export const ToolsPaneContainer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ToolTab>('terminal');

  const tabs = [
    { id: 'terminal', label: 'Terminal', icon: TerminalSquare },
    { id: 'workflow', label: 'Workflow', icon: GitMerge },
    { id: 'problems', label: 'Problems', icon: AlertCircle },
  ];

  return (
    <div className="h-full flex flex-col bg-neutral-950">
      {/* 1. The Tab Strip Header */}
      <div className="h-9 border-b border-neutral-800 flex items-center px-2 bg-neutral-900/90">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ToolTab)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-t-sm border-b-2 transition-colors",
              activeTab === tab.id
                ? "text-primary border-primary bg-neutral-800/50"
                : "text-neutral-500 border-transparent hover:text-neutral-300 hover:bg-neutral-800/30"
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 2. The Content Area */}
      <div className="flex-1 overflow-hidden relative">
        
        {/* Terminal View */}
        <div className={cn("h-full w-full", activeTab === 'terminal' ? 'block' : 'hidden')}>
          <TerminalView />
        </div>

        {/* Workflow View (Now has full space) */}
        {activeTab === 'workflow' && (
          <div className="h-full w-full p-4 overflow-auto bg-neutral-950">
            <div className="max-w-3xl mx-auto">
              <WorkflowMiniMap />
              
              {/* Extra context for the workflow tab */}
              <div className="mt-4 p-4 border border-neutral-800 rounded bg-neutral-900/50 text-xs text-neutral-400">
                <h4 className="text-primary font-bold mb-2">Active Pipeline Status</h4>
                <p>The agent graph is currently idle. Trigger a new task from the Chat panel to see the workflow activate.</p>
              </div>
            </div>
          </div>
        )}

        {/* Problems View (Placeholder) */}
        {activeTab === 'problems' && (
          <div className="h-full w-full flex items-center justify-center text-neutral-600 text-xs">
            No problems detected in workspace.
          </div>
        )}
      </div>
    </div>
  );
};