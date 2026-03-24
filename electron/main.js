// Skales v6.0.0 — Created by Mario Simic — skales.app
'use strict';

const { app, BrowserWindow, shell, ipcMain, dialog, screen } = require('electron');
const { spawn } = require('child_process');
const net = require('net');
const fs = require('fs');
const path = require('path');

// ─── Timezone Detection ───────────────────────────────────────────────────────
// Detect system timezone: Linux/macOS from /etc/localtime, Windows via Intl API
// Falls back to TZ env var, then UTC
function detectSystemTimezone() {
  // 1. Check existing TZ environment variable
  if (process.env.TZ) {
    console.log('[Skales] Timezone from TZ env:', process.env.TZ);
    return process.env.TZ;
  }

  // 2. Read /etc/localtime on Linux and macOS
  if (process.platform === 'linux' || process.platform === 'darwin') {
    try {
      const localtime = '/etc/localtime';
      if (fs.existsSync(localtime)) {
        const stats = fs.lstatSync(localtime);
        if (stats.isSymbolicLink()) {
          const target = fs.readlinkSync(localtime);
          const match = target.match(/zoneinfo\/(.+)$/);
          if (match) {
            console.log('[Skales] Timezone from /etc/localtime:', match[1]);
            return match[1];
          }
        } else {
          console.log('[Skales] /etc/localtime is not a symlink');
        }
      }
    } catch (e) {
      console.warn('[Skales] Could not read /etc/localtime:', e.message);
    }
  }

  // 3. Windows: use Intl API (works on all platforms, returns system timezone)
  const intlTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (intlTz && intlTz !== 'UTC') {
    console.log('[Skales] Timezone from Intl:', intlTz);
    return intlTz;
  }

  // 4. Fallback to UTC
  console.log('[Skales] Timezone fallback: UTC');
  return 'UTC';
}

const { createTray } = require('./tray');
const { setupUpdater } = require('./updater');

// ─── Windows App User Model ID ───────────────────────────────────────────────
// Must be set BEFORE app.requestSingleInstanceLock() and BEFORE the app is
// ready. This ensures Windows toast notifications display "Skales" instead of
// the Electron app ID (com.squirrel.electron.electron), and the app is
// correctly pinned to the taskbar as "Skales" rather than "Electron".
if (process.platform === 'win32') {
  app.setAppUserModelId('Skales');
}

// ─── Single-instance lock ─────────────────────────────────────────────────────
// Prevent a second Skales process from opening. If a second instance tries to
// launch, focus the existing window and quit the duplicate.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  process.exit(0);
}
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

// ─── Port detection ───────────────────────────────────────────────────────────
// Try preferred ports in order; resolve with the first available one.
// Range starts at 3000 and extends to 3009 so multiple Skales instances
// (e.g. different Windows user accounts on the same machine) can coexist.
const PREFERRED_PORTS = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009];

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => server.close(() => resolve(true)));
    server.listen(port, '127.0.0.1');
  });
}

async function findAvailablePort() {
  for (const port of PREFERRED_PORTS) {
    if (await isPortFree(port)) {
      console.log(`[Skales] Port ${port} is available.`);
      return port;
    }
    console.log(`[Skales] Port ${port} in use, trying next…`);
  }
  throw new Error('No available port found (3000-3009). Close other Skales instances and try again.');
}

// Resolved once app is ready
let PORT = PREFERRED_PORTS[0];

/**
 * Resolve the path to apps/web depending on whether we are running in
 * development (source tree) or in a packaged app.
 *
 * In a packaged build, electron-builder places everything under an ASAR
 * archive (app.asar). Files listed under `asarUnpack` in electron-builder.yml
 * are simultaneously extracted to app.asar.unpacked/ so they can be accessed
 * as real filesystem paths — which is required for spawn() to work.
 *
 * app.getAppPath() returns:
 *   dev  →  /path/to/project
 *   prod →  /path/to/Skales.app/Contents/Resources/app.asar   (mac)
 *            C:\Program Files\Skales\resources\app.asar        (win)
 */
