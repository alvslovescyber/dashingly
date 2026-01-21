import { app, BrowserWindow, dialog, ipcMain, safeStorage } from 'electron'
import { promises as fs } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import {
  initDatabase,
  closeDatabase,
  getSetting,
  setSetting,
  getDatabasePath,
} from '../src/main/db/database'
import { getDashboardSnapshot } from '../src/main/db/snapshot'
import { seedDatabase } from '../src/main/db/seed'
import {
  completeTask,
  createTask,
  updateTask,
  deleteTask,
  acceptSuggestion,
  dismissSuggestion,
  markBibleComplete,
  getSettingValue,
  setSettingValue,
} from '../src/main/db/actions'
import {
  getWeatherSettings,
  saveWeatherSettings,
  getWeatherStatus,
  searchCities,
} from '../src/main/integrations/weather'
import { generateTaskSuggestions, canRunAI } from '../src/main/integrations/ai-tasks'
import { clearSecureValue, hasSecureValue, saveSecureValue } from '../src/main/security/secure-store'
import type { WeatherSettings } from '../src/shared/types'

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
    ...(IS_PI
      ? {
          fullscreen: true,
          kiosk: true,
          frame: false,
          autoHideMenuBar: true,
        }
      : {
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
    return getDashboardSnapshot()
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

  // Seed database (dev only)
  ipcMain.handle('seed-database', async () => {
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged
    if (!isDev) {
      throw new Error('Seeding is only available in development mode')
    }
    seedDatabase()
    return { success: true }
  })

  // Settings
  ipcMain.handle('get-setting', async (_event, key: string) => {
    return getSettingValue(key, null)
  })

  ipcMain.handle('set-setting', async (_event, key: string, value: unknown) => {
    setSettingValue(key, value)
  })

  ipcMain.handle('get-weather-settings', async () => {
    return getWeatherSettings()
  })

  ipcMain.handle('set-weather-settings', async (_event, settings: WeatherSettings) => {
    saveWeatherSettings(settings)
    await getWeatherStatus() // refresh cache for new location
  })

  ipcMain.handle('search-cities', async (_event, query: string) => {
    return searchCities(query)
  })

  // Task actions
  ipcMain.handle('complete-task', async (_event, taskId: string) => {
    completeTask(taskId)
  })

  ipcMain.handle(
    'create-task',
    async (_event, task: { title: string; type?: 'daily' | 'oneoff' }) => {
      return createTask(task.title, task.type)
    }
  )

  ipcMain.handle(
    'update-task',
    async (_event, id: string, updates: { title?: string; type?: string; isActive?: boolean }) => {
      updateTask(id, updates)
    }
  )

  ipcMain.handle('delete-task', async (_event, id: string) => {
    deleteTask(id)
  })

  // AI Suggestion actions
  ipcMain.handle('accept-suggestion', async (_event, id: string) => {
    acceptSuggestion(id)
  })

  ipcMain.handle('dismiss-suggestion', async (_event, id: string) => {
    dismissSuggestion(id)
  })

  ipcMain.handle('trigger-ai-suggestions', async () => {
    const status = canRunAI()
    if (!status.allowed) {
      return { success: false, reason: status.reason }
    }

    try {
      const suggestions = await generateTaskSuggestions()
      return { success: true, suggestions }
    } catch (error) {
      console.error('Manual AI trigger failed', error)
      return { success: false, reason: 'Failed to generate suggestions' }
    }
  })

  ipcMain.handle('get-openai-key-status', () => {
    return { hasKey: hasSecureValue('openai_api_key') }
  })

  ipcMain.handle('set-openai-key', async (_event, key: string | null) => {
    if (!key || !key.trim()) {
      clearSecureValue('openai_api_key')
      return { saved: false }
    }

    saveSecureValue('openai_api_key', key.trim())
    return { saved: true }
  })

  // Bible actions
  ipcMain.handle('mark-bible-complete', async () => {
    markBibleComplete()
  })

  // Data utilities
  ipcMain.handle('export-database', async () => {
    const windowRef = mainWindow ?? BrowserWindow.getFocusedWindow()
    const dialogOptions: Electron.SaveDialogOptions = {
      title: 'Export GlassPi Database',
      defaultPath: 'glasspi-backup.db',
      buttonLabel: 'Export',
      filters: [
        { name: 'SQLite Database', extensions: ['db'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    } as const

    const { canceled, filePath } = windowRef
      ? await dialog.showSaveDialog(windowRef, dialogOptions)
      : await dialog.showSaveDialog(dialogOptions)

    if (canceled || !filePath) {
      return { canceled: true }
    }

    await fs.copyFile(getDatabasePath(), filePath)
    return { canceled: false, filePath }
  })

  ipcMain.handle('reset-demo-data', async () => {
    seedDatabase()
    return { success: true }
  })
}

// App lifecycle
app.whenReady().then(() => {
  // Initialize database before anything else
  initDatabase()

  // Auto-seed in development if database is empty
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged
  if (isDev) {
    const hasSeeded = getSetting<boolean>('_hasSeeded', false)
    if (!hasSeeded) {
      console.log('First run in dev mode - seeding database with demo data...')
      seedDatabase()
      setSetting('_hasSeeded', true)
    }
  }

  setupIPC()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  // Close database before quitting
  closeDatabase()

  if (process.platform !== 'darwin') {
    app.quit()
    mainWindow = null
  }
})

// Handle uncaught exceptions
process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})
