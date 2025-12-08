import { create } from 'zustand';
import { workspaceDb } from '@ai-workbench/shared/database/client';

interface WorkspaceState {
  activePath: string | null;
  recentPaths: string[]; // Still keep a local cache for UI

  // Actions
  init: () => Promise<void>; // NEW: Load from DB on startup
  openWorkspace: (path: string) => Promise<void>;
  closeWorkspace: () => void;
  removeRecent: (path: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  activePath: null,
  recentPaths: [],

  init: async () => {
    // 1. Load the last 10 opened workspaces from Dexie
    const recents = await workspaceDb.getRecents(10);
    const paths = recents.map(w => w.path);
    
    // 2. Restore the most recent one as active (optional)
    // For now, we just load the list, we don't auto-open to be safe
    set({ recentPaths: paths });
  },

  openWorkspace: async (path: string) => {
    // 1. Save to DB
    await workspaceDb.upsert({
      id: path, // Simple ID strategy: path is the ID
      name: path.split('\\').pop()?.split('/').pop() || 'Untitled',
      path: path
    });

    // 2. Update UI State
    const currentRecents = get().recentPaths;
    const newRecents = [path, ...currentRecents.filter(p => p !== path)].slice(0, 10);
    
    set({ activePath: path, recentPaths: newRecents });
  },

  closeWorkspace: () => set({ activePath: null }),

  removeRecent: (path) => set((state) => ({
    recentPaths: state.recentPaths.filter((p) => p !== path)
  })),
}));

export const workspaceStore =  useWorkspaceStore;