function getWebDir() {
  if (!app.isPackaged) {
    // Development: resolve relative to electron/main.js  →  project root / apps/web
    return path.join(__dirname, '..', 'apps', 'web');
  }
  // Production: app.getAppPath() ends with "app.asar".
  // Appending ".unpacked" gives the real-filesystem mirror that asarUnpack
  // extracts to — this is safer than .replace() which breaks if the word
  // "app.asar" appears anywhere else in the path (e.g. a username).
  const unpackedRoot = app.getAppPath() + '.unpacked';
  return path.join(unpackedRoot, 'apps', 'web');
}

/**
 * User data directory — ALWAYS in the user's home folder, NEVER inside the
 * app bundle or ASAR archive. Survives app updates and uninstalls.
 *
 * Resolved after `app` is ready (app.getPath requires the app to be ready).
 *
 * The Next.js app reads:
 *   process.env.SKALES_DATA_DIR  (set by us before spawning the server)
 *   || path.join(os.homedir(), '.skales-data')  (fallback for standalone web)
 */
function getDataDir() {
  return path.join(app.getPath('home'), '.skales-data');
}

// ─── Auto-launch IPC ─────────────────────────────────────────────────────────
// Let the renderer read and toggle the login-item setting.
ipcMain.handle('get-auto-launch', () => {
  return app.getLoginItemSettings().openAtLogin;
});
ipcMain.on('relaunch-app', () => {
  app.relaunch();
  app.exit(0);
});

ipcMain.on('set-auto-launch', (_event, enabled) => {
  app.setLoginItemSettings({ openAtLogin: Boolean(enabled) });
  console.log(`[Skales] Auto-launch ${enabled ? 'enabled' : 'disabled'}.`);
});

// ─── Timezone IPC ───────────────────────────────────────────────────────────
ipcMain.handle('get-timezone', async () => {
  const settings = readSettings();
  if (settings.timezone) return settings.timezone;
  // detectedTimezone is set at app ready; if not yet set, detect now
  if (!detectedTimezone) {
    detectedTimezone = detectSystemTimezone();
  }
  return detectedTimezone;
});

ipcMain.on('set-timezone', (_event, timezone) => {
  writeSettings({ timezone });
  console.log('[Skales] Timezone set to:', timezone);
});

// ─── Export / Save-dialog IPC ─────────────────────────────────────────────────
// Used by the Export Backup feature so it can save the ZIP to a user-chosen
// location using a native save dialog — rather than relying on the browser's
// anchor-click download mechanism, which is unreliable inside Electron.

ipcMain.handle('show-save-dialog', async (_event, options) => {
  // Prefer the main window; fall back to the focused window if it hasn't
  // been created yet (shouldn't happen in practice).
  const win = mainWindow || BrowserWindow.getFocusedWindow();
  const result = await dialog.showSaveDialog(win, options);
  console.log('[Skales] show-save-dialog result:', result);
  return result; // { canceled: boolean, filePath?: string }
});

ipcMain.handle('copy-file', (_event, src, dst) => {
  // Copy the server-created ZIP from DATA_DIR to the user-chosen path.
  // Running the copy in the main process means we don't have to stream
  // the whole file through IPC as binary data.
  try {
    fs.copyFileSync(src, dst);
    console.log(`[Skales] copy-file: ${src} → ${dst}`);
    return { success: true };
  } catch (e) {
    console.error('[Skales] copy-file failed:', e.message);
    return { success: false, error: e.message };
  }
});

// ─── Persistent Settings ──────────────────────────────────────────────────────
// Simple JSON-based persistence stored in DATA_DIR/settings.json.
// Cannot use electron-store because it requires a ready app context;
// instead we read/write plain JSON via fs — safe to call any time after ready.

function getSettingsPath() {
  return path.join(getDataDir(), 'settings.json');
}

function readSettings() {
  try {
    const raw = fs.readFileSync(getSettingsPath(), 'utf8');
    return JSON.parse(raw);
  } catch { return {}; }
}

function writeSettings(patch) {
  try {
    const dir  = getDataDir();
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const prev = readSettings();
    fs.writeFileSync(getSettingsPath(), JSON.stringify({ ...prev, ...patch }, null, 2), 'utf8');
  } catch (e) {
    console.error('[Skales] Could not write settings:', e.message);
  }
}

