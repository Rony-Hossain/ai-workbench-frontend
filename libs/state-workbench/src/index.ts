export * from './lib/state-workbench';
export * from './lib/workbench.store';
export * from './lib/workbench.provider';
// Export types for consumers
export type { PermissionSlice } from './lib/slices/permission.slice';
export type { WorkspaceSlice } from './lib/slices/workspace.slice';
export { useWorkbenchStore as workbenchStore } from './lib/workbench.store';
export type { ProfileSlice } from './lib/slices/profile.slice';
