import { create } from 'zustand';

interface SettingsModalState {
  isOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
}

export const useSettingsModalStore = create<SettingsModalState>((set) => ({
  isOpen: false,
  openSettings: () => set({ isOpen: true }),
  closeSettings: () => set({ isOpen: false }),
}));