// ─── State ────────────────────────────────────────────────────────────────────
let mainWindow = null;
let splashWindow = null;
let buddyWindow = null;
let serverProcess = null;
let serverReady = false;
let desktopBuddyEnabled = false;  // loaded from disk below
let detectedTimezone = undefined;  // set at app ready, or lazily if needed

// ─── Splash Error ─────────────────────────────────────────────────────────────
// Update the splash screen to show a red error state without closing it.
// Keeps the window visible for a few seconds so the user can read the message
// before the caller calls app.quit().
function showSplashError(message) {
  console.error('[Skales] STARTUP ERROR:', message);
  if (!splashWindow || splashWindow.isDestroyed()) return;
  // JSON.stringify produces a safe JS string literal (handles quotes, newlines …)
  const safeMsg = JSON.stringify(message);
  splashWindow.webContents.executeJavaScript(`
    (function () {
      var s = document.getElementById('status');
      if (s) { s.textContent = ${safeMsg}; s.style.color = '#f87171'; }
      var bar = document.querySelector('.loader-bar');
      if (bar) { bar.style.animation = 'none'; bar.style.background = '#f87171'; bar.style.width = '100%'; }
      var track = document.querySelector('.loader-track');
      if (track) { track.style.background = 'rgba(248,113,113,0.15)'; }
    })();
  `).catch(() => { /* splash may have closed */ });
}

// ─── Splash Status ────────────────────────────────────────────────────────────
// Update the splash screen status text with a normal (non-error) message.
// Used during first-time node_modules extraction to keep the user informed.
function updateSplashStatus(message) {
  if (!splashWindow || splashWindow.isDestroyed()) return;
  const safeMsg = JSON.stringify(message);
  splashWindow.webContents.executeJavaScript(`
    (function () {
      var s = document.getElementById('status');
      if (s) { s.textContent = ${safeMsg}; }
    })();
  `).catch(() => { /* splash may have closed */ });
}

// ─── First-launch node_modules extraction (Windows fast-install) ──────────────
// Windows builds ship node_modules as a single tar.gz archive instead of
// ~50 000 individual files. NSIS writes ONE file (~20-40 MB) in ~15 seconds
// rather than spending 3-5 minutes on individual file writes.
//
// On first launch this function detects the archive, extracts it (~15-20 s),
// then deletes the archive to free disk space. Subsequent launches skip this
// because node_modules/ already exists next to where the archive was.
//
// macOS builds ship node_modules/ directly (no tar.gz) — this function is a
// no-op on macOS because the tar.gz simply won't be present.
async function ensureNodeModules() {
  if (!app.isPackaged) return; // dev mode: use source tree directly

  const webResDir    = path.join(process.resourcesPath, 'apps', 'web');
  const tarPath      = path.join(webResDir, 'node_modules.tar.gz');
  const nodeModsPath = path.join(webResDir, 'node_modules');

  // macOS: no tar.gz present — node_modules is already there as a folder.
  if (!fs.existsSync(tarPath)) return;

  // Already extracted on a previous launch — nothing to do.
  if (fs.existsSync(nodeModsPath)) {
    console.log('[Skales] node_modules already extracted — skipping first-time setup.');
    return;
  }

  // ── First launch on Windows ───────────────────────────────────────────────
  console.log('[Skales] First-time setup: extracting node_modules.tar.gz …');
  console.log('[Skales] tar source :', tarPath);
  console.log('[Skales] tar dest   :', webResDir);
  updateSplashStatus('First-time setup… (~20 seconds)');

  const { spawn: spawnProc } = require('child_process');

  await new Promise((resolve, reject) => {
    const proc = spawnProc(
      'tar',
      ['-xzf', tarPath, '-C', webResDir],
      { windowsHide: true }
    );

    proc.stderr && proc.stderr.on('data', (d) => {
      console.error('[Skales] tar stderr:', d.toString().trim());
    });

    proc.on('error', (err) => {
      reject(new Error(`tar not found — ${err.message}. Ensure Windows 10+ is installed.`));
    });

    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`tar exited with code ${code}`));
    });
  });

  // Free ~20-40 MB — archive is no longer needed once extracted.
  try {
    fs.rmSync(tarPath);
    console.log('[Skales] node_modules.tar.gz removed after extraction.');
  } catch (e) {
    console.warn('[Skales] Could not remove tar.gz (non-fatal):', e.message);
  }

  console.log('[Skales] First-time setup complete.');
  updateSplashStatus('Starting server…');
}

