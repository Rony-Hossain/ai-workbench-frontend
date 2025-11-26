import { ReactNode } from 'react';
import { Panel, PanelGroup } from 'react-resizable-panels';
import { Splitter } from '@ai-workbench/shared/ui';

interface CockpitLayoutProps {
  navRail: ReactNode;      // Pane A (Fixed width)
  sidebar: ReactNode;      // Pane B (Resizable)
  editor: ReactNode;       // Pane C-Top (Main)
  terminal: ReactNode;     // Pane C-Bottom (Collapsible)
  chat: ReactNode;         // Pane D (Right Sidebar)
}

export function CockpitLayout({
  navRail,
  sidebar,
  editor,
  terminal,
  chat,
}: CockpitLayoutProps) {
  return (
    <div className="flex h-full w-full bg-neutral-950 text-neutral-200 overflow-hidden font-sans">
      
      {/* 1. Navigation Rail (Fixed Left) */}
      <div className="flex-none w-14 border-r border-neutral-800/80 bg-neutral-900/90 backdrop-blur-sm shadow-glass z-header">
        {navRail}
      </div>

      {/* 2. Resizable Workspace */}
      <div className="flex-1 flex min-w-0 bg-gradient-to-br from-neutral-950 via-neutral-950 to-neutral-900">
        <PanelGroup
          direction="horizontal"
          autoSaveId="cockpit-horizontal-layout"
          className="h-full"
        >
          
          {/* Pane B: Sidebar (Files/Roster) */}
          <Panel
            defaultSize={20}
            minSize={10}
            maxSize={30}
            order={1}
            className="bg-neutral-900/90 border-r border-neutral-800/80 backdrop-blur-sm"
          >
            {sidebar}
          </Panel>
          
          <Splitter direction="horizontal" />

          {/* Center Zone (Editor + Terminal) */}
          <Panel order={2} minSize={30} className="bg-neutral-950/95">
            <PanelGroup
              direction="vertical"
              autoSaveId="cockpit-vertical-layout"
              className="h-full"
            >
              
              {/* Pane C-Top: Code Editor */}
              <Panel
                order={1}
                minSize={20}
                className="bg-neutral-950 border-b border-neutral-900/80"
              >
                {editor}
              </Panel>

              <Splitter direction="vertical" />

              {/* Pane C-Bottom: Terminal/Tools */}
              <Panel
                order={2}
                defaultSize={30}
                minSize={10}
                className="bg-neutral-950/95"
              >
                {terminal}
              </Panel>
              
            </PanelGroup>
          </Panel>

          <Splitter direction="horizontal" />

          {/* Pane D: Chat (Right) */}
          <Panel
            defaultSize={25}
            minSize={15}
            maxSize={40}
            order={3}
            className="bg-neutral-900/90 border-l border-neutral-800/80 backdrop-blur-sm"
          >
            {chat}
          </Panel>

        </PanelGroup>
      </div>
    </div>
  );
}
