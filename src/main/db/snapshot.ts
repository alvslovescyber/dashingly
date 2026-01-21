import { getDatabase, getSetting, getLastSync, setSetting } from './database'
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
  WeatherStatus,
  OAuthTokens,
} from '../../shared/types'
import {
  getWeatherStatus,
  getDefaultWeatherSettings,
  getWeatherSettings,
} from '../integrations/weather'
import { hasSecureValue } from '../security/secure-store'
import { getSecureValue } from '../security/secure-store'
import { setLastSync } from './database'

/**
 * Get the complete dashboard snapshot in a single query
 * This is the main IPC call for the renderer to get all data
 */
export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const db = getDatabase()
  const today = getTodayLogicalDay()
  const weekDays = getWeekLogicalDays(today)

  // User config
  const displayName = getSetting<string>('displayName', 'Friend')
  const timezone = getSetting<string>('timezone', 'America/New_York')

  // Settings
  const defaults = getDefaultSettings()
  const storedSettings = getSetting<Settings>('settings', defaults)
  const weatherSettings = getWeatherSettings()
  const settings: Settings = {
    ...defaults,
    ...storedSettings,
    brightness: { ...defaults.brightness, ...storedSettings?.brightness },
    notifications: { ...defaults.notifications, ...storedSettings?.notifications },
    ai: { ...defaults.ai, ...storedSettings?.ai },
    integrations: { ...defaults.integrations, ...storedSettings?.integrations },
    weather: weatherSettings,
  }

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
  let strava = getStravaStatus(weekDays)

  // Health status
  let health = getHealthStatus()

  // Spotify status (refresh from API first)
  await refreshSpotifyNowPlaying(settings)
  let spotify = getSpotifyStatus(settings)

  // Bible status
  const bible = getBibleStatus(today)

  // Weather status
  let weather: WeatherStatus | null = await getWeatherStatus()

  // Last sync times
  let lastSync = {
    strava: getLastSync('strava') ?? undefined,
    health: getLastSync('health') ?? undefined,
    spotify: getLastSync('spotify') ?? undefined,
    ai: getLastSync('ai_suggestions') ?? undefined,
    weather: getLastSync('weather') ?? undefined,
  }

  // Demo mode overrides
  if (settings.mockMode) {
    const now = Date.now()
    const mockWeek = [5.5, 6.2, 4.8, 7.1, 6.0, 4.2, 5.7]
    strava = {
      connected: true,
      lastSync: now,
      weeklyDistance: Math.round(mockWeek.reduce((s, d) => s + d, 0) * 10) / 10,
      weeklyTarget: 40,
      weekData: mockWeek,
    }
    health = {
      lastSync: now,
      steps: 8420,
      stepsPercent: 84,
      calories: 540,
      caloriesPercent: 68,
      sleepMinutes: 420,
      warningDays: undefined,
    }
    spotify = {
      connected: true,
      isPlaying: true,
      track: 'Starships',
      artist: 'Nicki Minaj',
      album: 'Pink Friday: Roman Reloaded',
      albumArt:
        'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/a5/c4/90/a5c490a1-d914-9943-7e02-32f8320e5840/12UMGIM12516.rgb.jpg/600x600bb.jpg',
      progressMs: 88000,
      durationMs: 210627,
    }
    weather = {
      locationName: 'London, UK',
      temperature: 12,
      high: 14,
      low: 8,
      condition: 'Cloudy',
      icon: 'cloud',
      lastUpdated: now,
      forecast: [
        { day: 'Wed', high: 14, low: 7, icon: 'rain' },
        { day: 'Thu', high: 13, low: 8, icon: 'cloud' },
        { day: 'Fri', high: 12, low: 6, icon: 'sun-cloud' },
        { day: 'Sat', high: 15, low: 9, icon: 'sun' },
        { day: 'Sun', high: 14, low: 8, icon: 'sun-cloud' },
        { day: 'Mon', high: 13, low: 7, icon: 'cloud' },
        { day: 'Tue', high: 12, low: 6, icon: 'rain' },
      ],
    }
    lastSync = {
      strava: now,
      health: now,
      spotify: now,
      ai: lastSync.ai,
      weather: now,
    }

    // Mock AI suggestions to keep the tile feeling alive in demo mode
    if (mappedSuggestions.length === 0) {
      const taskTitles = mappedTasks.slice(0, 3).map(t => t.title)
      const mockItems: TaskSuggestion[] = []

      if (taskTitles[0]) {
        mockItems.push({
          id: 'mock-1',
          logicalDay: today,
          title: `Break "${taskTitles[0]}" into 3 steps`,
          reason: 'Faster to start when the next step is tiny.',
          source: 'ai',
          status: 'pending',
          createdAt: now - 1000,
        })
      }

      if (taskTitles[1]) {
        mockItems.push({
          id: 'mock-2',
          logicalDay: today,
          title: `Schedule "${taskTitles[1]}" for 8pm focus block`,
          reason: 'Calendar is free tonight and you prefer quiet hours.',
          source: 'ai',
          status: 'pending',
          createdAt: now - 2000,
        })
      }

      if (taskTitles[2]) {
        mockItems.push({
          id: 'mock-3',
          logicalDay: today,
          title: `Prepare resources for "${taskTitles[2]}"`,
          reason: 'Laying out links/files now removes friction later.',
          source: 'ai',
          status: 'pending',
          createdAt: now - 3000,
        })
      }

      if (mockItems.length === 0) {
        mockItems.push(
          {
            id: 'mock-1',
            logicalDay: today,
            title: 'Plan a 5k loop in the park',
            reason: 'You ran 6km yesterday and the forecast is dry at 6pm.',
            source: 'ai',
            status: 'pending',
            createdAt: now - 1000,
          },
          {
            id: 'mock-2',
            logicalDay: today,
            title: 'Prep a quick high-protein dinner',
            reason: 'Energy dipped after your lunchtime run.',
            source: 'ai',
            status: 'pending',
            createdAt: now - 2000,
          },
          {
            id: 'mock-3',
            logicalDay: today,
            title: 'Book 30 min focus block at 8pm',
            reason: 'Calendar is free and you have 2 overdue tasks.',
            source: 'ai',
            status: 'pending',
            createdAt: now - 3000,
          }
        )
      }

      mappedSuggestions.push(...mockItems.slice(0, 3))
    }
  }

  const hasOpenAIKey =
    settings.mockMode || Boolean(process.env.OPENAI_API_KEY) || hasSecureValue('openai_api_key')

  return {
    displayName,
    timezone,
    settings,
    hasOpenAIKey,
    tasks: mappedTasks,
    taskCompletions: mappedCompletions,
    suggestions: mappedSuggestions,
    strava,
    health,
    spotify,
    bible,
    weather,
    lastSync,
  }
}

