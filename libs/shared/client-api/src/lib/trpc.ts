import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@ai-workbench/shared/trpc-server';

declare global {
  interface Window {
    electronTRPC?: unknown;
  }
}

if (typeof window !== 'undefined' && !('electronTRPC' in window)) {
  console.warn('electronTRPC global not found. Ensure exposeElectronTRPC() runs in preload when running Electron.');
}

export const trpc = createTRPCReact<AppRouter>();
