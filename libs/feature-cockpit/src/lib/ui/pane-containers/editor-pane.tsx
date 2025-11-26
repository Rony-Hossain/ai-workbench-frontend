import React from 'react';
import { MonacoWrapper, useEditorStore } from '@ai-workbench/feature-editor';
import { cn } from '@ai-workbench/shared/utils';
import { X } from 'lucide-react';

export const EditorPaneContainer: React.FC = () => {
  const { openTabs, activeTab, setActiveTab, closeFile } = useEditorStore();

  return (
    <div className="h-full flex flex-col">
      {/* Tab Strip */}
      <div className="flex bg-neutral-900 border-b border-neutral-800 overflow-x-auto no-scrollbar">
        {openTabs.map((path) => (
          <div
            key={path}
            onClick={() => setActiveTab(path)}
            className={cn(
              "group flex items-center gap-2 px-3 py-2 text-xs border-r border-neutral-800 cursor-pointer min-w-[120px] max-w-[200px]",
              activeTab === path 
                ? "bg-neutral-950 text-primary border-t-2 border-t-primary" 
                : "text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300 border-t-2 border-t-transparent"
            )}
          >
            <span className="truncate flex-1">{path.split('/').pop()}</span>
            <button 
              onClick={(e) => { e.stopPropagation(); closeFile(path); }}
              className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-0.5 rounded"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      
      {/* Editor Surface */}
      <div className="flex-1 overflow-hidden">
        <MonacoWrapper />
      </div>
    </div>
  );
};