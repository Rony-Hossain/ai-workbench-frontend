import type { StateCreator } from 'zustand';
import type {
  PermissionRequest,
  PermissionRecord,
  PermissionDecision,
} from '@ai-workbench/bounded-contexts'; // <--- Note the updated scope
import type { WorkbenchState } from '../workbench.store';

export interface PermissionSliceState {
  currentPermission: PermissionRequest | null;
  permissionHistory: PermissionRecord[];
  permissionStatus: 'idle' | 'pending';
}

export interface PermissionSliceActions {
  requestPermission: (
    input: Omit<PermissionRequest, 'id' | 'createdAt'>
  ) => string;
  resolveCurrentPermission: (
    decision: Exclude<PermissionDecision, 'pending'>
  ) => void;
  clearCurrentPermission: () => void;
}

export type PermissionSlice = PermissionSliceState & PermissionSliceActions;

export const createPermissionSlice: StateCreator<
  WorkbenchState,
  [],
  [],
  PermissionSlice
> = (set, get) => ({
  currentPermission: null,
  permissionHistory: [],
  permissionStatus: 'idle',

  requestPermission: (input) => {
    const id = `perm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const createdAt = Date.now();

    const request: PermissionRequest = {
      id,
      createdAt,
      ...input,
    };

    set(
      { currentPermission: request, permissionStatus: 'pending' },
      // @ts-ignore - Zustand devtools signature mismatch workaround
      false,
      'permission/requestPermission'
    );

    return id;
  },

  resolveCurrentPermission: (decision) => {
    const state = get();
    const current = state.currentPermission;
    if (!current) return;

    const record: PermissionRecord = {
      ...current,
      decision,
      decidedAt: Date.now(),
    };

    // Logic to update tasks/agents based on permission goes here
    // For now, we update the history and clear the modal
    set((s) => ({
      currentPermission: null,
      permissionHistory: [...s.permissionHistory, record],
      permissionStatus: 'idle',
      // Reactive updates to agents would go here
    }));
  },

  clearCurrentPermission: () => {
    set({ currentPermission: null, permissionStatus: 'idle' });
  },
});
