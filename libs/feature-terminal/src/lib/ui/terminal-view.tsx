import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

export const TerminalView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<{ term: Terminal; fitAddon: FitAddon; sessionId: string } | null>(null);

  useEffect(() => {
    // Prevent double-init
    if (!containerRef.current || terminalRef.current) return;

    const init = async () => {
      console.log('🖥️ TerminalView: Initializing xterm.js...');

      // 1. Setup xterm
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
        // Allow typing even if renderer thinks it's hidden
        screenReaderMode: true, 
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      
      // 2. Attach to DOM
      term.open(containerRef.current!);
      
      // Try to fit, but don't crash if hidden
      try { fitAddon.fit(); } catch (e) { console.warn('Fit failed (expected if hidden)'); }

      // 3. Connect to Electron (The Critical Step)
      let sessionId = 'mock';
      if (window.electron) {
        console.log('🔌 TerminalView: Calling Electron Bridge...');
        try {
          sessionId = await window.electron.terminal.create();
          console.log('✅ TerminalView: Session Created:', sessionId);
        } catch (err) {
          console.error('❌ TerminalView: Bridge Failed:', err);
          term.writeln('Error: Could not connect to shell.');
        }
      } else {
        console.warn('⚠️ TerminalView: No Electron detected.');
        term.writeln('No Electron detected. Read-only mode.');
      }

      // 4. Wire up Data (Input -> Backend)
      term.onData((data) => {
        if (window.electron) {
          window.electron.terminal.write(sessionId, data);
        } else {
          term.write(data); // Local echo fallback
        }
      });

      // 5. Wire up Data (Backend -> Output)
      if (window.electron) {
        window.electron.terminal.onData((id, data) => {
          if (id === sessionId) {
            term.write(data);
          }
        });
      }

      // 6. Focus immediately so you can type
      term.focus();

      terminalRef.current = { term, fitAddon, sessionId };

      // 7. Resize Listener
      const resizeObserver = new ResizeObserver(() => {
        if (!terminalRef.current) return;
        try {
          terminalRef.current.fitAddon.fit();
          const dims = terminalRef.current.fitAddon.proposeDimensions();
          if (dims && window.electron) {
            window.electron.terminal.resize(terminalRef.current.sessionId, dims.cols, dims.rows);
          }
        } catch (e) { /* ignore */ }
      });
      
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }
    };

    // Force init after a tiny delay to let DOM settle
    setTimeout(init, 50);

    return () => {
      if (terminalRef.current) {
        terminalRef.current.term.dispose();
        terminalRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="h-full w-full bg-neutral-950 px-2 py-1 overflow-hidden"
      onClick={() => terminalRef.current?.term.focus()} 
    />
  );
};