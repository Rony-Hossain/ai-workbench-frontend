import type { StateCreator } from 'zustand';
import type { Workspace, Agent } from '@ai-workbench/bounded-contexts';
import type { WorkbenchState } from '../workbench.store';

// Mock Data for Phase 2 (We will replace with Electron Bridge later)
const MOCK_FILE_TREE = {
  path: '/', name: 'AI Workbench V1', type: 'folder', children: [
    { path: '/src', name: 'src', type: 'folder', children: [
        { path: '/src/main.tsx', name: 'main.tsx', type: 'file' },
        { path: '/src/App.tsx', name: 'App.tsx', type: 'file' },
    ]},
    { path: '/package.json', name: 'package.json', type: 'file' },
  ]
};

export interface WorkspaceData extends Workspace {
  agents: Agent[];
  // We will type these strictly later
  conversations: any[]; 
  fileTree: any | null;
}

export interface WorkspaceSliceState {
  workspaces: Record<string, WorkspaceData>;
  activeWorkspaceId: string | null;
}

export interface WorkspaceSliceActions {
  selectWorkspace: (workspaceId: string) => void;
  addAgent: (agent: Agent) => void;
}

export type WorkspaceSlice = WorkspaceSliceState & WorkspaceSliceActions;

export const createWorkspaceSlice: StateCreator<
  WorkbenchState,
  [],
  [],
  WorkspaceSlice
> = (set, get) => ({
  workspaces: {
    '1': {
      id: '1',
      name: 'AI Workbench V1',
      path: '/Users/dev/ai-workspace',
      agents: [
        { id: 'planner', name: 'Planner', model: 'gpt-4o', kind: 'planner' },
        { id: 'lead_engineer', name: 'Lead Engineer', model: 'gpt-4o', kind: 'lead_engineer' },
      ],
      conversations: [],
      fileTree: MOCK_FILE_TREE,
    },
  },
  activeWorkspaceId: '1',
  selectWorkspace: (workspaceId) => {
    set({ activeWorkspaceId: workspaceId });
  },
  addAgent: (agent) => {
    set((state) => {
      const { activeWorkspaceId } = state;
      if (!activeWorkspaceId) return {};
      const workspace = state.workspaces[activeWorkspaceId];
      if (!workspace) return {};

      return {
        workspaces: {
          ...state.workspaces,
          [activeWorkspaceId]: {
            ...workspace,
            agents: [...workspace.agents, agent],
          },
        },
        agentStatuses: {
          ...state.agentStatuses,
          [agent.id]: {
            agentId: agent.id,
            kind: agent.kind as any,
            label: agent.name,
            state: 'idle',
            lastUpdated: Date.now(),
          },
        },
      };
    });
  },
});
