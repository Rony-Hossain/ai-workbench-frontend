import { contextBridge, ipcRenderer } from 'electron';
import type {
  TerminalAgentEventPayload,
  TerminalBridgeApi,
} from '@ai-workbench/shared/electron-bridge';
import type { TerminalSession } from '@ai-workbench/feature-terminal';

console.log('🔌 Preload script loading...');

process.once('loaded', () => {
  contextBridge.exposeInMainWorld('electronTRPC', {
    sendMessage: (operation: unknown) => ipcRenderer.send('electron-trpc', operation),
    onMessage: (callback: (payload: unknown) => void) => {
      ipcRenderer.on('electron-trpc', (_event, args) => callback(args));
    },
  });
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
    create: async (cwd?: string) => {
      const result = (await ipcRenderer.invoke('terminal:create', { cwd })) as { id?: string };
      return result?.id ?? '';
    },
    write: (id: string, data: string) => ipcRenderer.invoke('terminal:write', { id, data }),
    resize: (id: string, cols: number, rows: number) => ipcRenderer.invoke('terminal:resize', { id, cols, rows }),
    kill: (id: string) => ipcRenderer.invoke('terminal:kill', id),
    onData: (callback: (id: string, data: string) => void) => {
      const subscription = (_event: Electron.IpcRendererEvent, payload: { id: string; data: string }) => {
        callback(payload.id, payload.data);
      };
      ipcRenderer.on('terminal:data', subscription);
      return () => ipcRenderer.off('terminal:data', subscription);
    },
  },
  app: {
    minimize: () => ipcRenderer.invoke('app:minimize'),
    maximize: () => ipcRenderer.invoke('app:maximize'),
    close: () => ipcRenderer.invoke('app:close'),
  },
};

// 3. Define Advanced Terminal API (For Cyberpunk UI)
const terminalAPI: TerminalBridgeApi = {
  listSessions: async (filter) => {
    const sessions = (await ipcRenderer.invoke(
      'terminal:list',
      filter,
    )) as TerminalSession[];
    return { success: true, sessions };
  },
  createSession: async (args) => {
    const session = (await ipcRenderer.invoke(
      'terminal:create',
      args,
    )) as { id?: string; pid?: number };
    return {
      success: typeof session?.id === 'string',
      sessionId: session?.id,
      pid: session?.pid,
    };
  },
  joinSession: async ({ sessionId, agentId }) => {
    await ipcRenderer.invoke('terminal:join', { id: sessionId, agentId });
    return { success: true };
  },
  leaveSession: async ({ sessionId, agentId }) => {
    await ipcRenderer.invoke('terminal:leave', { id: sessionId, agentId });
    return { success: true };
  },
  kill: async (sessionId) => {
    await ipcRenderer.invoke('terminal:kill', sessionId);
  },
  write: async (sessionId, _agentId, data) => {
    await ipcRenderer.invoke('terminal:write', { id: sessionId, data });
  },
  resize: async (sessionId, _agentId, cols, rows) => {
    await ipcRenderer.invoke('terminal:resize', { id: sessionId, cols, rows });
  },
  onData: (callback) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      payload: { id: string; data: string },
    ) => callback(payload.id, payload.data);
    ipcRenderer.on('terminal:data', listener);
    return () => ipcRenderer.off('terminal:data', listener);
  },
  onSessionCreated: (callback) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      payload: TerminalSession,
    ) => callback(payload);
    ipcRenderer.on('terminal:created', listener);
    return () => ipcRenderer.off('terminal:created', listener);
  },
  onAgentJoined: (callback) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      payload: TerminalAgentEventPayload,
    ) => callback(payload);
    ipcRenderer.on('terminal:agent-joined', listener);
    return () => ipcRenderer.off('terminal:agent-joined', listener);
  },
  onAgentLeft: (callback) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      payload: TerminalAgentEventPayload,
    ) => callback(payload);
    ipcRenderer.on('terminal:agent-left', listener);
    return () => ipcRenderer.off('terminal:agent-left', listener);
  },
};

// 3. Expose Manual API
contextBridge.exposeInMainWorld('electron', api);
contextBridge.exposeInMainWorld('terminalAPI', terminalAPI);

console.log('✅ Preload script loaded.');
