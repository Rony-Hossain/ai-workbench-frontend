import { create } from 'zustand';

interface EditorState {
  openTabs: string[]; // File paths
  activeTab: string | null;
  dirtyFiles: Set<string>; // Files with unsaved changes

  openFile: (path: string) => void;
  closeFile: (path: string) => void;
  setActiveTab: (path: string) => void;
  markDirty: (path: string, isDirty: boolean) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  openTabs: [],
  activeTab: null,
  dirtyFiles: new Set(),

  openFile: (path) => set((state) => {
    if (state.openTabs.includes(path)) {
      return { activeTab: path };
    }
    return {
      openTabs: [...state.openTabs, path],
      activeTab: path,
    };
  }),

  closeFile: (path) => set((state) => {
    const newTabs = state.openTabs.filter((t) => t !== path);
    // If we closed the active tab, pick the neighbor
    const newActive = state.activeTab === path 
      ? newTabs[newTabs.length - 1] || null 
      : state.activeTab;
    
    return { openTabs: newTabs, activeTab: newActive };
  }),

  setActiveTab: (path) => set({ activeTab: path }),

  markDirty: (path, isDirty) => set((state) => {
    const newSet = new Set(state.dirtyFiles);
    if (isDirty) newSet.add(path);
    else newSet.delete(path);
    return { dirtyFiles: newSet };
  }),
}));