// ─── Splash Screen ────────────────────────────────────────────────────────────
function showSplash() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  splashWindow.center();
}

// ─── Main Window ──────────────────────────────────────────────────────────────
function createWindow() {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
    splashWindow = null;
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'Skales',
    icon: path.join(
      __dirname,
      'icons',
      process.platform === 'darwin' ? 'icon.icns' : 'icon.ico'
    ),
    show: false,
    backgroundColor: '#0a0014',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      spellcheck: false
    }
  });

  mainWindow.setMenuBarVisibility(false);
  const targetURL = `http://localhost:${PORT}`;
  console.log('[Skales] Loading main window:', targetURL);
  mainWindow.loadURL(targetURL);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Handle window.open / target="_blank" / middle-click link behaviour.
  // • Internal localhost links (e.g. /chat, /settings) → navigate the main
  //   window in-place so they never accidentally open a second Electron window.
  // • External URLs → hand off to the OS default browser via shell.openExternal.
  // • Everything else → deny (no new windows ever open inside Electron).
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsed = new URL(url);
      const isLocalhost =
        parsed.hostname === 'localhost' ||
        parsed.hostname === '127.0.0.1';

      if (isLocalhost) {
        // Route internal navigation into the existing window
        setImmediate(() => mainWindow && mainWindow.loadURL(url));
      } else {
        // Open external links in the OS browser
        shell.openExternal(url);
      }
    } catch (_) {
      // Malformed URL — deny silently
    }
    return { action: 'deny' };
  });

  // ── Context menu: enable copy/paste/cut/selectAll in editable fields ────────
  mainWindow.webContents.on('context-menu', (_event, params) => {
    const { Menu, MenuItem } = require('electron');
    const menu = new Menu();
    if (params.selectionText) {
      menu.append(new MenuItem({ label: 'Copy', role: 'copy' }));
    }
    if (params.isEditable) {
      menu.append(new MenuItem({ label: 'Cut', role: 'cut' }));
      menu.append(new MenuItem({ label: 'Paste', role: 'paste' }));
      menu.append(new MenuItem({ type: 'separator' }));
      menu.append(new MenuItem({ label: 'Select All', role: 'selectAll' }));
    }
    if (menu.items.length > 0) {
      menu.popup({ window: mainWindow });
    }
  });

  // Minimize to tray on close
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // ── Desktop Buddy: show/hide with main window visibility ──────────────────
  mainWindow.on('minimize', () => {
    console.log('[Skales] Main window minimized — desktopBuddyEnabled:', desktopBuddyEnabled, '— attempting to show buddy...');
    if (desktopBuddyEnabled) showBuddyWindow();
  });
  mainWindow.on('hide', () => {
    console.log('[Skales] Main window hidden — desktopBuddyEnabled:', desktopBuddyEnabled, '— attempting to show buddy...');
    if (desktopBuddyEnabled) showBuddyWindow();
  });
  mainWindow.on('restore', () => {
    console.log('[Skales] Main window restored — hiding buddy.');
    hideBuddyWindow();
  });
  mainWindow.on('show', () => {
    console.log('[Skales] Main window shown — hiding buddy.');
    hideBuddyWindow();
  });
}

