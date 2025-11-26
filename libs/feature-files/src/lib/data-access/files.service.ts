import { FileNode } from '@ai-workbench/bounded-contexts';

// Safe wrapper that handles Browser vs Electron
export const fileSystemApi = {
  readDir: async (path: string): Promise<FileNode> => {
    if (window.electron) {
      return await window.electron.files.readDir(path);
    }
    console.warn("Electron not detected. Using mock data.");
    return MOCK_ROOT; // Fallback for browser dev
  },

  readFile: async (path: string): Promise<string> => {
    if (window.electron) {
      return await window.electron.files.readFile(path);
    }
    return `// Mock content for ${path}`;
  }
};

// Keep your MOCK_ROOT here as fallback
const MOCK_ROOT: FileNode = {
  path: '/', name: 'MOCK_WORKSPACE', type: 'folder',
  children: [
    { path: '/readme.md', name: 'readme.md', type: 'file' }
  ]
};