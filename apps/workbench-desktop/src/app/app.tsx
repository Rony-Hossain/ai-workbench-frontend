import React from 'react';
// DELETE: import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CockpitScreen } from '@ai-workbench/feature-cockpit';
import { WindowTitleBar } from '@ai-workbench/shared/ui';
import { TRPCProvider } from './trpc-client';

// DELETE: const queryClient = new QueryClient();

export function App() {
  return (
    <TRPCProvider>
      {/* The QueryClientProvider is ALREADY inside TRPCProvider. Do not add it here. */}
      
      <div className="h-screen w-screen bg-neutral-950 text-neutral-100 font-sans flex flex-col overflow-hidden">
        {/* 1. The Window Frame */}
        <div className="flex-none z-50 relative">
          <WindowTitleBar />
        </div>

        {/* 2. The Main Content Area */}
        <div className="flex-1 min-h-0 relative">
          <CockpitScreen />
        </div>
      </div>
    </TRPCProvider>
  );
}

export default App;