// ─── Desktop Buddy Window ─────────────────────────────────────────────────────
function createBuddyWindow() {
  if (buddyWindow && !buddyWindow.isDestroyed()) return;

  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  console.log('[Skales] Screen workAreaSize:', width, 'x', height);

  // ── Positioning guard: clamp so the window is always fully on-screen ──────
  const WIN_W    = 210;  // narrower — eliminates dead whitespace left of gecko
  const WIN_H    = 400;
  const MARGIN_X = 10;  // px gap from right edge of work area
  const MARGIN_Y = 0;   // 0 = window bottom flush with taskbar top
  const posX = Math.max(0, width  - WIN_W - MARGIN_X);
  const posY = Math.max(0, height - WIN_H - MARGIN_Y);
  console.log('[Skales] Buddy window position → x:', posX, 'y:', posY);

  buddyWindow = new BrowserWindow({
    width:  WIN_W,
    height: WIN_H,
    x: posX,
    y: posY,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',   // fully transparent — no black flash
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    resizable: false,
    movable: true,
    focusable: true,
    show: false,   // hidden until page is loaded — prevents blank transparent flash on first minimize
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      spellcheck: false,
      backgroundThrottling: false,  // keep rendering even when window is in background
    },
  });

  // Use the same dynamic PORT as the main window — never hardcode 3000
  const buddyURL = `http://localhost:${PORT}/buddy`;
  console.log('[Skales] Loading buddy window:', buddyURL);
  buddyWindow.loadURL(buddyURL);
  // Use 'floating' level — sits above normal app windows on both Windows and macOS
  buddyWindow.setAlwaysOnTop(true, 'floating');
  buddyWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false });

  buddyWindow.on('closed', () => {
    console.log('[Skales] Buddy window closed.');
    buddyWindow = null;
  });
}

function showBuddyWindow() {
  if (!buddyWindow || buddyWindow.isDestroyed()) createBuddyWindow();
  // Re-assert floating level so it survives focus changes from other alwaysOnTop apps
  buddyWindow.setAlwaysOnTop(true, 'floating');
  buddyWindow.showInactive();
}

function hideBuddyWindow() {
  if (buddyWindow && !buddyWindow.isDestroyed()) buddyWindow.hide();
}

