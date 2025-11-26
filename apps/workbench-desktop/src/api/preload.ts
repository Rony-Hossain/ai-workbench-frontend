import { contextBridge, ipcRenderer } from 'electron';
// Make sure you define this type or just use 'any' for the bridge if types are fighting
// import type { BridgeApi } from '@ai-workbench/shared/electron-bridge';

const api = {
  files: {
    readDir: (path: string) => ipcRenderer.invoke('files:read-dir', path),
    readFile: (path: string) => ipcRenderer.invoke('files:read-file', path),
    writeFile: (path: string, content: string) => ipcRenderer.invoke('files:write-file', { path, content }),
  },
  dialog: {
    openDirectory: () => ipcRenderer.invoke('dialog:open-directory'),
  },
  terminal: {
    create: (cwd?: string) => ipcRenderer.invoke('term:create', cwd),
    write: (id: string, data: string) => ipcRenderer.invoke('term:write', { id, data }),
    resize: (id: string, cols: number, rows: number) => ipcRenderer.invoke('term:resize', { id, cols, rows }),
    // 🛑 THIS IS THE CRITICAL PART FOR RECEIVING TEXT 🛑
    onData: (callback: (id: string, data: string) => void) => {
      const subscription = (_: any, payload: { id: string; data: string }) => {
        callback(payload.id, payload.data);
      };
      ipcRenderer.on('term:data', subscription);
      return () => ipcRenderer.off('term:data', subscription);
    }
  },
  app: {
    minimize: () => ipcRenderer.invoke('app:minimize'),
    maximize: () => ipcRenderer.invoke('app:maximize'),
    close: () => ipcRenderer.invoke('app:close'),
  }
};

contextBridge.exposeInMainWorld('electron', api);