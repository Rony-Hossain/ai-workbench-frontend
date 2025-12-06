import { StrictMode, useState } from 'react';
import * as ReactDOM from 'react-dom/client';
import { App } from './app/app';
import './global.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc } from '@ai-workbench/shared/client-api';
import { ipcLink } from 'electron-trpc/renderer';

// --- FIX START: Silence Monaco React 18 Noise ---
window.addEventListener('unhandledrejection', (event) => {
  // Check if the error is exactly the Monaco cancellation object
  if (
    event.reason?.type === 'cancelation' &&
    event.reason?.msg === 'operation is manually canceled'
  ) {
    // Prevent the error from showing in the browser console
    event.preventDefault();
  }
});
// --- FIX END ---

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

function Root() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [ipcLink()],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

root.render(
  <StrictMode>
    <Root />
  </StrictMode>
);