// ─── Next.js Server ───────────────────────────────────────────────────────────
async function startServer() {
  // Resolve an available port before spawning anything
  PORT = await findAvailablePort();

  const WEB_DIR = getWebDir();
  const DATA_DIR = getDataDir();

  console.log('[Skales] Web dir :', WEB_DIR);
  console.log('[Skales] Data dir:', DATA_DIR);
  console.log('[Skales] Port    :', PORT);

  // Shared environment for both dev and production processes
  const serverEnv = {
    ...process.env,
    PORT: String(PORT),
    BROWSER: 'none',             // Stop Next.js opening its own browser tab
    SKALES_DATA_DIR: DATA_DIR,   // Injected for Next.js to read
    // Passed so server actions (e.g. startTelegramBot) can find telegram-bot.js,
    // whatsapp-bot.js, etc. — in the packaged build, process.cwd() inside the
    // Next.js standalone server resolves to the standalone dir, not apps/web.
    SKALES_WEB_DIR: WEB_DIR,
    // Ensure the server can find native modules in extraResources
    NODE_PATH: path.join(process.resourcesPath || '', 'apps', 'web', 'node_modules'),
    // Propagate timezone to Next.js server
    TZ: (() => {
      const settings = readSettings();
      return settings.timezone || detectedTimezone;
    })()
  };

  // On Windows, hide the console window that would otherwise flash up when
  // spawning a child process. `windowsHide` is silently ignored on macOS/Linux.
  const spawnOpts = { windowsHide: true };

  if (!app.isPackaged) {
    // ── Development ────────────────────────────────────────────────────────
    // Run `npm run dev` in the source tree so hot-reload works.
    const cmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

    serverProcess = spawn(cmd, ['run', 'dev'], {
      cwd: WEB_DIR,
      env: serverEnv,
      ...spawnOpts
    });
} else {
    // ── Production ─────────────────────────────────────────────────────────
    const standaloneDir = path.join(WEB_DIR, '.next', 'standalone');
    const serverScript = path.join(standaloneDir, 'server.js');

    // ── Diagnostic logging ────────────────────────────────────────────────
    // These lines appear in Electron's log and are the first thing to check
    // when the app shows a directory listing or blank page on Windows.
    console.log('[Skales] Standalone dir  :', standaloneDir);
    console.log('[Skales] Server script   :', serverScript);
    console.log('[Skales] Server exists   :', fs.existsSync(serverScript));
    console.log('[Skales] Window will load: http://localhost:' + PORT);

    // ── Guard: abort if server.js is missing ──────────────────────────────
    // Without this guard a missing server.js causes spawn() to fail silently.
    // After the 45-second fallback the main window then opens to a URL with
    // nothing behind it — on Windows this renders as a directory listing.
    if (!fs.existsSync(serverScript)) {
      showSplashError('Server files missing — please reinstall Skales.');
      setTimeout(() => app.quit(), 6000);
      return;
    }

    // ── macOS: use the Helper executable to avoid a "exec" cube in the Dock ──
    // On macOS the Electron binary is a full Cocoa app — spawning it directly
    // (even with ELECTRON_RUN_AS_NODE=1) causes macOS Launch Services to
    // register the child process as a new app and show a generic icon in the
    // Dock.  The packaged .app bundle ships a sibling "Skales Helper.app" whose
    // Info.plist has LSUIElement=1, which tells macOS it is a background-only
    // process and must not appear in the Dock.  We prefer that binary on macOS.
    let serverExec = process.execPath;
    if (process.platform === 'darwin' && app.isPackaged) {
      const helperPath = process.execPath.replace(
        /\/MacOS\/[^/]+$/,
        '/Frameworks/Skales Helper.app/Contents/MacOS/Skales Helper'
      );
      if (fs.existsSync(helperPath)) {
        serverExec = helperPath;
        console.log('[Skales] Using Helper executable for server:', helperPath);
      } else {
        console.warn('[Skales] Helper executable not found, falling back to main binary:', process.execPath);
      }
    }

    serverProcess = spawn(serverExec, [serverScript], {
      cwd: standaloneDir, // Required: tells Next.js where its own directory is
      env: {
        ...serverEnv,
        ELECTRON_RUN_AS_NODE: '1', // Required: makes Skales.exe behave as Node.js
        NEXT_PUBLIC_BASE_PATH: '',
        __NEXT_PRIVATE_STANDALONE_CONFIG: 'true'
      },
      ...spawnOpts
    });
  }

  // ── Stdout / ready detection ──────────────────────────────────────────────
  serverProcess.stdout.on('data', (data) => {
    const msg = data.toString();
    console.log(`[Skales Server] ${msg.trim()}`);

    // Detect ready signal from both `next dev` and the standalone server.js.
    // Next.js 13/14/15 prints one of these strings when it's listening.
    if (
      !serverReady &&
      (msg.includes('Ready on') ||
        msg.includes('started server on') ||
        msg.includes('Local:') ||
        msg.includes('ready started') ||
        msg.includes(`Listening on`) ||
        msg.includes(`:${PORT}`))
    ) {
      serverReady = true;
      console.log('[Skales] Server ready — opening window.');
      createWindow();
      // Pre-warm the buddy window so it's fully loaded before the user's first minimize.
      // The window stays hidden (show:false in createBuddyWindow) until showBuddyWindow() is called.
      if (desktopBuddyEnabled) {
        setTimeout(() => {
          if (!buddyWindow || buddyWindow.isDestroyed()) {
            console.log('[Skales] Pre-creating buddy window (hidden)...');
            createBuddyWindow();
          }
        }, 3000); // small delay so the main window finishes loading first
      }
    }
  });

  // Collect stderr for diagnostics — shown in splash if server exits early
  let stderrBuffer = '';
  serverProcess.stderr.on('data', (data) => {
    const msg = data.toString().trim();
    // Next.js writes some normal startup logs to stderr — don't treat as fatal
    console.error(`[Skales Server] ${msg}`);
    // Keep only the last 300 chars for the error splash (enough to diagnose)
    stderrBuffer = (stderrBuffer + '\n' + msg).slice(-300).trim();
  });

  serverProcess.on('close', (code) => {
    console.log(`[Skales] Server process exited (code ${code})`);
    if (!serverReady) {
      // Server died before the app window ever opened — show a human-readable
      // error on the splash and quit rather than opening a broken window after
      // the 45-second fallback fires.
      const hint = stderrBuffer
        ? stderrBuffer.split('\n').pop().slice(0, 120)   // last stderr line
        : 'Check that no other Skales instance is running.';
      showSplashError(`Server stopped (code ${code}).\n${hint}`);
      setTimeout(() => app.quit(), 8000);
    } else if (!app.isQuitting) {
      // Server died while the app was already running (e.g. user force-quit the
      // helper process, or an unexpected crash).  Without this branch the main
      // window goes white and the user is stuck — nothing responds because the
      // Next.js backend is gone.  Show a dialog offering to restart Skales.
      console.error('[Skales] Server exited unexpectedly after startup — prompting user to restart.');
      const win = mainWindow && !mainWindow.isDestroyed() ? mainWindow : null;
      const dialogOpts = {
        type: 'error',
        title: 'Skales — Server Stopped',
        message: 'The Skales server stopped unexpectedly.',
        detail: 'This can happen if the background helper process is force-quit.\nRestart Skales to continue.',
        buttons: ['Restart Skales', 'Quit'],
        defaultId: 0,
        cancelId: 1,
      };
      const showDialog = win
        ? dialog.showMessageBox(win, dialogOpts)
        : dialog.showMessageBox(dialogOpts);
      showDialog.then(({ response }) => {
        if (response === 0) {
          app.relaunch();
          app.quit();
        } else {
          app.quit();
        }
      });
    }
  });

  // ── Fallback timer ────────────────────────────────────────────────────────
  // If no ready signal arrives within 45 s, open anyway rather than hang.
  setTimeout(() => {
    if (!serverReady) {
      console.warn('[Skales] Server ready signal timed out — opening window anyway.');
      serverReady = true;
      createWindow();
    }
  }, 45_000);
}

