import React from 'react';
import { CockpitLayout } from '@ai-workbench/shared/layout';
import { NavigationRail } from './navigation-rail';
import { FilesPaneContainer } from './pane-containers/files-pane';
import { EditorPaneContainer } from './pane-containers/editor-pane';
import { ChatPaneContainer } from './pane-containers/chat-pane';
import { ToolsPaneContainer } from './pane-containers/tools-pane';
import { useCockpitLayoutStore } from '../store/cockpit-layout.store';
import {
  AgentRosterList,
  AgentBuilderModal,
} from '@ai-workbench/feature-agents';

// NEW IMPORTS
import { useWorkbenchStore } from '@ai-workbench/state-workbench';
import { PermissionCard } from '@ai-workbench/feature-permissions';
import { SettingsModal } from '@ai-workbench/feature-settings'; // <--- 1. Import Settings

export const CockpitScreen: React.FC = () => {
  const activeView = useCockpitLayoutStore((s) => s.activeSidebarView);

  // 1. Listen for Permissions
  const currentPermission = useWorkbenchStore((s) => s.currentPermission);
  const resolvePermission = useWorkbenchStore(
    (s) => s.resolveCurrentPermission
  );

  return (
    <>
      {/* 1. Permission Overlay */}
      {currentPermission && (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-neutral-950/60 backdrop-blur-sm p-4">
          <PermissionCard
            request={currentPermission}
            onApprove={() => resolvePermission('approved')}
            onReject={() => resolvePermission('rejected')}
          />
        </div>
      )}

      {/* 2. Agent Builder Overlay */}
      <AgentBuilderModal />

      {/* 3. Settings Overlay (The missing piece) */}
      <SettingsModal /> 

      {/* 4. The Main Layout */}
      <CockpitLayout
        navRail={<NavigationRail />}
        sidebar={
          activeView === 'agents' ? <AgentRosterList /> : <FilesPaneContainer />
        }
        editor={<EditorPaneContainer />}
        terminal={<ToolsPaneContainer />}
        chat={<ChatPaneContainer />}
      />
    </>
  );
};