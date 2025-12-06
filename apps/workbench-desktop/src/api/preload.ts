import { contextBridge, ipcRenderer } from 'electron';
import { exposeElectronTRPC } from 'electron-trpc/main';

// 1. Enable the tRPC Bridge (Crucial for AI/DB)
process.once('loaded', () => {
  exposeElectronTRPC();
});

// 2. Define Manual API (For Terminal & Files)
const api = {
  files: {
    readDir: (path: string) => ipcRenderer.invoke('files:read-dir', path),
    readFile: (path: string) => ipcRenderer.invoke('files:read-file', path),
    writeFile: (path: string, content: string) =>
      ipcRenderer.invoke('files:write-file', { path, content }),
  },
  dialog: {
    openDirectory: () => ipcRenderer.invoke('dialog:open-directory'),
  },
  terminal: {
    create: (cwd?: string) => ipcRenderer.invoke('term:create', { cwd }),
    write: (id: string, data: string) =>
      ipcRenderer.invoke('term:write', { id, data }),
    resize: (id: string, cols: number, rows: number) =>
      ipcRenderer.invoke('term:resize', { id, cols, rows }),
    onData: (callback: (id: string, data: string) => void) => {
      // @ts-ignore - Electron types can be fussy with 'event'
      const subscription = (
        _event: any,
        payload: { id: string; data: string }
      ) => {
        callback(payload.id, payload.data);
      };
      ipcRenderer.on('term:data', subscription);
      return () => ipcRenderer.off('term:data', subscription);
    },
  },
  app: {
    minimize: () => ipcRenderer.invoke('app:minimize'),
    maximize: () => ipcRenderer.invoke('app:maximize'),
    close: () => ipcRenderer.invoke('app:close'),
  },
};

// 3. Expose Manual API
contextBridge.exposeInMainWorld('electron', api);
