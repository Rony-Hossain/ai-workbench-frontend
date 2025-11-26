import { create } from 'zustand';

interface AgentBuilderState {
  isOpen: boolean;
  openBuilder: () => void;
  closeBuilder: () => void;
}

export const useAgentBuilderStore = create<AgentBuilderState>((set) => ({
  isOpen: false,
  openBuilder: () => set({ isOpen: true }),
  closeBuilder: () => set({ isOpen: false }),
}));