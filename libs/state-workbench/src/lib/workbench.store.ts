import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  createPermissionSlice,
  type PermissionSlice,
} from './slices/permission.slice';
import {
  createWorkspaceSlice,
  type WorkspaceSlice,
} from './slices/workspace.slice';
import { createProfileSlice, type ProfileSlice } from './slices/profile.slice';
import type {
  ChatMessage,
  AgentStatus,
  WorkbenchTask,
  AgentGraphNode,
  AgentGraphEdge,
} from '@ai-workbench/bounded-contexts';

export interface WorkbenchState
  extends PermissionSlice,
    WorkspaceSlice,
    ProfileSlice {
  // Chat State
  chatMessages: ChatMessage[];
  isStreaming: boolean;

  // Agent State
  agentStatuses: Record<string, AgentStatus>;

  activeConversationId: string | null;

  // Graph State
  workflowNodes: AgentGraphNode[];
  workflowEdges: AgentGraphEdge[];

  // Task State
  tasks: WorkbenchTask[];
  activeTaskId: string | null;

  // Actions
  addChatMessage: (msg: ChatMessage) => void;
  setStreaming: (streaming: boolean) => void;
  setAgentStatus: (agentId: string, state: AgentStatus['state']) => void;
  enqueueTask: (task: Partial<WorkbenchTask>) => string;
  setActiveConversationId: (id: string | null) => void;
}

export const useWorkbenchStore = create<WorkbenchState>()(
  devtools(
    persist(
      (set, get, api) => ({
        // --- Slices ---
        ...createPermissionSlice(set, get, api),
        ...createWorkspaceSlice(set, get, api),
        ...createProfileSlice(set, get, api),

        // --- Main State ---
        chatMessages: [],
        isStreaming: false,

        activeConversationId: null,
        setActiveConversationId: (id) => set({ activeConversationId: id }),

        workflowNodes: [
          { id: 'user', label: 'User', status: 'success', kind: 'user' },
          { id: 'planner', label: 'Planner', status: 'idle', kind: 'planner' },
          {
            id: 'lead_engineer',
            label: 'Lead Engineer',
            status: 'idle',
            kind: 'lead_engineer',
          },
          {
            id: 'reviewer',
            label: 'Reviewer',
            status: 'idle',
            kind: 'reviewer',
          },
        ],
        workflowEdges: [
          { source: 'user', target: 'planner', status: 'success' },
          { source: 'planner', target: 'lead_engineer', status: 'idle' },
          { source: 'lead_engineer', target: 'reviewer', status: 'idle' },
        ],

        agentStatuses: {
          planner: {
            agentId: 'planner',
            kind: 'planner',
            label: 'Planner',
            state: 'idle',
            lastUpdated: Date.now(),
          },
          lead_engineer: {
            agentId: 'lead_engineer',
            kind: 'lead_engineer',
            label: 'Lead Engineer',
            state: 'idle',
            lastUpdated: Date.now(),
          },
          reviewer: {
            agentId: 'reviewer',
            kind: 'reviewer',
            label: 'Reviewer',
            state: 'idle',
            lastUpdated: Date.now(),
          },
        },
        tasks: [],
        activeTaskId: null,

        // --- Actions ---
        addChatMessage: (msg) =>
          set((s) => ({ chatMessages: [...s.chatMessages, msg] })),
        setStreaming: (streaming) => set({ isStreaming: streaming }),

        setAgentStatus: (agentId, state) =>
          set((s) => ({
            agentStatuses: {
              ...s.agentStatuses,
              [agentId]: {
                ...s.agentStatuses[agentId],
                state,
                lastUpdated: Date.now(),
              },
            },
          })),

        enqueueTask: (taskBase) => {
          const id = `task-${Date.now()}`;
          // @ts-ignore
          const newTask: WorkbenchTask = { id, status: 'queued', ...taskBase };
          set((s) => ({ tasks: [...s.tasks, newTask] }));
          return id;
        },
      }),
      {
        name: 'AI-Workbench-Store',
        partialize: (state) => ({
          profile: state.profile,
          activeWorkspaceId: state.activeWorkspaceId,
          workspaces: state.workspaces,
        }),
      }
    ),
    { name: 'AI-Workbench-Store' }
  )
);

// Export the direct hook for non-React usage (Agent Service)
export const workbenchStore = useWorkbenchStore;
