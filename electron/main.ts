import { app, BrowserWindow, dialog, ipcMain, safeStorage } from 'electron'
import { promises as fs } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import {
  initDatabase,
  closeDatabase,
  getSetting,
  setSetting,
  deleteSetting,
  getDatabasePath,
  getLastSync,
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
import { startAuthServer, stopAuthServer, getAuthServerInfo } from '../src/main/auth/oauth-server'
import { controlSpotifyPlayback } from '../src/main/db/snapshot'
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
let authServerReady = false

type CredentialService = 'spotify' | 'strava'

const integrationSecretKeys: Record<CredentialService, { clientId: string; clientSecret: string }> = {
  spotify: { clientId: 'spotify_client_id', clientSecret: 'spotify_client_secret' },
  strava: { clientId: 'strava_client_id', clientSecret: 'strava_client_secret' },
}

function persistSecret(key: string, value: string | null | undefined) {
  if (value === undefined) return
  if (!value || !value.trim()) {
    clearSecureValue(key)
    return
  }
  saveSecureValue(key, value.trim())
}

function getIntegrationStatusPayload() {
  const weatherSettings = getWeatherSettings()
  return {
    spotify: {
      connected: getSetting<boolean>('spotify_connected', false),
      lastSync: getLastSync('spotify'),
      hasClientId: hasSecureValue('spotify_client_id') || Boolean(process.env.SPOTIFY_CLIENT_ID),
      hasClientSecret:
        hasSecureValue('spotify_client_secret') || Boolean(process.env.SPOTIFY_CLIENT_SECRET),
    },
    strava: {
      connected: getSetting<boolean>('strava_connected', false),
      lastSync: getLastSync('strava'),
      hasClientId: hasSecureValue('strava_client_id') || Boolean(process.env.STRAVA_CLIENT_ID),
      hasClientSecret:
        hasSecureValue('strava_client_secret') || Boolean(process.env.STRAVA_CLIENT_SECRET),
    },
    weather: {
      hasLocation: Boolean(weatherSettings.cityName || weatherSettings.latitude),
      lastSync: getLastSync('weather'),
    },
  }
}

function disconnectIntegration(service: CredentialService) {
  switch (service) {
    case 'spotify':
      deleteSetting('spotify_tokens')
      setSetting('spotify_connected', false)
      break
    case 'strava':
      deleteSetting('strava_tokens')
      deleteSetting('strava_athlete')
      setSetting('strava_connected', false)
      break
    default:
      throw new Error(`Unsupported integration: ${service}`)
  }
}

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

  // Integrations and credentials
  ipcMain.handle('get-integration-status', () => {
    return getIntegrationStatusPayload()
  })

  ipcMain.handle(
    'set-integration-credentials',
    async (
      _event,
      payload: { service: CredentialService; clientId?: string | null; clientSecret?: string | null }
    ) => {
      const keys = integrationSecretKeys[payload.service]
      if (!keys) {
        throw new Error(`Unknown integration: ${payload.service}`)
      }
      persistSecret(keys.clientId, payload.clientId)
      persistSecret(keys.clientSecret, payload.clientSecret)
      return { success: true }
    }
  )

  ipcMain.handle('disconnect-integration', async (_event, service: CredentialService) => {
    disconnectIntegration(service)
    return { success: true }
  })

  ipcMain.handle('test-integration', async (_event, service: string) => {
    switch (service) {
      case 'spotify': {
        const connected = getSetting<boolean>('spotify_connected', false)
        const lastSync = getLastSync('spotify')
        return {
          success: connected,
          message: connected
            ? lastSync
              ? `Last playback ${new Date(lastSync).toLocaleString()}`
              : 'Connected. Waiting for playback data.'
            : 'Spotify is not connected.',
        }
      }
      case 'strava': {
        const connected = getSetting<boolean>('strava_connected', false)
        const lastSync = getLastSync('strava')
        return {
          success: connected,
          message: connected
            ? lastSync
              ? `Last sync ${new Date(lastSync).toLocaleString()}`
              : 'Connected. Waiting for your first sync.'
            : 'Strava is not connected.',
        }
      }
      case 'weather': {
        await getWeatherStatus()
        const lastSync = getLastSync('weather')
        return {
          success: true,
          message: lastSync
            ? `Weather refreshed ${new Date(lastSync).toLocaleString()}`
            : 'Weather will update shortly.',
        }
      }
      default:
        return { success: false, message: 'Unknown integration' }
    }
  })

  ipcMain.handle('get-strava-status', () => getIntegrationStatusPayload().strava)
  ipcMain.handle('get-spotify-status', () => getIntegrationStatusPayload().spotify)

  ipcMain.handle('disconnect-spotify', () => {
    disconnectIntegration('spotify')
  })

  ipcMain.handle('disconnect-strava', () => {
    disconnectIntegration('strava')
  })

  // Spotify playback controls
  ipcMain.handle('spotify-play', async () => controlSpotifyPlayback('play'))
  ipcMain.handle('spotify-pause', async () => controlSpotifyPlayback('pause'))
  ipcMain.handle('spotify-next', async () => controlSpotifyPlayback('next'))
  ipcMain.handle('spotify-previous', async () => controlSpotifyPlayback('previous'))

  ipcMain.handle('get-strava-auth-url', () => {
    if (!authServerReady) {
      throw new Error('Auth server is not ready yet')
    }
    const { baseUrl } = getAuthServerInfo()
    return `${baseUrl}/oauth/strava/start`
  })

  ipcMain.handle('get-spotify-auth-url', () => {
    if (!authServerReady) {
      throw new Error('Auth server is not ready yet')
    }
    const { baseUrl } = getAuthServerInfo()
    return `${baseUrl}/oauth/spotify/start`
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

  startAuthServer()
    .then(() => {
      authServerReady = true
    })
    .catch(error => {
      authServerReady = false
      console.error('Failed to start auth server', error)
    })

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
  stopAuthServer().catch(error => {
    console.error('Failed to stop auth server', error)
  })

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
