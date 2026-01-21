import { ipcRenderer, contextBridge } from 'electron'
import type { WeatherSettings } from '../src/shared/types'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Dashboard data
  getDashboardSnapshot: () => ipcRenderer.invoke('get-dashboard-snapshot'),

  // App info
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  isEncryptionAvailable: () => ipcRenderer.invoke('is-encryption-available'),

  // Settings
  getSetting: (key: string) => ipcRenderer.invoke('get-setting', key),
  setSetting: (key: string, value: unknown) => ipcRenderer.invoke('set-setting', key, value),
  getWeatherSettings: () => ipcRenderer.invoke('get-weather-settings'),
  setWeatherSettings: (settings: WeatherSettings) =>
    ipcRenderer.invoke('set-weather-settings', settings),
  searchCities: (query: string) => ipcRenderer.invoke('search-cities', query),

  // Tasks
  getTasks: () => ipcRenderer.invoke('get-tasks'),
  createTask: (task: unknown) => ipcRenderer.invoke('create-task', task),
  updateTask: (id: string, updates: unknown) => ipcRenderer.invoke('update-task', id, updates),
  deleteTask: (id: string) => ipcRenderer.invoke('delete-task', id),
  completeTask: (id: string) => ipcRenderer.invoke('complete-task', id),

  // AI Suggestions
  getTaskSuggestions: () => ipcRenderer.invoke('get-task-suggestions'),
  acceptSuggestion: (id: string) => ipcRenderer.invoke('accept-suggestion', id),
  dismissSuggestion: (id: string) => ipcRenderer.invoke('dismiss-suggestion', id),
  triggerAISuggestions: () => ipcRenderer.invoke('trigger-ai-suggestions'),
  getOpenAIKeyStatus: () => ipcRenderer.invoke('get-openai-key-status'),
  setOpenAIKey: (key: string | null) => ipcRenderer.invoke('set-openai-key', key),

  // Strava
  getStravaStatus: () => ipcRenderer.invoke('get-strava-status'),
  getStravaAuthUrl: () => ipcRenderer.invoke('get-strava-auth-url'),
  disconnectStrava: () => ipcRenderer.invoke('disconnect-strava'),

  // Spotify
  getSpotifyStatus: () => ipcRenderer.invoke('get-spotify-status'),
  getSpotifyAuthUrl: () => ipcRenderer.invoke('get-spotify-auth-url'),
  getSpotifyNowPlaying: () => ipcRenderer.invoke('get-spotify-now-playing'),
  disconnectSpotify: () => ipcRenderer.invoke('disconnect-spotify'),

  // Health
  getHealthStatus: () => ipcRenderer.invoke('get-health-status'),
  getHealthEndpointInfo: () => ipcRenderer.invoke('get-health-endpoint-info'),

  // Bible
  getBibleToday: () => ipcRenderer.invoke('get-bible-today'),
  markBibleComplete: () => ipcRenderer.invoke('mark-bible-complete'),

  // Brightness
  getBrightnessSupport: () => ipcRenderer.invoke('get-brightness-support'),
  getBrightness: () => ipcRenderer.invoke('get-brightness'),
  setBrightness: (value: number) => ipcRenderer.invoke('set-brightness', value),
  getBrightnessSchedule: () => ipcRenderer.invoke('get-brightness-schedule'),
  setBrightnessSchedule: (schedule: unknown) =>
    ipcRenderer.invoke('set-brightness-schedule', schedule),
  exportDatabase: () => ipcRenderer.invoke('export-database'),
  resetDemoData: () => ipcRenderer.invoke('reset-demo-data'),

  // Event listeners
  onMainProcessMessage: (callback: (message: string) => void) => {
    ipcRenderer.on('main-process-message', (_event, message) => callback(message))
  },
  onSpotifyUpdate: (callback: (data: unknown) => void) => {
    ipcRenderer.on('spotify-update', (_event, data) => callback(data))
  },
  onNotification: (callback: (data: unknown) => void) => {
    ipcRenderer.on('notification', (_event, data) => callback(data))
  },
})

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      getDashboardSnapshot: () => Promise<unknown>
      getAppInfo: () => Promise<{
        version: string
        platform: string
        arch: string
        isKiosk: boolean
      }>
      isEncryptionAvailable: () => Promise<boolean>
      getSetting: (key: string) => Promise<unknown>
      setSetting: (key: string, value: unknown) => Promise<void>
      getWeatherSettings: () => Promise<WeatherSettings>
      setWeatherSettings: (settings: WeatherSettings) => Promise<void>
      searchCities: (query: string) => Promise<Array<{ name: string; latitude: number; longitude: number }>>
      getTasks: () => Promise<unknown[]>
      createTask: (task: unknown) => Promise<string>
      updateTask: (id: string, updates: unknown) => Promise<void>
      deleteTask: (id: string) => Promise<void>
      completeTask: (id: string) => Promise<void>
      getTaskSuggestions: () => Promise<unknown[]>
      acceptSuggestion: (id: string) => Promise<void>
      dismissSuggestion: (id: string) => Promise<void>
      triggerAISuggestions: () => Promise<{ success: boolean; reason?: string; suggestions?: unknown[] }>
      getOpenAIKeyStatus: () => Promise<{ hasKey: boolean }>
      setOpenAIKey: (key: string | null) => Promise<{ saved: boolean }>
      getStravaStatus: () => Promise<unknown>
      getStravaAuthUrl: () => Promise<string>
      disconnectStrava: () => Promise<void>
      getSpotifyStatus: () => Promise<unknown>
      getSpotifyAuthUrl: () => Promise<string>
      getSpotifyNowPlaying: () => Promise<unknown>
      disconnectSpotify: () => Promise<void>
      getHealthStatus: () => Promise<unknown>
      getHealthEndpointInfo: () => Promise<{ ip: string; port: number; endpoint: string }>
      getBibleToday: () => Promise<unknown>
      markBibleComplete: () => Promise<void>
      getBrightnessSupport: () => Promise<boolean>
      getBrightness: () => Promise<number>
      setBrightness: (value: number) => Promise<void>
      getBrightnessSchedule: () => Promise<unknown>
      setBrightnessSchedule: (schedule: unknown) => Promise<void>
      exportDatabase: () => Promise<{ canceled: boolean; filePath?: string }>
      resetDemoData: () => Promise<{ success: boolean }>
      onMainProcessMessage: (callback: (message: string) => void) => void
      onSpotifyUpdate: (callback: (data: unknown) => void) => void
      onNotification: (callback: (data: unknown) => void) => void
    }
  }
}
