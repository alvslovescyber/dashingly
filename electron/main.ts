import { app, BrowserWindow, ipcMain, safeStorage } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// App root directory
process.env.APP_ROOT = path.join(__dirname, '..')

// Paths
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'assets')
  : RENDERER_DIST

// Kiosk mode configuration
const KIOSK_WIDTH = 800
const KIOSK_HEIGHT = 480
const IS_PI = process.platform === 'linux' && process.arch === 'arm64'

let mainWindow: BrowserWindow | null

function createWindow() {
  // Window options based on environment
  const windowOptions: Electron.BrowserWindowConstructorOptions = {
    width: KIOSK_WIDTH,
    height: KIOSK_HEIGHT,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    // Kiosk mode settings for Pi
    ...(IS_PI ? {
      fullscreen: true,
      kiosk: true,
      frame: false,
      autoHideMenuBar: true,
    } : {
      // Dev mode settings
      fullscreen: false,
      frame: true,
      resizable: true,
    }),
    // Common settings
    backgroundColor: '#000000',
    show: false, // Show after ready-to-show
  }

  mainWindow = new BrowserWindow(windowOptions)

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
    
    // Hide cursor in kiosk mode
    if (IS_PI) {
      mainWindow?.webContents.insertCSS('* { cursor: none !important; }')
    }
  })

  // Load the app
  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
    // Open DevTools in development
    if (!IS_PI) {
      mainWindow.webContents.openDevTools({ mode: 'detach' })
    }
  } else {
    mainWindow.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Prevent navigation away from app
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(VITE_DEV_SERVER_URL || 'file://')) {
      event.preventDefault()
    }
  })
}

// IPC Handlers
function setupIPC() {
  // Get dashboard snapshot (main data fetch)
  ipcMain.handle('get-dashboard-snapshot', async () => {
    // TODO: Implement database query
    return {
      displayName: 'Friend',
      tasks: [],
      strava: null,
      health: null,
      spotify: null,
      bible: null,
      lastSync: {},
    }
  })

  // Check if safe storage is available
  ipcMain.handle('is-encryption-available', () => {
    return safeStorage.isEncryptionAvailable()
  })

  // Get app info
  ipcMain.handle('get-app-info', () => {
    return {
      version: app.getVersion(),
      platform: process.platform,
      arch: process.arch,
      isKiosk: IS_PI,
    }
  })
}

// App lifecycle
app.whenReady().then(() => {
  setupIPC()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    mainWindow = null
  }
})

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})