// ─── Telemetry (anonymous, opt-in only) ──────────────────────────────────────
// Only sends: app version, OS, event name, anonymous UUID.
// Never sends: API keys, conversations, personal data, stack traces.
// Opt-in: fires only when settings.telemetry_enabled === true.
function sendTelemetry(event, extra) {
  try {
    const settings = readSettings();
    if (!settings.telemetry_enabled) return;

    // Generate or reuse anonymous UUID (never regenerated)
    let anonId = settings.telemetry_anonymous_id;
    if (!anonId) {
      anonId = require('crypto').randomUUID?.() ||
               Math.random().toString(36).slice(2) + Date.now().toString(36);
      writeSettings({ telemetry_anonymous_id: anonId });
    }

    const payload = JSON.stringify({
      type:         'telemetry',
      version:      '6.0.0',
      os:           process.platform,
      event,
      anonymous_id: anonId,
      ...extra,
    });

    // Fire-and-forget via https.request — never blocks the app
    const url = new URL('https://skales.app/api/collect.php');
    const opts = {
      hostname: url.hostname,
      path:     url.pathname,
      method:   'POST',
      headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
    };
    const req = require('https').request(opts);
    req.on('error', () => {}); // silently ignore
    req.write(payload);
    req.end();
  } catch { /* never crash for telemetry */ }
}

// ─── App Lifecycle ────────────────────────────────────────────────────────────
app.on('ready', async () => {
  // Detect system timezone on startup
  detectedTimezone = detectSystemTimezone();
  console.log('[Skales] Detected system timezone:', detectedTimezone);

  // Load persisted settings before anything else
  try { desktopBuddyEnabled = !!readSettings().desktopBuddy; } catch { desktopBuddyEnabled = false; }
  console.log('[Skales] Desktop Buddy enabled (persisted):', desktopBuddyEnabled);

  // Anonymous app_start telemetry (opt-in only)
  sendTelemetry('app_start');

  showSplash();
  createTray(() => mainWindow, app, () => PORT);
  setupUpdater(() => mainWindow);
  try {
    await ensureNodeModules(); // no-op on macOS; extracts tar.gz on first Windows launch
    await startServer();
  } catch (err) {
    console.error('[Skales] Failed to start server:', err.message);
    showSplashError(`Failed to start: ${err.message}`);
    setTimeout(() => app.quit(), 6000);
  }
});

// Keep the app alive in the tray when windows are closed
app.on('window-all-closed', () => {
  // Intentionally do NOT quit here — Skales lives in the tray
});

