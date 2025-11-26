import { create } from 'zustand';

type SidebarView = 'files' | 'agents' | 'workflow' | 'settings';

interface CockpitLayoutState {
  activeSidebarView: SidebarView;
  setActiveSidebarView: (view: SidebarView) => void;
}

export const useCockpitLayoutStore = create<CockpitLayoutState>((set) => ({
  activeSidebarView: 'files',
  setActiveSidebarView: (view) => set({ activeSidebarView: view }),
}));