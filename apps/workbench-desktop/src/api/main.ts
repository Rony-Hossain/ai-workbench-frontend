import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import { readdirSync, statSync } from 'fs';
import * as os from 'os';
import { spawn } from 'child_process';

let mainWindow: BrowserWindow | null = null;
const terminals: Record<string, any> = {};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    frame: false,
    backgroundColor: '#0a0a0a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const startUrl = process.env.NX_NEXT_DEV_SERVER_URL || 'http://localhost:4200';
  mainWindow.loadURL(startUrl);
  mainWindow.on('closed', () => (mainWindow = null));
}

// --- TERMINAL HANDLER (Interactive Fix) ---
ipcMain.handle('term:create', (_, cwd?: string) => {
  console.log('🔌 Requesting new terminal session...');

  const isWindows = os.platform() === 'win32';
  const systemShell = isWindows ? 'powershell.exe' : 'bash';
  const targetCwd = cwd || app.getPath('home');
  
  // FIX: Add arguments to force interactive mode
  // -NoExit is crucial: it keeps the shell open so it accepts more commands
  const shellArgs = isWindows 
    ? ['-NoLogo', '-NoExit', '-ExecutionPolicy', 'Bypass'] 
    : ['-i', '-l'];

  const id = `term-${Date.now()}`;

  try {
    const child = spawn(systemShell, shellArgs, {
      cwd: targetCwd,
      env: process.env,
      shell: false, // Run executable directly with args
    });

    console.log(`✅ Shell spawned! ID: ${id}`);

    child.stdout.on('data', (data) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('term:data', { id, data: data.toString() });
      }
    });

    child.stderr.on('data', (data) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('term:data', { id, data: data.toString() });
      }
    });

    child.on('exit', (code) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('term:data', { id, data: `\r\nProcess exited with code ${code}\r\n` });
      }
      delete terminals[id];
    });

    terminals[id] = child;
    return id;

  } catch (err) {
    console.error('❌ Failed to spawn shell:', err);
    return null;
  }
});

ipcMain.handle('term:write', (_, { id, data }) => {
  const child = terminals[id];
  if (child) {
    child.stdin.write(data);
  }
});

ipcMain.handle('term:resize', () => {}); // No-op

// --- FILE & APP HANDLERS ---
const readDirRecursive = (dirPath: string): any => {
  const name = path.basename(dirPath);
  try {
    const stats = statSync(dirPath);
    if (!stats.isDirectory()) return { name, path: dirPath, type: 'file' };
    const children = readdirSync(dirPath)
      .filter(item => !['.git', 'node_modules', '.DS_Store'].includes(item))
      .map(child => readDirRecursive(path.join(dirPath, child)));
    return { name, path: dirPath, type: 'folder', children };
  } catch (e) {
    return { name, path: dirPath, type: 'file' };
  }
};

ipcMain.handle('files:read-dir', async (_, dirPath) => {
  const target = dirPath || app.getPath('home');
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