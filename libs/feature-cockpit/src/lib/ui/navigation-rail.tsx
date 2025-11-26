import React from 'react';
import { LayoutGrid, Files, Users, GitBranch, Settings } from 'lucide-react';
import { cn } from '@ai-workbench/shared/utils';
import { useCockpitLayoutStore } from '../store/cockpit-layout.store';
// IMPORT THE STORE
import { useSettingsModalStore } from '@ai-workbench/feature-settings'; 

export const NavigationRail: React.FC = () => {
  const activeView = useCockpitLayoutStore((s) => s.activeSidebarView);
  const setView = useCockpitLayoutStore((s) => s.setActiveSidebarView);
  const openSettings = useSettingsModalStore((s) => s.openSettings); // <--- HOOK

  const items = [
    { id: 'files', icon: Files },
    { id: 'agents', icon: Users },
    { id: 'workflow', icon: GitBranch },
    // We treat settings differently (it's a modal, not a sidebar view)
    { id: 'settings', icon: Settings, action: openSettings }, 
  ];

  return (
    <div className="h-full flex flex-col items-center py-4 gap-4 bg-neutral-900 border-r border-neutral-800">
      <div className="w-8 h-8 rounded bg-primary/10 border border-primary text-primary flex items-center justify-center mb-4 shadow-neon-primary">
        <LayoutGrid className="w-4 h-4" />
      </div>
      
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => {
             // If it has a custom action, run it. Otherwise switch view.
             if (item.action) item.action();
             else setView(item.id as any);
          }}
          className={cn(
            "w-8 h-8 rounded flex items-center justify-center transition-all duration-200 relative",
            !item.action && activeView === item.id 
              ? "bg-neutral-800 text-white shadow-lg" 
              : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50"
          )}
        >
          <item.icon className="w-4 h-4" />
          {!item.action && activeView === item.id && (
            <div className="absolute -left-[2px] top-2 bottom-2 w-[2px] bg-primary rounded-r-full" />
          )}
        </button>
      ))}
    </div>
  );
};