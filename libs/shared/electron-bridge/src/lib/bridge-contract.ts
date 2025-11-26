import type { FileNode } from '@ai-workbench/bounded-contexts';

// 1. Define the methods the frontend can call
export interface BridgeApi {
  files: {
    readDir: (path: string) => Promise<FileNode>;
    readFile: (path: string) => Promise<string>;
    writeFile: (path: string, content: string) => Promise<void>;
  };
  dialog: {
    openDirectory: () => Promise<string | null>;
  };
  terminal: {
    create: () => Promise<string>; // Returns session ID
    write: (id: string, data: string) => Promise<void>;
    resize: (id: string, cols: number, rows: number) => Promise<void>;
  };
  app: {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
  }
}

// 2. Extend the global window object
declare global {
  interface Window {
    electron: BridgeApi;
  }
}