app.on('activate', () => {
  // macOS: re-open the window when clicking the Dock icon
  if (mainWindow === null) {
    if (serverReady) createWindow();
  } else {
    mainWindow.show();
  }
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────
// Give the Next.js server up to 5 seconds to finish in-flight requests before
// force-killing it. This prevents half-written data / torn bot sessions.
function stopServer() {
  return new Promise((resolve) => {
    if (!serverProcess) return resolve();
    const proc = serverProcess;
    serverProcess = null;

    let done = false;
    const finish = () => {
      if (!done) { done = true; resolve(); }
    };

    proc.once('exit', finish);

    // Ask nicely first (SIGTERM on POSIX, TerminateProcess on Windows)
    try { proc.kill('SIGTERM'); } catch (_) { /* already gone */ }

    // Force-kill after 5 s if it hasn't stopped
    const timer = setTimeout(() => {
      try { proc.kill('SIGKILL'); } catch (_) { /* already gone */ }
      finish();
    }, 5000);

    // Don't keep the event loop alive for the timer alone
    if (timer.unref) timer.unref();
  });
}

app.on('before-quit', (event) => {
  app.isQuitting = true;
  hideBuddyWindow();
  if (serverProcess) {
    // Pause the quit sequence, drain the server, then re-trigger quit.
    event.preventDefault();
    stopServer().then(() => app.quit());
  }
});

// ─── Open-Chat IPC (from Buddy window "Open Chat →" button) ──────────────────
// Shows the main Skales window and navigates directly to the chat route.
ipcMain.on('open-chat', () => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.show();
  mainWindow.focus();
  // Navigate to /chat — loadURL triggers Next.js routing cleanly
  mainWindow.loadURL(`http://localhost:${PORT}/chat`).catch(err => {
    console.error('[Skales] open-chat navigation failed:', err.message);
  });
});

// ─── Desktop Buddy IPC ────────────────────────────────────────────────────────

// get-desktop-buddy: reads in-memory value (loaded from disk at startup)
ipcMain.handle('get-desktop-buddy', () => desktopBuddyEnabled);

// set-desktop-buddy: saves to disk so the setting survives restarts
ipcMain.on('set-desktop-buddy', (_event, enabled) => {
  desktopBuddyEnabled = !!enabled;
  writeSettings({ desktopBuddy: desktopBuddyEnabled });  // persist to settings.json
  console.log('[Skales] Desktop Buddy set to:', desktopBuddyEnabled);
  if (desktopBuddyEnabled) {
    // Only show if the main window is currently hidden/minimized
    const mainHidden = !mainWindow || mainWindow.isMinimized() || !mainWindow.isVisible();
    if (mainHidden) showBuddyWindow();
  } else {
    hideBuddyWindow();
  }
});

// ─── Execute Custom Skill IPC ─────────────────────────────────────────────────
// Forwards skill execution requests from the renderer to the Next.js backend.
// Called via window.skales.executeSkill(skillId, args) from any renderer.
ipcMain.handle('execute-skill', async (_event, skillId, args) => {
  try {
    const res = await fetch(`http://localhost:${PORT}/api/custom-skills/execute`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ skillId, args }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error(`[Skales] execute-skill (${skillId}) HTTP ${res.status}:`, data);
    }
    return data;
  } catch (e) {
    console.error(`[Skales] execute-skill (${skillId}) failed:`, e.message);
    return { error: e.message };
  }
});

// ─── Local bug report fallback ──────────────────────────────────────────────
// If the remote endpoint is unreachable, save the report to DATA_DIR/bugreports.jsonl
// so it can be reviewed and submitted later.
ipcMain.handle('save-bug-report', (_event, payload) => {
  try {
    const DATA_DIR   = getDataDir();
    const reportPath = path.join(DATA_DIR, 'bugreports.jsonl');
    const line       = JSON.stringify({ ...payload, saved_at: new Date().toISOString() });
    fs.appendFileSync(reportPath, line + '\n', 'utf-8');
    console.log('[Skales] Bug report saved locally:', reportPath);
    return { ok: true };
  } catch (e) {
    console.error('[Skales] save-bug-report failed:', e.message);
    return { ok: false, error: e.message };
  }
});
