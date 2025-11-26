import React, { useState } from 'react';
import { Minus, Square, X, Copy } from 'lucide-react';
import { cn } from '../utils/cn';

export const WindowTitleBar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  const handleMinimize = () => {
    window.electron?.app.minimize();
  };

  const handleMaximize = () => {
    window.electron?.app.maximize();
    setIsMaximized(!isMaximized); // Optimistic toggle
  };

  const handleClose = () => {
    window.electron?.app.close();
  };

  return (
    <div className="h-8 bg-neutral-950 flex items-center justify-between select-none border-b border-neutral-800 z-50 relative">
      {/* 1. DRAG REGION (The Title) */}
      {/* We use 'app-region: drag' to let the OS move the window */}
      <div
        className="flex h-full w-full bg-neutral-950 text-neutral-200 overflow-hidden font-sans"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <span className="text-primary mr-2">AI</span> WORKBENCH
      </div>

      {/* 2. WINDOW CONTROLS (No-Drag) */}
      {/* Buttons MUST be 'no-drag' or they won't be clickable */}
      <div
        className="flex h-full"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* Minimize */}
        <button
          onClick={handleMinimize}
          className="w-12 h-full flex items-center justify-center text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors focus:outline-none"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Maximize / Restore */}
        <button
          onClick={handleMaximize}
          className="w-12 h-full flex items-center justify-center text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors focus:outline-none"
        >
          {isMaximized ? (
            <Copy className="w-3.5 h-3.5" /> // Fake "Restore" icon using Copy
          ) : (
            <Square className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Close */}
        <button
          onClick={handleClose}
          className="w-12 h-full flex items-center justify-center text-neutral-400 hover:bg-red-600 hover:text-white transition-colors focus:outline-none"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
