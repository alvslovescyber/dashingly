import { getDatabase, getSetting, getLastSync } from './database'
import { getTodayLogicalDay, getWeekLogicalDays } from '../../shared/utils/logical-day'
import type {
  DashboardSnapshot,
  Task,
  TaskCompletion,
  TaskSuggestion,
  StravaStatus,
  HealthStatus,
  SpotifyStatus,
  BibleStatus,
  Settings,
} from '../../shared/types'

/**
 * Get the complete dashboard snapshot in a single query
 * This is the main IPC call for the renderer to get all data
 */
export function getDashboardSnapshot(): DashboardSnapshot {
  const db = getDatabase()
  const today = getTodayLogicalDay()
  const weekDays = getWeekLogicalDays(today)

  // User config
  const displayName = getSetting<string>('displayName', 'Friend')
  const timezone = getSetting<string>('timezone', 'America/New_York')

  // Settings
  const settings = getSetting<Settings>('settings', getDefaultSettings())

  // Tasks
  const tasks = db
    .prepare(
      `
      SELECT id, title, type, schedule_json, is_active, created_at
      FROM tasks
      WHERE is_active = 1
      ORDER BY created_at DESC
    `
    )
    .all() as Array<{
    id: string
    title: string
    type: string
    schedule_json: string | null
    is_active: number
    created_at: number
  }>

  const mappedTasks: Task[] = tasks.map(t => ({
    id: t.id,
    title: t.title,
    type: t.type as 'daily' | 'oneoff',
    scheduleJson: t.schedule_json ?? undefined,
    isActive: Boolean(t.is_active),
    createdAt: t.created_at,
  }))

  // Today's completions
  const taskCompletions = db
    .prepare(
      `
      SELECT id, task_id, completion_day, completed_at
      FROM task_completions
      WHERE completion_day = ?
    `
    )
    .all(today) as Array<{
    id: string
    task_id: string
    completion_day: number
    completed_at: number
  }>

  const mappedCompletions: TaskCompletion[] = taskCompletions.map(c => ({
    id: c.id,
    taskId: c.task_id,
    completionDay: c.completion_day,
    completedAt: c.completed_at,
  }))

  // Pending suggestions
  const suggestions = db
    .prepare(
      `
      SELECT id, logical_day, title, reason, source, status, created_at
      FROM task_suggestions
      WHERE status = 'pending' AND logical_day = ?
      ORDER BY created_at DESC
    `
    )
    .all(today) as Array<{
    id: string
    logical_day: number
    title: string
    reason: string
    source: string
    status: string
    created_at: number
  }>

  const mappedSuggestions: TaskSuggestion[] = suggestions.map(s => ({
    id: s.id,
    logicalDay: s.logical_day,
    title: s.title,
    reason: s.reason,
    source: s.source,
    status: s.status as 'pending' | 'accepted' | 'dismissed',
    createdAt: s.created_at,
  }))

  // Strava status
  const strava = getStravaStatus(weekDays)

  // Health status
  const health = getHealthStatus()

  // Spotify status
  const spotify = getSpotifyStatus()

  // Bible status
  const bible = getBibleStatus(today)

  // Last sync times
  const lastSync = {
    strava: getLastSync('strava') ?? undefined,
    health: getLastSync('health') ?? undefined,
    spotify: getLastSync('spotify') ?? undefined,
    ai: getLastSync('ai_suggestions') ?? undefined,
  }

  return {
    displayName,
    timezone,
    settings,
    tasks: mappedTasks,
    taskCompletions: mappedCompletions,
    suggestions: mappedSuggestions,
    strava,
    health,
    spotify,
    bible,
    lastSync,
  }
}

/**
 * Get default settings
 */
function getDefaultSettings(): Settings {
  return {
    mockMode: false,
    debugMode: false,
    brightness: {
      enabled: true,
      current: 100,
      nightMode: false,
      nightStart: '22:00',
      nightEnd: '07:00',
      nightBrightness: 20,
    },
    notifications: {
      enabled: true,
      soundEnabled: true,
      quietHoursEnabled: true,
    },
  }
}

/**
 * Get Strava status
 */
