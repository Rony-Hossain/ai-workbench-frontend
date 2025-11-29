import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import { readdirSync, statSync } from 'fs';
import * as os from 'os';
// import { spawn, ChildProcess } from 'child_process'; // <--- DELETE THIS
import * as pty from 'node-pty'; // <--- USE THIS
import { createIPCHandler } from 'electron-trpc/main';
import { appRouter } from './router';

let mainWindow: BrowserWindow | null = null;
// Store PTY processes, not generic ChildProcesses
const terminals: Record<string, pty.IPty> = {};

function createWindow() {
  // STABILITY FIX: Disable GPU acceleration to prevent WSLg crashes
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-software-rasterizer');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    frame: false,
    backgroundColor: '#0a0a0a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const startUrl =
    process.env.NX_NEXT_DEV_SERVER_URL || 'http://localhost:4200';

  // 1. Initialize tRPC
  createIPCHandler({ router: appRouter, windows: [mainWindow] });

  // 2. Load URL (ONCE)
  mainWindow.loadURL(startUrl);

  mainWindow.on('closed', () => (mainWindow = null));
}

// --- TERMINAL HANDLER (Real PTY) ---

// 1. CREATE
// 1. CREATE (Fixed Safe Destructuring)
ipcMain.handle('term:create', (_, args) => {
  // CRITICAL FIX: Handle undefined args safely
  const { cwd, cols, rows } = args || {}; 

  const shell = process.env['SHELL'] || 'bash'; // Default to User's Shell in WSL
  const targetCwd = cwd || process.env.HOME;

  const id = `term-${Date.now()}`;

  try {
    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: cols || 80,
      rows: rows || 30,
      cwd: targetCwd,
      env: process.env as any,
    });

    console.log(`✅ PTY spawned! ID: ${id} PID: ${ptyProcess.pid}`);

    ptyProcess.onData((data) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('term:data', { id, data });
      }
    });

    ptyProcess.onExit(({ exitCode }) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('term:exit', { id, exitCode });
      }
      delete terminals[id];
    });

    terminals[id] = ptyProcess;
    return id;
  } catch (err) {
    console.error('❌ Failed to spawn PTY:', err);
    return null;
  }
});

// 2. WRITE
ipcMain.handle('term:write', (_, { id, data }) => {
  const ptyProcess = terminals[id];
  if (ptyProcess) {
    ptyProcess.write(data);
  }
});

// 3. RESIZE (CRITICAL for UX)
// If you don't do this, text wraps weirdly when you resize the panel
ipcMain.handle('term:resize', (_, { id, cols, rows }) => {
  const ptyProcess = terminals[id];
  if (ptyProcess) {
    try {
      ptyProcess.resize(cols, rows);
    } catch (e) {
      console.warn('Failed to resize terminal:', id);
    }
  }
});

// 4. KILL
ipcMain.handle('term:kill', (_, id) => {
  const ptyProcess = terminals[id];
  if (ptyProcess) {
    console.log(`💀 Killing terminal session: ${id}`);
    ptyProcess.kill();
    delete terminals[id];
  }
});

// --- FILE & APP HANDLERS ---
// TODO: Move this to tRPC Router later to clean up main.ts
const readDirRecursive = (dirPath: string): any => {
  const name = path.basename(dirPath);
  try {
    const stats = statSync(dirPath);
    if (!stats.isDirectory()) return { name, path: dirPath, type: 'file' };
    const children = readdirSync(dirPath)
      .filter((item) => !['.git', 'node_modules', '.DS_Store'].includes(item))
      .map((child) => readDirRecursive(path.join(dirPath, child)));
    return { name, path: dirPath, type: 'folder', children };
  } catch (e) {
    return { name, path: dirPath, type: 'file' };
  }
};

ipcMain.handle('files:read-dir', async (_, dirPath) => {
  const target = dirPath || process.env.HOME; // Default to HOME in Linux
  return readDirRecursive(target);
});

ipcMain.handle('files:read-file', async (_, filePath) => {
  return await fs.readFile(filePath, 'utf-8');
});

ipcMain.handle('files:write-file', async (_, { path: filePath, content }) => {
  return await fs.writeFile(filePath, content, 'utf-8');
});

ipcMain.handle('dialog:open-directory', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
  });
  return canceled ? null : filePaths[0];
});

ipcMain.handle('app:minimize', () => mainWindow?.minimize());
ipcMain.handle('app:maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.handle('app:close', () => mainWindow?.close());

app.on('ready', createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
