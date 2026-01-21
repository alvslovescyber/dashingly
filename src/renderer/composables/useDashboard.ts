import { ref, computed, onMounted } from 'vue'
import type {
  DashboardSnapshot,
  Task,
  TaskCompletion,
  TaskSuggestion,
  StravaStatus,
  HealthStatus,
  SpotifyStatus,
} from '../../shared/types'

// Singleton state - shared across components
const snapshot = ref<DashboardSnapshot | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const lastFetch = ref<number>(0)
const CACHE_DURATION = 5000
const SNAPSHOT_POLL_INTERVAL = 60_000
let pollTimer: ReturnType<typeof setInterval> | null = null

/**
 * Composable for accessing dashboard data from the main process
 * Returns reactive references to all dashboard sections
 */
export function useDashboard() {
  function ensurePolling() {
    if (pollTimer) return
    pollTimer = setInterval(() => {
      fetchSnapshot(true).catch(error => console.error('Periodic dashboard refresh failed:', error))
    }, SNAPSHOT_POLL_INTERVAL)
  }
  // Fetch snapshot from main process
  async function fetchSnapshot(force = false): Promise<void> {
    // Skip if recently fetched (unless forced)
    if (!force && Date.now() - lastFetch.value < CACHE_DURATION && snapshot.value) {
      return
    }

    loading.value = true
    error.value = null

    try {
      const data = await window.electronAPI.getDashboardSnapshot()
      snapshot.value = data as DashboardSnapshot
      lastFetch.value = Date.now()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch dashboard data'
      console.error('Dashboard fetch error:', e)
    } finally {
      loading.value = false
    }
  }

  // Auto-fetch on mount if needed
  onMounted(() => {
    if (!snapshot.value) {
      fetchSnapshot()
    }
    ensurePolling()
  })

  // User info
  const displayName = computed(() => snapshot.value?.displayName ?? 'Friend')
  const timezone = computed(() => snapshot.value?.timezone ?? 'America/New_York')
  const settings = computed(() => snapshot.value?.settings)
  const hasOpenAIKey = computed(() => snapshot.value?.hasOpenAIKey ?? false)

  // Tasks
  const tasks = computed<Task[]>(() => snapshot.value?.tasks ?? [])
  const taskCompletions = computed<TaskCompletion[]>(() => snapshot.value?.taskCompletions ?? [])

  const todayTasks = computed(() => {
    const completionMap = new Set(taskCompletions.value.map(c => c.taskId))
    return tasks.value
      .filter(t => t.isActive)
      .map(t => ({
        id: t.id,
        title: t.title,
        type: t.type,
        completed: completionMap.has(t.id),
      }))
  })

  const tasksCompleted = computed(() => todayTasks.value.filter(t => t.completed).length)
  const totalTasks = computed(() => todayTasks.value.length)

  // AI Suggestions
  const suggestions = computed<TaskSuggestion[]>(() => snapshot.value?.suggestions ?? [])

  const aiSuggestions = computed(() =>
    suggestions.value.map(s => ({
      id: s.id,
      title: s.title,
      reason: s.reason,
    }))
  )

  // Strava
  const strava = computed<StravaStatus | null>(() => snapshot.value?.strava ?? null)

  const stravaData = computed(() => ({
    connected: strava.value?.connected ?? false,
    weeklyDistance: strava.value?.weeklyDistance ?? 0,
    weeklyTarget: strava.value?.weeklyTarget ?? 30,
    weekData: [...(strava.value?.weekData ?? [0, 0, 0, 0, 0, 0, 0])],
  }))

  // Health
  const health = computed<HealthStatus | null>(() => snapshot.value?.health ?? null)
  const healthData = computed(() => ({
    steps: health.value?.steps ?? 0,
    stepsPercent: health.value?.stepsPercent ?? 0,
    calories: health.value?.calories ?? 0,
    caloriesPercent: health.value?.caloriesPercent ?? 0,
    sleepMinutes: health.value?.sleepMinutes ?? 0,
    warningDays: health.value?.warningDays,
  }))

  // Spotify
  const spotify = computed<SpotifyStatus | null>(() => snapshot.value?.spotify ?? null)

  const spotifyData = computed(() => ({
    connected: spotify.value?.connected ?? false,
    isPlaying: spotify.value?.isPlaying ?? false,
    track: spotify.value?.track ?? '',
    artist: spotify.value?.artist ?? '',
    album: spotify.value?.album ?? '',
    albumArt: spotify.value?.albumArt ?? '',
    progressMs: spotify.value?.progressMs ?? 0,
    durationMs: spotify.value?.durationMs ?? 0,
  }))

  // Bible
  const bible = computed(() => snapshot.value?.bible ?? null)

  const bibleData = computed(() => ({
    reference: bible.value?.todayReference ?? 'No reading scheduled',
    completed: bible.value?.completed ?? false,
    dayIndex: bible.value?.dayIndex ?? 0,
  }))

  // Weather
  const weatherData = computed(() => ({
    location: snapshot.value?.weather?.locationName ?? settings.value?.weather?.cityName ?? '—',
    temperature: snapshot.value?.weather?.temperature ?? null,
    high: snapshot.value?.weather?.high ?? null,
    low: snapshot.value?.weather?.low ?? null,
    condition: snapshot.value?.weather?.condition ?? '—',
    icon: snapshot.value?.weather?.icon ?? 'cloud',
    lastUpdated: snapshot.value?.weather?.lastUpdated ?? null,
    forecast: snapshot.value?.weather?.forecast ?? [],
  }))

  // Last sync times
  const lastSync = computed(() => snapshot.value?.lastSync ?? {})

  // Actions
  async function completeTask(taskId: string): Promise<void> {
    try {
      await window.electronAPI.completeTask(taskId)
      await fetchSnapshot(true) // Refresh
    } catch (e) {
      console.error('Failed to complete task:', e)
    }
  }

  async function acceptSuggestion(id: string): Promise<void> {
    try {
      await window.electronAPI.acceptSuggestion(id)
      await fetchSnapshot(true)
    } catch (e) {
      console.error('Failed to accept suggestion:', e)
    }
  }

  async function dismissSuggestion(id: string): Promise<void> {
    try {
      await window.electronAPI.dismissSuggestion(id)
      await fetchSnapshot(true)
    } catch (e) {
      console.error('Failed to dismiss suggestion:', e)
    }
  }

  async function markBibleComplete(): Promise<void> {
    try {
      await window.electronAPI.markBibleComplete()
      await fetchSnapshot(true)
    } catch (e) {
      console.error('Failed to mark bible complete:', e)
    }
  }

  async function createTask(payload: { title: string; type?: 'daily' | 'oneoff' }): Promise<void> {
    try {
      await window.electronAPI.createTask(payload)
      await fetchSnapshot(true)
    } catch (e) {
      console.error('Failed to create task:', e)
    }
  }

  async function deleteTask(taskId: string): Promise<void> {
    try {
      await window.electronAPI.deleteTask(taskId)
      await fetchSnapshot(true)
    } catch (e) {
      console.error('Failed to delete task:', e)
    }
  }

  return {
    // State
    loading,
    error,
    snapshot,

    // User
    displayName,
    timezone,
    settings,
    hasOpenAIKey,

    // Tasks
    tasks,
    taskCompletions,
    todayTasks,
    tasksCompleted,
    totalTasks,

    // AI
    suggestions,
    aiSuggestions,

    // Strava
    strava,
    stravaData,

    // Health
    health,
    healthData,

    // Spotify
    spotify,
    spotifyData,

    // Bible
    bible,
    bibleData,
    weatherData,

    // Sync
    lastSync,

    // Actions
    fetchSnapshot,
    completeTask,
    createTask,
    deleteTask,
    acceptSuggestion,
    dismissSuggestion,
    markBibleComplete,
  }
}
