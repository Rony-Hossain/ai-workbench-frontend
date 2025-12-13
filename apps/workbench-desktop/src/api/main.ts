import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import { existsSync, readdirSync, statSync, mkdirSync } from 'fs';
import * as os from 'os';
import * as pty from 'node-pty';
import { EventEmitter } from 'events';
import { createIPCHandler } from 'electron-trpc/main';
import { appRouter } from './router';
import type { TerminalSession as ClientTerminalSession } from '@ai-workbench/feature-terminal';
import { createContext } from './trpc/context';

// -----------------------------------------------------------------------------
// CRITICAL FIX: LINUX / WSL2 RENDERING FLAGS
// These MUST be set before app.on('ready') or they do nothing.
// -----------------------------------------------------------------------------
// if (process.platform === 'linux') {
//   try {
//     const safeTempDir = path.join(os.homedir(), '.ai-workbench-tmp');
//     if (!existsSync(safeTempDir)) {
//       mkdirSync(safeTempDir, { recursive: true });
//     }

//     // Make all temp-related env vars point here
//     process.env.TMPDIR = safeTempDir;
//     process.env.TMP = safeTempDir;
//     process.env.TEMP = safeTempDir;
//     process.env.XDG_RUNTIME_DIR = safeTempDir;

//     // Tell Electron itself to use these paths
//     app.setPath('temp', safeTempDir);
//     app.setPath('userData', path.join(safeTempDir, 'user-data'));
//     app.setPath('crashDumps', path.join(safeTempDir, 'crash-dumps'));

//     console.log(`🛡️  Linux Sandbox Patch: Redirected TMP to ${safeTempDir}`);
//   } catch (e) {
//     console.error('❌ Failed to create safe temp dir:', e);
//   }

//   // Rendering / sandbox flags – keep them minimal and intentional
//   app.disableHardwareAcceleration();
//   app.commandLine.appendSwitch('disable-gpu');
//   app.commandLine.appendSwitch('no-sandbox');          // if you really need it in your env
//   app.commandLine.appendSwitch('disable-gpu-compositing');
//   app.commandLine.appendSwitch('disable-gpu-rasterization');
//   app.commandLine.appendSwitch('disable-gpu-sandbox');
//   app.commandLine.appendSwitch('--in-process-gpu');
//   app.commandLine.appendSwitch('use-gl', 'swiftshader');

//   // CRITICAL: force Chromium to NOT use /dev/shm
//   app.commandLine.appendSwitch('disable-dev-shm-usage');
//   app.commandLine.appendSwitch('remote-debugging-port', '9223');
// }


if (process.platform === 'linux') {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch('disable-gpu');
}


// -----------------------------------------------------------------------------

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

interface CreateTerminalArgs {
  cols?: number;
  rows?: number;
  name?: string;
  projectId?: string;
  agentId?: string;
  cwd?: string;
}

interface TerminalSessionMetadata {
  name: string;
  cols: number;
  rows: number;
}

interface ManagedTerminalSession {
  id: string;
  ptyProcess: pty.IPty;
  metadata: TerminalSessionMetadata;
  history: string[];
  projectId: string;
  agentIds: Set<string>;
  state: {
    isActive: boolean;
    isPaused: boolean;
  };
}

const IGNORED_ENTRIES = new Set(['.git', 'node_modules', '.DS_Store', 'dist']);

let activeWorkspacePath: string | null = null;
let mainWindow: BrowserWindow | null = null;
let terminalManager: DistributedTerminalManager | null = null;

function isPathSafe(targetPath: string): boolean {
  if (!activeWorkspacePath) return false;
  const resolved = path.resolve(targetPath);
  const relative = path.relative(activeWorkspacePath, resolved);
  if (relative === '') {
    return true;
  }
  return !relative.startsWith('..') && !path.isAbsolute(relative);
}

function createSafeEnv(): NodeJS.ProcessEnv {
  const safeEnv: NodeJS.ProcessEnv = { ...process.env };
  for (const key of Object.keys(safeEnv)) {
    if (/API_KEY|SECRET|TOKEN/i.test(key)) {
      delete safeEnv[key];
    }
  }
  return safeEnv;
}