/**
 * Get default settings
 */
export function getDefaultSettings(): Settings {
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
    weather: getDefaultWeatherSettings(),
    ai: {
      model: 'gpt-4o-mini',
      maxSuggestionsPerDay: 5,
      autoGenerateEnabled: true,
      autoGenerateTime: '12:00',
    },
    integrations: {
      spotify: { enabled: true },
      strava: { enabled: true },
      weather: { enabled: true },
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
function getSpotifyStatus(settings: Settings): SpotifyStatus | null {
  const integrationEnabled = settings.integrations?.spotify?.enabled ?? true
  if (!integrationEnabled) return null

  const db = getDatabase()
  const connected = getSetting<boolean>('spotify_connected', false)
  const hasTokens = Boolean(getSetting<unknown>('spotify_tokens', null))
  const allowDemo = settings.mockMode

  if (!connected || (!hasTokens && !allowDemo)) {
    if (connected && !hasTokens) {
      setSetting('spotify_connected', false)
    }
    return null
  }

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

export async function refreshSpotifyNowPlaying(settings: Settings) {
  try {
    if (!(settings.integrations?.spotify?.enabled ?? true)) return

    const tokens = getSetting<OAuthTokens | null>('spotify_tokens', null)
    if (!tokens) return

    let authTokens = tokens
    // Refresh token if expired
    if (authTokens.expiresAt && authTokens.expiresAt < Date.now() + 5000) {
      const refreshed = await refreshSpotifyTokens(authTokens)
      if (refreshed) {
        authTokens = refreshed
        setSetting('spotify_tokens', refreshed)
      }
    }

    const nowPlaying = await fetchSpotifyNowPlaying(authTokens.accessToken)
    if (!nowPlaying) return

    const db = getDatabase()
    db.prepare(
      `
      INSERT OR REPLACE INTO spotify_now_playing
      (ts, is_playing, track, artist, album, album_art_url, progress_ms, duration_ms, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      Date.now(),
      nowPlaying.isPlaying ? 1 : 0,
      nowPlaying.track,
      nowPlaying.artist,
      nowPlaying.album,
      nowPlaying.albumArtUrl ?? null,
      nowPlaying.progressMs,
      nowPlaying.durationMs,
      JSON.stringify(nowPlaying.raw ?? {})
    )

    setLastSync('spotify', Date.now())
  } catch (error) {
    console.warn('Spotify now playing refresh failed', error)
  }
}

export async function refreshSpotifyTokens(tokens: OAuthTokens): Promise<OAuthTokens | null> {
  const clientId = resolveSpotifyClientId()
  const clientSecret = resolveSpotifyClientSecret()
  if (!clientId || !clientSecret) return null

  try {
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokens.refreshToken,
    })

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body,
    })

    if (!response.ok) {
      console.warn('Spotify token refresh failed', response.status)
      return null
    }

    const json = (await response.json()) as {
      access_token: string
      token_type: string
      expires_in: number
      refresh_token?: string
      scope?: string
    }

    return {
      accessToken: json.access_token,
      refreshToken: json.refresh_token ?? tokens.refreshToken,
      expiresAt: Date.now() + json.expires_in * 1000,
      scope: json.scope ?? tokens.scope,
    }
  } catch (error) {
    console.warn('Spotify token refresh error', error)
    return null
  }
}

type SpotifyImage = { url: string; height?: number; width?: number }
type SpotifyArtist = { name: string }
type SpotifyTrack = {
  name?: string
  album?: { name?: string; images?: SpotifyImage[] }
  artists?: SpotifyArtist[]
  duration_ms?: number
}
type SpotifyNowPlayingResponse = {
  is_playing?: boolean
  progress_ms?: number
  item?: SpotifyTrack | null
}

export async function fetchSpotifyNowPlaying(accessToken: string) {
  const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (response.status === 204) return null
  if (!response.ok) {
    console.warn('Spotify now playing request failed', response.status)
    return null
  }

  const data = (await response.json()) as SpotifyNowPlayingResponse
  if (!data?.item) return null

  const albumImages: SpotifyImage[] = data.item.album?.images ?? []
  const albumArtUrl = albumImages[0]?.url ?? null

  return {
    isPlaying: Boolean(data.is_playing),
    track: data.item.name ?? '',
    artist: (data.item.artists ?? []).map(a => a.name).join(', '),
    album: data.item.album?.name ?? '',
    albumArtUrl,
    progressMs: data.progress_ms ?? 0,
    durationMs: data.item.duration_ms ?? 0,
    raw: data,
  }
}

function resolveSpotifyClientId(): string | null {
  return process.env.SPOTIFY_CLIENT_ID || getSecureValue('spotify_client_id')
}

function resolveSpotifyClientSecret(): string | null {
  return process.env.SPOTIFY_CLIENT_SECRET || getSecureValue('spotify_client_secret')
}

/**
 * Ensure we have a fresh Spotify access token (refreshes if needed)
 */
async function getFreshSpotifyAccessToken(): Promise<{
  accessToken: string
  tokens: OAuthTokens
} | null> {
  const tokens = getSetting<OAuthTokens | null>('spotify_tokens', null)
  if (!tokens) return null

  let authTokens = tokens
  if (authTokens.expiresAt && authTokens.expiresAt < Date.now() + 5000) {
    const refreshed = await refreshSpotifyTokens(authTokens)
    if (!refreshed) return null
    authTokens = refreshed
    setSetting('spotify_tokens', refreshed)
  }

  return { accessToken: authTokens.accessToken, tokens: authTokens }
}

/**
 * Control Spotify playback (play/pause/next/previous)
 */
export async function controlSpotifyPlayback(action: 'play' | 'pause' | 'next' | 'previous') {
  try {
    const enabled = getSetting<boolean>('spotify_connected', false)
    if (!enabled) {
      return { success: false, reason: 'Spotify not connected' }
    }

    const tokenResult = await getFreshSpotifyAccessToken()
    if (!tokenResult) {
      return { success: false, reason: 'Spotify not connected' }
    }

    const { accessToken } = tokenResult

    const endpoints: Record<typeof action, { path: string; method: 'PUT' | 'POST' }> = {
      play: { path: 'play', method: 'PUT' },
      pause: { path: 'pause', method: 'PUT' },
      next: { path: 'next', method: 'POST' },
      previous: { path: 'previous', method: 'POST' },
    }

    const { path, method } = endpoints[action]
    const response = await fetch(`https://api.spotify.com/v1/me/player/${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    // Spotify returns 204 No Content on success
    if (!response.ok && response.status !== 204) {
      return { success: false, reason: `Spotify ${action} failed (${response.status})` }
    }

    // Refresh now playing so UI picks up new progress/track
    const nowPlaying = await fetchSpotifyNowPlaying(accessToken)
    if (nowPlaying) {
      const db = getDatabase()
      db.prepare(
        `
        INSERT OR REPLACE INTO spotify_now_playing
        (ts, is_playing, track, artist, album, album_art_url, progress_ms, duration_ms, raw_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      ).run(
        Date.now(),
        nowPlaying.isPlaying ? 1 : 0,
        nowPlaying.track,
        nowPlaying.artist,
        nowPlaying.album,
        nowPlaying.albumArtUrl ?? null,
        nowPlaying.progressMs,
        nowPlaying.durationMs,
        JSON.stringify(nowPlaying.raw ?? {})
      )

      setLastSync('spotify', Date.now())
    }

    return { success: true }
  } catch (error) {
    console.warn('Spotify control failed', error)
    return { success: false, reason: 'Spotify control error' }
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
