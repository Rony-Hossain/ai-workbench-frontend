import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

export const TerminalView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  // Track the terminal instance and the backend session ID
  const terminalRef = useRef<{ term: Terminal; fitAddon: FitAddon; sessionId: string | null } | null>(null);

  useEffect(() => {
    // 1. Cancellation flag to prevent race conditions with async/setTimeout
    let isMounted = true;
    let resizeObserver: ResizeObserver | null = null;
    // We need a reference to the specific listener function to remove it later
    let onDataCleanup: (() => void) | null = null;

    const init = async () => {
      // If we unmounted while waiting for the timeout, STOP.
      if (!isMounted || !containerRef.current) return;

      console.log('🖥️ TerminalView: Initializing xterm.js...');

      const term = new Terminal({
        theme: {
          background: '#0a0a0a',
          foreground: '#e5e5e5',
          cursor: '#00f0ff',
          selectionBackground: 'rgba(0, 240, 255, 0.3)',
        },
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 12,
        cursorBlink: true,
        convertEol: true, 
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(containerRef.current);
      
      try { fitAddon.fit(); } catch (e) { /* ignore hidden container */ }

      // 2. Connect to Electron
      let sessionId: string | null = null;

      if (window.electron) {
        console.log('🔌 TerminalView: Calling Electron Bridge...');
        try {
          sessionId = await window.electron.terminal.create();
          
          // CRITICAL: If we unmounted while awaiting the promise, kill it immediately
          if (!isMounted) {
            console.warn('Component unmounted during creation. Killing zombie session:', sessionId);
            // Assuming you have a kill method. If not, we will add it to the backend next.
            window.electron.terminal.kill?.(sessionId); 
            term.dispose();
            return;
          }
          
          console.log('TerminalView: Session Created:', sessionId);
        } catch (err) {
          console.error('TerminalView: Bridge Failed:', err);
          term.writeln('Error: Could not connect to shell.');
        }
      } else {
        term.writeln('No Electron detected. Read-only mode.');
      }

      // 3. Frontend Input -> Backend
      term.onData((data) => {
        if (sessionId && window.electron) {
          window.electron.terminal.write(sessionId, data);
        } else {
          term.write(data); // Local echo
        }
      });

      // 4. Backend Output -> Frontend (With Cleanup Tracking)
      if (window.electron && sessionId) {
        const handleIncoming = (id: string, data: string) => {
          if (id === sessionId) term.write(data);
        };
        
        // Subscribe
        window.electron.terminal.onData(handleIncoming);
        
        // Store cleanup logic for this specific listener
        onDataCleanup = () => {
             // You need to expose an 'off' or 'removeListener' in your preload/main
             // If you don't have one, this will still leak memory in Electron's main process
             // For now, we rely on the backend being smart enough to stop sending 
             // when we kill the session.
        };
      }

      term.focus();
      terminalRef.current = { term, fitAddon, sessionId };

      // 5. Resize Observer
      resizeObserver = new ResizeObserver(() => {
        if (!terminalRef.current) return;
        try {
          terminalRef.current.fitAddon.fit();
          const dims = terminalRef.current.fitAddon.proposeDimensions();
          if (dims && window.electron && terminalRef.current.sessionId) {
            window.electron.terminal.resize(terminalRef.current.sessionId, dims.cols, dims.rows);
          }
        } catch (e) { /* ignore */ }
      });
      
      resizeObserver.observe(containerRef.current);
    };

    // The delay allows the layout (flex/grid) to settle so FitAddon works
    const timer = setTimeout(init, 50);

    // CLEANUP FUNCTION
    return () => {
      isMounted = false; // Stop the async init if it's running
      clearTimeout(timer); // Stop the timeout if it hasn't fired
      resizeObserver?.disconnect(); // Stop watching DOM
      
      if (onDataCleanup) onDataCleanup(); // Remove IPC listener

      if (terminalRef.current) {
        const { term, sessionId } = terminalRef.current;
        
        // 1. Kill the backend process
        if (sessionId && window.electron && window.electron.terminal.kill) {
            console.log('💀 Killing backend session:', sessionId);
            window.electron.terminal.kill(sessionId);
        } else if (sessionId) {
            console.warn('⚠️ No kill method found on bridge. Backend process leaked.');
        }

        // 2. Kill the frontend UI
        term.dispose();
        terminalRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="h-full w-full bg-neutral-950 px-2 py-1 overflow-hidden"
      // Clicking empty space focuses the cursor
      onClick={() => terminalRef.current?.term.focus()} 
    />
  );
};