class DistributedTerminalManager extends EventEmitter {
  private sessions: Map<string, ManagedTerminalSession> = new Map();
  private mainWindow: BrowserWindow | null = null;

  constructor(window: BrowserWindow) {
    super();
    this.mainWindow = window;
    this.setupIPCHandlers();
  }

  private setupIPCHandlers(): void {
    ipcMain.handle('terminal:create', (_, args: CreateTerminalArgs = {}) => this.createSession(args));
    ipcMain.handle('terminal:list', (_event, _filter?: unknown) => this.listSessions());
    ipcMain.handle('terminal:write', (_, payload: { id: string; data: string }) => {
      this.write(payload.id, payload.data);
    });
    ipcMain.handle('terminal:resize', (_, payload: { id: string; cols: number; rows: number }) => {
      this.resize(payload.id, payload.cols, payload.rows);
    });
    ipcMain.handle('terminal:kill', (_, id: string) => {
      this.kill(id);
    });
    ipcMain.handle('terminal:join', (_, payload: { id: string; agentId: string }) =>
      this.joinSession(payload.id, payload.agentId),
    );
    ipcMain.handle('terminal:leave', (_, payload: { id: string; agentId: string }) =>
      this.leaveSession(payload.id, payload.agentId),
    );
  }

  private listSessions(): ClientTerminalSession[] {
    return Array.from(this.sessions.values()).map((session) => this.toClientSession(session));
  }

  private toClientSession(session: ManagedTerminalSession): ClientTerminalSession {
    return {
      id: session.id,
      projectId: session.projectId,
      agentIds: Array.from(session.agentIds),
      metadata: session.metadata,
      state: session.state,
    };
  }

  private emitSessionCreated(session: ManagedTerminalSession): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('terminal:created', this.toClientSession(session));
    }
  }

  createSession(args: CreateTerminalArgs) {
    const shell = process.env['SHELL'] || (process.platform === 'win32' ? 'powershell.exe' : 'bash');
    const id = `term-${Date.now()}`;
    const targetCwd = activeWorkspacePath || process.env.HOME || os.homedir();
    const cols = args.cols ?? 80;
    const rows = args.rows ?? 30;
    const projectId = args.projectId ?? 'default';

    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols,
      rows,
      cwd: targetCwd,
      env: createSafeEnv(),
    });

    const session: ManagedTerminalSession = {
      id,
      ptyProcess,
      metadata: {
        name: args.name ?? 'Terminal',
        cols,
        rows,
      },
      history: [],
      projectId,
      agentIds: new Set<string>(),
      state: {
        isActive: true,
        isPaused: false,
      },
    };

    this.sessions.set(id, session);
    if (args.agentId) {
      session.agentIds.add(args.agentId);
      this.notifyAgentJoined(id, args.agentId);
    }

    ptyProcess.onData((data) => {
      session.history.push(data);
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('terminal:data', { id, data });
      }
    });

    ptyProcess.onExit((event) => {
      session.state.isActive = false;
      this.removeAllAgents(session);
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('terminal:exit', { id, exitCode: event.exitCode });
      }
      this.sessions.delete(id);
    });

    this.emitSessionCreated(session);

    return { id, pid: ptyProcess.pid };
  }

  write(id: string, data: string): void {
    const session = this.sessions.get(id);
    session?.ptyProcess.write(data);
  }

  resize(id: string, cols: number, rows: number): void {
    const session = this.sessions.get(id);
    if (!session) return;
    try {
      session.ptyProcess.resize(cols, rows);
      session.metadata.cols = cols;
      session.metadata.rows = rows;
    } catch (error) {
      console.warn('Failed to resize terminal session', id, error);
    }
  }

  kill(id: string): void {
    const session = this.sessions.get(id);
    if (!session) return;
    session.state.isActive = false;
    this.removeAllAgents(session);
    session.ptyProcess.kill();
    this.sessions.delete(id);
  }

  private joinSession(id: string, agentId: string) {
    const session = this.sessions.get(id);
    if (!session) return { success: false };
    if (!session.agentIds.has(agentId)) {
      session.agentIds.add(agentId);
      this.notifyAgentJoined(id, agentId);
    }
    return { success: true };
  }

  private leaveSession(id: string, agentId: string) {
    const session = this.sessions.get(id);
    if (!session) return { success: false };
    if (session.agentIds.delete(agentId)) {
      this.notifyAgentLeft(id, agentId);
    }
    return { success: true };
  }

  private notifyAgentJoined(sessionId: string, agentId: string) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('terminal:agent-joined', { sessionId, agentId });
    }
  }

  private notifyAgentLeft(sessionId: string, agentId: string) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('terminal:agent-left', { sessionId, agentId });
    }
  }

  private removeAllAgents(session: ManagedTerminalSession) {
    for (const agentId of session.agentIds) {
      this.notifyAgentLeft(session.id, agentId);
    }
    session.agentIds.clear();
  }
}

