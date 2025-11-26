import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { App } from './app/app';
import './global.css';

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

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
