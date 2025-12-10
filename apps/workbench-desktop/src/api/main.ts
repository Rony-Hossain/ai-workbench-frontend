import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import { readdirSync, statSync } from 'fs';
import * as os from 'os';
import * as pty from 'node-pty';
import { createIPCHandler } from 'electron-trpc/main';
import { appRouter } from './router';

// -----------------------------------------------------------------------------
// CRITICAL FIX: LINUX / WSL2 RENDERING FLAGS
// These MUST be set before app.on('ready') or they do nothing.
// -----------------------------------------------------------------------------
if (process.platform === 'linux') {
  // 1. Stop looking for a GPU
  app.disableHardwareAcceleration();

  // 2. Force the "Nuclear Option" for rendering
  // This forces Chromium to use the CPU (SwiftShader) for everything.
  // It fixes the "Exiting GPU process due to errors" crash.
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('no-sandbox'); // Essential for Docker/Root users
  app.commandLine.appendSwitch('disable-gpu-compositing');
  app.commandLine.appendSwitch('disable-gpu-rasterization');
  app.commandLine.appendSwitch('disable-gpu-sandbox');
  app.commandLine.appendSwitch('--in-process-gpu');
  app.commandLine.appendSwitch('use-gl', 'swiftshader');
}
// -----------------------------------------------------------------------------

let mainWindow: BrowserWindow | null = null;
const terminals: Record<string, pty.IPty> = {};

function createWindow() {
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

  const startUrl = process.env.NX_NEXT_DEV_SERVER_URL || 'http://localhost:4200';

  // 1. Initialize tRPC
  createIPCHandler({ router: appRouter, windows: [mainWindow] });

  // 2. Load URL
  mainWindow.loadURL(startUrl);

  mainWindow.on('closed', () => (mainWindow = null));
}

// --- TERMINAL HANDLER (Real PTY) ---

ipcMain.handle('term:create', (_, args) => {
  const { cwd, cols, rows } = args || {};

  const shell = process.env['SHELL'] || 'bash';
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

ipcMain.handle('term:write', (_, { id, data }) => {
  const ptyProcess = terminals[id];
  if (ptyProcess) {
    ptyProcess.write(data);
  }
});

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

ipcMain.handle('term:kill', (_, id) => {
  const ptyProcess = terminals[id];
  if (ptyProcess) {
    console.log(`💀 Killing terminal session: ${id}`);
    ptyProcess.kill();
    delete terminals[id];
  }
});

// --- FILE & APP HANDLERS ---

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
  const target = dirPath || process.env.HOME;
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