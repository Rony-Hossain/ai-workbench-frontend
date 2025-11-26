import React, { useEffect, useRef } from 'react';
import Editor, { useMonaco, loader } from '@monaco-editor/react';
import { useEditorStore } from '../store/editor.store';
import { Loader2, Save } from 'lucide-react';
import { getLanguageFromFilename } from '@ai-workbench/shared/utils';
import { useFileContent, useFileSave } from '@ai-workbench/feature-files'; // <--- Import Hooks

loader.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/min/vs' } });

export const MonacoWrapper: React.FC = () => {
  const activeTab = useEditorStore((s) => s.activeTab);
  const markDirty = useEditorStore((s) => s.markDirty);
  const monaco = useMonaco();
  const editorRef = useRef<any>(null);

  // 1. Fetch Real Content
  const { data: fileContent, isLoading, isFetching } = useFileContent(activeTab);
  
  // 2. Setup Save Mutation
  const saveMutation = useFileSave();

  const language = activeTab ? getLanguageFromFilename(activeTab) : 'plaintext';

  // Setup Theme (Existing)
  useEffect(() => {
    if (monaco) {
      monaco.editor.defineTheme('cyberpunk', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#0a0a0a', 
          'editor.lineHighlightBackground': '#171717',
          'editorLineNumber.foreground': '#525252',
        },
      });
      monaco.editor.setTheme('cyberpunk');
    }
  }, [monaco]);

  // Handle Keyboard Shortcuts (Ctrl+S)
  const handleEditorMount = (editor: any) => {
    editorRef.current = editor;
    
    editor.addCommand(monaco?.KeyMod.CtrlCmd | monaco?.KeyCode.KeyS, () => {
      if (activeTab) {
        const currentContent = editor.getValue();
        saveMutation.mutate({ path: activeTab, content: currentContent });
        markDirty(activeTab, false); // Clear dirty flag
      }
    });
  };

  // Handle "Dirty" State (Typing)
  const handleChange = (value: string | undefined) => {
    if (activeTab && value !== fileContent) {
      markDirty(activeTab, true);
    }
  };

  if (!activeTab) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-neutral-950 text-neutral-600 text-xs font-mono uppercase tracking-widest">
        Select a file to execute
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-neutral-950">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-neutral-950 relative group">
      {/* Saving Indicator Overlay */}
      {saveMutation.isPending && (
        <div className="absolute top-4 right-4 z-50 bg-neutral-900/80 border border-primary/30 text-primary px-3 py-1.5 rounded text-xs flex items-center gap-2 backdrop-blur-md shadow-neon-primary animate-in fade-in">
          <Loader2 className="w-3 h-3 animate-spin" />
          Saving to Disk...
        </div>
      )}

      <Editor
        height="100%"
        language={language}
        path={activeTab} // Important: Forces editor to reset when tab changes
        value={fileContent || ''} // The real content
        theme="cyberpunk"
        onMount={handleEditorMount}
        onChange={handleChange}
        options={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 13,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          padding: { top: 16 },
          automaticLayout: true,
        }}
      />
    </div>
  );
};