const readDirRecursive = (dirPath: string): FileNode => {
  const name = path.basename(dirPath);
  try {
    const stats = statSync(dirPath);
    if (!stats.isDirectory()) {
      return { name, path: dirPath, type: 'file' };
    }

    const children = readdirSync(dirPath)
      .filter((item) => !IGNORED_ENTRIES.has(item))
      .map((child) => readDirRecursive(path.join(dirPath, child)));

    return { name, path: dirPath, type: 'folder', children };
  } catch {
    return { name, path: dirPath, type: 'file' };
  }
};

function createWindow(): void {

  // app.commandLine.appendSwitch('disable-gpu'); 
  // app.commandLine.appendSwitch('disable-software-rasterizer');
  // app.commandLine.appendSwitch('disable-dev-shm-usage');


  mainWindow = new BrowserWindow({
    width: 1580,
    height: 1000,
    frame: false,
    backgroundColor: '#0a0a0a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });



  terminalManager = new DistributedTerminalManager(mainWindow);

  createIPCHandler({ router: appRouter, windows: [mainWindow], createContext });

  ipcMain.handle('files:read-dir', async (_, dirPath?: string) => {
    if (!dirPath) {
      return null;
    }

    if (activeWorkspacePath && !isPathSafe(dirPath)) {
      console.warn(`🛑 Blocked read outside workspace: ${dirPath}`);
      throw new Error('Access Denied');
    }

    if (!activeWorkspacePath) {
      const homeDir = process.env.HOME || '';
      if (!homeDir || !dirPath.startsWith(homeDir)) {
        throw new Error('No active workspace selected');
      }
    }

    return readDirRecursive(dirPath);
  });

  ipcMain.handle('files:read-file', async (_, filePath: string) => {
    if (!activeWorkspacePath) throw new Error('No active workspace selected');
    if (!isPathSafe(filePath)) throw new Error('Access Denied');
    return fs.readFile(filePath, 'utf-8');
  });

  ipcMain.handle('files:write-file', async (_, payload: { path: string; content: string }) => {
    if (!activeWorkspacePath) throw new Error('No active workspace selected');
    if (!isPathSafe(payload.path)) throw new Error('Access Denied');

    const targetDir = path.dirname(payload.path);
    if (!existsSync(targetDir)) {
      await fs.mkdir(targetDir, { recursive: true });
    }

    await fs.writeFile(payload.path, payload.content, 'utf-8');
  });

  ipcMain.handle('dialog:open-directory', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory'],
    });

    if (canceled || !filePaths[0]) {
      return null;
    }

    activeWorkspacePath = filePaths[0];
    return activeWorkspacePath;
  });

  ipcMain.handle('app:minimize', () => mainWindow?.minimize());
  ipcMain.handle('app:maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize();
    else mainWindow?.maximize();
  });
  ipcMain.handle('app:close', () => mainWindow?.close());

  const startUrl = process.env.NX_NEXT_DEV_SERVER_URL || 'http://localhost:4200';
  mainWindow.loadURL(startUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
