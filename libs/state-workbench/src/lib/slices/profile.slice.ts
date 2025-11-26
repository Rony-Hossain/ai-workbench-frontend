import { StateCreator } from 'zustand';
import type { UserProfile } from '@ai-workbench/bounded-contexts';
import type { WorkbenchState } from '../workbench.store';

export interface ProfileSliceState {
  profile: UserProfile;
}

export interface ProfileSliceActions {
  updateProfile: (updates: Partial<UserProfile>) => void;
}

export type ProfileSlice = ProfileSliceState & ProfileSliceActions;

const INITIAL_PROFILE: UserProfile = {
  displayName: 'Commander',
  theme: 'cyberpunk',
  fontSize: 13,
  preferredModel: 'gpt-4o',
};

export const createProfileSlice: StateCreator<
  WorkbenchState,
  [],
  [],
  ProfileSlice
> = (set) => ({
  profile: INITIAL_PROFILE,
  updateProfile: (updates) =>
    set((state) => ({
      profile: { ...state.profile, ...updates },
    })),
});