function getStravaStatus(weekDays: number[]): StravaStatus | null {
  const db = getDatabase()
  const connected = getSetting<boolean>('strava_connected', false)

  if (!connected) return null

  // Get weekly data
  const weekData: number[] = []
  for (const day of weekDays) {
    const agg = db.prepare('SELECT distance_m FROM strava_daily_agg WHERE day = ?').get(day) as
      | { distance_m: number }
      | undefined

    weekData.push(agg?.distance_m ? agg.distance_m / 1000 : 0) // Convert to km
  }

  const weeklyDistance = weekData.reduce((sum, d) => sum + d, 0)
  const weeklyTarget = getSetting<number>('strava_weekly_target', 30)

  return {
    connected: true,
    lastSync: getLastSync('strava') ?? undefined,
    weeklyDistance: Math.round(weeklyDistance * 10) / 10,
    weeklyTarget,
    weekData,
  }
}

/**
 * Get Health status
 */
function getHealthStatus(): HealthStatus | null {
  const db = getDatabase()

  // Get latest snapshot
  const latest = db
    .prepare(
      `
      SELECT ts, steps, active_cals, sleep_minutes
      FROM health_snapshots
      ORDER BY ts DESC
      LIMIT 1
    `
    )
    .get() as
    | {
        ts: number
        steps: number
        active_cals: number
        sleep_minutes: number
      }
    | undefined

  if (!latest) return null

  // Calculate warning if no sync for 7+ days
  const lastSync = latest.ts
  const daysSinceSync = Math.floor((Date.now() - lastSync) / (1000 * 60 * 60 * 24))

  return {
    lastSync,
    steps: latest.steps,
    stepsPercent: Math.min(100, Math.round((latest.steps / 10000) * 100)),
    calories: latest.active_cals,
    caloriesPercent: Math.min(100, Math.round((latest.active_cals / 500) * 100)),
    sleepMinutes: latest.sleep_minutes,
    warningDays: daysSinceSync >= 7 ? daysSinceSync : undefined,
  }
}

/**
 * Get Spotify status
 */
function getSpotifyStatus(): SpotifyStatus | null {
  const db = getDatabase()
  const connected = getSetting<boolean>('spotify_connected', false)

  if (!connected) return null

  // Get latest now playing
  const latest = db
    .prepare(
      `
      SELECT is_playing, track, artist, album, album_art_url, progress_ms, duration_ms
      FROM spotify_now_playing
      ORDER BY ts DESC
      LIMIT 1
    `
    )
    .get() as
    | {
        is_playing: number
        track: string
        artist: string
        album: string
        album_art_url: string | null
        progress_ms: number
        duration_ms: number
      }
    | undefined

  if (!latest) {
    return {
      connected: true,
      isPlaying: false,
      track: '',
      artist: '',
      album: '',
      progressMs: 0,
      durationMs: 0,
    }
  }

  return {
    connected: true,
    isPlaying: Boolean(latest.is_playing),
    track: latest.track,
    artist: latest.artist,
    album: latest.album,
    albumArt: latest.album_art_url ?? undefined,
    progressMs: latest.progress_ms,
    durationMs: latest.duration_ms,
  }
}

/**
 * Get Bible status
 */
function getBibleStatus(today: number): BibleStatus | null {
  const db = getDatabase()

  // Calculate day index (days since plan start)
  const planStartDate = getSetting<number>('bible_plan_start', today)
  const daysSinceStart = Math.floor((today - planStartDate) / 1)
  const dayIndex = daysSinceStart % 365 // Wrap around for year

  // Get today's reading
  const reading = db
    .prepare(
      `
      SELECT day_index, reference, source, title
      FROM bible_plan
      WHERE day_index = ?
    `
    )
    .get(dayIndex) as
    | {
        day_index: number
        reference: string
        source: string
        title: string | null
      }
    | undefined

  if (!reading) {
    return {
      todayReference: 'No reading scheduled',
      source: 'NIV',
      completed: false,
      dayIndex: 0,
    }
  }

  // Check if completed
  const completion = db
    .prepare('SELECT completed_at FROM bible_completions WHERE date = ?')
    .get(today) as { completed_at: number } | undefined

  return {
    todayReference: reading.reference,
    source: reading.source,
    completed: Boolean(completion),
    dayIndex: reading.day_index,
  }
}
