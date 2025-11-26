import { create } from 'zustand';

interface TerminalState {
  sessions: string[];
  activeSessionId: string | null;
  createSession: () => void;
}

export const useTerminalStore = create<TerminalState>((set) => ({
  sessions: ['1'],
  activeSessionId: '1',
  createSession: () => set((state) => ({
    sessions: [...state.sessions, `${state.sessions.length + 1}`],
  })),
}));