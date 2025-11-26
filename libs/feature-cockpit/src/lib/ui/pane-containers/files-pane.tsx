import React, { useEffect } from 'react';
import { FileTree, useFileTree } from '@ai-workbench/feature-files';
import { useEditorStore } from '@ai-workbench/feature-editor';
import { Loader2, FolderOpen, X, History, Code2 } from 'lucide-react';
// 1. Import Store & API
import {
  workspaceApi,
  useWorkspaceStore,
} from '@ai-workbench/feature-workspace';
import { Button, ScrollArea } from '@ai-workbench/shared/ui';

export const FilesPaneContainer: React.FC = () => {
  const openFile = useEditorStore((s) => s.openFile);
  const activeTab = useEditorStore((s) => s.activeTab);

  // 2. Connect to Global Persistence Store (instead of local useState)
  const activePath = useWorkspaceStore((s) => s.activePath);
  const recentPaths = useWorkspaceStore((s) => s.recentPaths);
  const openWorkspace = useWorkspaceStore((s) => s.openWorkspace);
  const closeWorkspace = useWorkspaceStore((s) => s.closeWorkspace);
  const removeRecent = useWorkspaceStore((s) => s.removeRecent);
  const init = useWorkspaceStore((s) => s.init);

  // 3. Load History from DB on Mount
  useEffect(() => {
    init();
  }, []);

  // 4. Fetch Data (Only if activePath exists)
  const { data, isLoading } = useFileTree(activePath || '');

  const handleOpenFolder = async () => {
    const path = await workspaceApi.openDirectory();
    if (path) {
      await openWorkspace(path); // This saves to DB automatically
    }
  };

  return (
    <div className="h-full flex flex-col bg-neutral-900/30">
      {/* Header */}
      <div className="h-9 flex items-center justify-between px-3 border-b border-neutral-800 bg-neutral-900/50">
        <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
          Explorer
        </span>
        <div className="flex gap-1">
          {activePath && (
            <button
              onClick={closeWorkspace}
              className="text-neutral-500 hover:text-red-400 p-1 rounded"
              title="Close Project"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={handleOpenFolder}
            className="text-neutral-500 hover:text-primary p-1 rounded"
            title="Open Project"
          >
            <FolderOpen className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {/* STATE: NO WORKSPACE */}
        {!activePath ? (
          <div className="h-full flex flex-col p-4">
            {/* Empty Hero */}
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center opacity-60">
              <div className="p-4 rounded-full bg-neutral-800 border border-neutral-700">
                <Code2 className="w-8 h-8 text-neutral-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-neutral-200">
                  No Workspace
                </h3>
                <p className="text-[10px] text-neutral-500 mt-1">
                  Open a directory to start coding.
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={handleOpenFolder}
                className="w-full"
              >
                Open Folder
              </Button>
            </div>

            {/* Recent Projects List (New Feature) */}
            {recentPaths.length > 0 && (
              <div className="mt-auto pt-4 border-t border-neutral-800">
                <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
                  <History className="w-3 h-3" /> Recent
                </div>
                <div className="space-y-1">
                  {recentPaths.map((path) => (
                    <div
                      key={path}
                      className="group flex items-center justify-between p-2 rounded hover:bg-neutral-800 cursor-pointer text-xs border border-transparent hover:border-neutral-700 transition-colors"
                      onClick={() => openWorkspace(path)}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-neutral-300 truncate">
                          {path.split('\\').pop()?.split('/').pop()}
                        </div>
                        <div className="text-[9px] text-neutral-600 truncate">
                          {path}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRecent(path);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-neutral-600 hover:text-red-400 p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* STATE: ACTIVE WORKSPACE */
          <div className="h-full flex flex-col">
            {/* Breadcrumb */}
            <div className="px-3 py-2 text-[10px] font-mono text-neutral-600 truncate border-b border-neutral-800/50 bg-neutral-950/30 select-all">
              {activePath}
            </div>

            <ScrollArea className="flex-1 py-2">
              {isLoading && (
                <div className="flex items-center justify-center py-8 text-neutral-500 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs">Scanning Files...</span>
                </div>
              )}

              {data && (
                <FileTree
                  data={data}
                  activePath={activeTab}
                  onNodeClick={(node) => {
                    if (node.type === 'file') openFile(node.path);
                  }}
                />
              )}
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
};
