import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
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
import { chatDb } from '@ai-workbench/shared/database/client';
import type {
  ChatMessage,
  AgentStatus,
  WorkbenchTask,
  AgentGraphNode,
  AgentGraphEdge,
  Agent,
} from '@ai-workbench/shared/bounded-contexts';

export interface WorkbenchState
  extends PermissionSlice,
    WorkspaceSlice,
    ProfileSlice {
  // Chat State
  chatMessages: ChatMessage[];
  isStreaming: boolean;
  activeConversationId: string | null;

  // Agent State
  agentStatuses: Record<string, AgentStatus>;

  // Graph State
  workflowNodes: AgentGraphNode[];
  workflowEdges: AgentGraphEdge[];

  // Task State
  tasks: WorkbenchTask[];
  activeTaskId: string | null;

  // Actions
  loadSession: (workspacePath: string) => Promise<void>; // <--- Restore this
  addChatMessage: (msg: ChatMessage) => void;
  setStreaming: (streaming: boolean) => void;
  setAgentStatus: (agentId: string, state: AgentStatus['state']) => void;
  enqueueTask: (task: Partial<WorkbenchTask>) => string;
  setActiveConversationId: (id: string | null) => void;
  addAgent: (agent: Agent) => void;
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

        addAgent: (agent) =>
          set((state) => ({
            agentStatuses: {
              ...state.agentStatuses,
              [agent.id]: {
                agentId: agent.id,
                kind: agent.kind,
                label: agent.name,
                state: 'idle',
                lastUpdated: Date.now(),
              },
            },
          })),

        addChatMessage: async (msg) => {
          const normalized: ChatMessage = {
            id: msg.id || uuidv4(), // Ensure a unique ID exists
            ...msg,
            timestamp:
              msg.timestamp instanceof Date
                ? msg.timestamp
                : new Date(msg.timestamp),
          };

          set((s) => ({ chatMessages: [...s.chatMessages, normalized] }));

          // Save to DB
          const { activeConversationId } = get();
          if (activeConversationId) {
            await chatDb.addMessage(activeConversationId, normalized);
          }
        },

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
          const id = uuidv4(); // Cast to ensure type conformity after spreading partial
          const newTask: WorkbenchTask = {
            id,
            status: 'queued',
            ...taskBase,
          } as WorkbenchTask;
          set((s) => ({ tasks: [newTask, ...s.tasks] }));
          return id;
        },
        // 1. Load Session from Dexie
        loadSession: async (workspacePath: string) => {
          const threads = await chatDb.listByWorkspace(workspacePath);
          let activeThreadId = threads[0]?.id;

          if (!activeThreadId) {
            activeThreadId = await chatDb.create(
              workspacePath,
              'General Session'
            );
          }

          const conversation = await chatDb.get(activeThreadId);
          const messages = conversation?.messages || [];

          set({
            activeConversationId: activeThreadId,
            chatMessages: messages,
          });
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

export const workbenchStore = useWorkbenchStore;