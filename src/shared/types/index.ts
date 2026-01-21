// Shared TypeScript types for the GlassPi Dashboard

// ============================================
// User & Settings
// ============================================

export interface UserConfig {
  displayName: string
  timezone: string
}

export interface WeatherSettings {
  locationMode: 'city' | 'latlon'
  cityName?: string
  latitude?: number
  longitude?: number
  units: 'metric' | 'imperial'
}

export interface IntegrationToggle {
  enabled: boolean
}

export interface IntegrationSettings {
  spotify: IntegrationToggle
  strava: IntegrationToggle
  weather: IntegrationToggle
}

export interface Settings {
  mockMode: boolean
  debugMode: boolean
  brightness: {
    enabled: boolean
    current: number
    nightMode: boolean
    nightStart: string // "22:00"
    nightEnd: string // "07:00"
    nightBrightness: number // 0-100, default 20
  }
  notifications: {
    enabled: boolean
    soundEnabled: boolean
    quietHoursEnabled: boolean
  }
  weather: WeatherSettings
  ai: AIConfig
  integrations: IntegrationSettings
}

// ============================================
// Tasks
// ============================================

export type TaskType = 'daily' | 'oneoff'

export interface Task {
  id: string
  title: string
  type: TaskType
  scheduleJson?: string // JSON for recurring schedule
  isActive: boolean
  createdAt: number // Unix timestamp
}

export interface TaskCompletion {
  id: string
  taskId: string
  completionDay: number // YYYYMMDD logical day
  completedAt: number // Unix timestamp
}

export type SuggestionStatus = 'pending' | 'accepted' | 'dismissed'

export interface TaskSuggestion {
  id: string
  logicalDay: number // YYYYMMDD
  title: string
  reason: string
  source: string // "ai" or "system"
  status: SuggestionStatus
  createdAt: number // Unix timestamp
}

// ============================================
// Strava
// ============================================

export interface StravaActivity {
  id: string
  startDate: number // Unix timestamp
  type: string
  distanceM: number
  movingTimeS: number
  elapsedTimeS: number
  averageSpeed: number
  averageHeartrate?: number
  rawJson: string
}

export interface StravaDailyAgg {
  day: number // YYYYMMDD
  distanceM: number
  runCount: number
  movingTimeS: number
}

export interface StravaStatus {
  connected: boolean
  lastSync?: number
  weeklyDistance: number
  weeklyTarget: number
  weekData: number[] // 7 days
}

// ============================================
// Health
// ============================================

export interface HealthSnapshot {
  ts: number // Unix timestamp (primary key)
  steps: number
  activeCals: number
  sleepMinutes: number
  rawJson: string
}

export interface HealthStatus {
  lastSync?: number
  steps: number
  stepsPercent: number
  calories: number
  caloriesPercent: number
  sleepMinutes: number
  warningDays?: number // Days since last sync
}

export interface HealthPayload {
  steps: number
  activeCalories: number
  sleepMinutes: number
  timestamp: number
}

// ============================================
// Bible
// ============================================

export interface BiblePlanDay {
  dayIndex: number
  date: number // Unix timestamp or YYYYMMDD
  reference: string
  source: string // "NIV"
  title?: string
}

export interface BibleCompletion {
  date: number // YYYYMMDD (primary key)
  completedAt: number // Unix timestamp
}

export interface BibleStatus {
  todayReference: string
  source: string
  completed: boolean
  dayIndex: number
}

// ============================================
// Spotify
// ============================================

export interface SpotifyNowPlaying {
  ts: number // Unix timestamp (primary key)
  isPlaying: boolean
  track: string
  artist: string
  album: string
  albumArtUrl?: string
  progressMs: number
  durationMs: number
  rawJson: string
}

export interface SpotifyStatus {
  connected: boolean
  isPlaying: boolean
  track: string
  artist: string
  album: string
  albumArt?: string
  progressMs: number
  durationMs: number
}

// ============================================
// Weather
// ============================================

export interface WeatherForecastEntry {
  day: string
  high: number | null
  low: number | null
  icon?: string
}

export interface WeatherStatus {
  locationName: string
  temperature: number | null
  high: number | null
  low: number | null
  condition?: string
  icon?: string
  lastUpdated?: number
  forecast?: WeatherForecastEntry[]
}

// ============================================
// Dashboard Snapshot (Main IPC response)
// ============================================

export interface DashboardSnapshot {
  displayName: string
  timezone: string
  settings: Settings
  hasOpenAIKey?: boolean
  tasks: Task[]
  taskCompletions: TaskCompletion[]
  suggestions: TaskSuggestion[]
  strava: StravaStatus | null
  health: HealthStatus | null
  spotify: SpotifyStatus | null
  bible: BibleStatus | null
  weather: WeatherStatus | null
  lastSync: {
    strava?: number
    health?: number
    spotify?: number
    ai?: number
    weather?: number
  }
}

// ============================================
// API & OAuth
// ============================================

export interface OAuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
  scope?: string
}

export interface AuthStatus {
  connected: boolean
  expiresAt?: number
  needsRefresh?: boolean
}

// ============================================
// Brightness
// ============================================

export interface BrightnessSupport {
  supported: boolean
  path?: string
  maxBrightness?: number
  currentBrightness?: number
}

export interface BrightnessSchedule {
  enabled: boolean
  entries: BrightnessScheduleEntry[]
}

export interface BrightnessScheduleEntry {
  time: string // "HH:MM"
  brightness: number // 0-100
}

// ============================================
// App Info
// ============================================

export interface AppInfo {
  version: string
  platform: string
  arch: string
  isKiosk: boolean
}

// ============================================
// Logical Day Utility Types
// ============================================

export type LogicalDay = number // YYYYMMDD format

// ============================================
// AI Task Generation
// ============================================

export interface AITaskSuggestion {
  title: string
  reason: string
}

export interface AITaskResponse {
  suggestions: AITaskSuggestion[]
}

export interface AIConfig {
  model: string
  maxSuggestionsPerDay: number
  autoGenerateEnabled: boolean
  autoGenerateTime: string // "12:00"
}
