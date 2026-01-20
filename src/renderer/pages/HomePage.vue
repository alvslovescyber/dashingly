<template>
  <div class="home-page">
    <!-- Sidebar -->
    <Sidebar :current-route="currentSection" @navigate="handleNavigate" />

    <!-- Main Content -->
    <div class="home-page__main">
      <!-- Top Bar -->
      <TopBar :display-name="displayName" @open-settings="showSettings = true">
        <!-- Page Indicator Dots -->
        <template #center>
          <div class="page-dots">
            <button
              v-for="(section, index) in sections"
              :key="section.id"
              class="page-dot"
              :class="{ 'page-dot--active': currentSectionIndex === index }"
              @click="goToSection(index)"
            />
          </div>
        </template>
      </TopBar>

      <!-- Swipeable Content Area -->
      <div
        ref="swipeContainer"
        class="home-page__content"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <!-- Tiles Grid (Home Section) -->
        <div
          class="home-page__grid"
          :style="{ transform: `translateX(${-currentSectionIndex * 100}%)` }"
        >
          <!-- Section: Home -->
          <div class="home-page__section">
            <!-- Row 1: Spotify + AI Inbox -->
            <div class="home-page__row home-page__row--top">
              <!-- Spotify Now Playing -->
              <SpotifyBar
                :is-visible="shouldShowSpotify"
                :is-playing="spotifyData.isPlaying"
                :track="spotifyData.track"
                :artist="spotifyData.artist"
                :album="spotifyData.album"
                :album-art="spotifyData.albumArt"
                :progress-ms="spotifyData.progressMs"
                :duration-ms="spotifyData.durationMs"
                class="tile--spotify"
              />

              <!-- AI Inbox Tile -->
              <AIInboxTile
                :suggestions="aiSuggestions"
                next-suggestion-time="12:00"
                class="tile--ai-inbox"
                @accept="handleAIAccept"
                @dismiss="handleAIDismiss"
                @view-all="showAISuggestionsModal = true"
              />
            </div>

            <!-- Row 2: Main Tiles -->
            <div class="home-page__row home-page__row--main">
              <!-- Strava / Activity Tile -->
              <TileCard title="Weekly Running" :icon="Activity" class="tile--strava" size="lg">
                <template #headerRight>
                  <TogglePill v-model="stravaEnabled" />
                </template>
                <div class="strava-content">
                  <div class="strava-stats">
                    <span class="strava-distance">{{ stravaData.weeklyDistance }}</span>
                    <span class="strava-unit">km</span>
                  </div>
                  <div class="strava-target">
                    <span>Target: {{ stravaData.weeklyTarget }}km</span>
                  </div>
                  <MiniChart
                    :data="stravaData.weekData"
                    :labels="['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']"
                    color="#14B8A6"
                    gradient-start="rgba(20, 184, 166, 0.12)"
                    gradient-end="rgba(20, 184, 166, 0)"
                    :height="80"
                  />
                </div>
              </TileCard>

              <!-- Tasks Tile -->
              <TileCard title="Today's Tasks" :icon="ListChecks" class="tile--tasks" size="lg">
                <template #headerRight>
                  <span class="task-count">{{ tasksCompleted }}/{{ totalTasks }}</span>
                </template>
                <div class="tasks-content">
                  <div
                    v-for="task in displayedTasks"
                    :key="task.id"
                    class="task-item"
                    :class="{ 'task-item--completed': task.completed }"
                    @click="toggleTask(task.id)"
                  >
                    <div class="task-checkbox">
                      <Check v-if="task.completed" :size="12" />
                    </div>
                    <span class="task-title">{{ task.title }}</span>
                  </div>
                  <button class="task-add" type="button" @click.stop="showAddTaskModal = true">
                    <Plus :size="14" />
                    <span>Add task</span>
                  </button>
                  <button
                    v-if="hasMoreTasks"
                    class="task-view-all"
                    type="button"
                    @click.stop="showAllTasksModal = true"
                  >
                    View all
                  </button>
                </div>
              </TileCard>

              <!-- Health Tile -->
              <TileCard title="Health" :icon="Heart" class="tile--health" size="md">
                <div class="health-content">
                  <div class="health-stat">
                    <ProgressRing :value="healthData.stepsPercent" :size="60">
                      <Footprints :size="20" />
                    </ProgressRing>
                    <div class="health-stat-info">
                      <span class="health-stat-value">{{ healthData.steps.toLocaleString() }}</span>
                      <span class="health-stat-label">steps</span>
                    </div>
                  </div>
                  <div class="health-stat">
                    <ProgressRing :value="healthData.caloriesPercent" :size="60" color="#F97316">
                      <Flame :size="20" />
                    </ProgressRing>
                    <div class="health-stat-info">
                      <span class="health-stat-value">{{ healthData.calories }}</span>
                      <span class="health-stat-label">cal</span>
                    </div>
                  </div>
                </div>
              </TileCard>

              <!-- Daily Reading (Bible) Tile -->
              <TileCard
                title="Daily Reading"
                :icon="BookOpen"
                class="tile--bible tile--solid"
                size="md"
              >
                <div class="bible-content">
                  <p class="bible-reference">{{ currentReference }}</p>
                  <p class="bible-verse">
                    <span class="bible-verse__main">"{{ verseMain }}"</span>
                    <span v-if="verseRest" class="bible-verse__rest">
                      {{ verseRest }}
                    </span>
                  </p>
                  <div class="bible-actions">
                    <button
                      class="bible-button"
                      :class="{ 'bible-button--done': isBibleCompleted }"
                      @click="handleBibleAction"
                    >
                      {{ isBibleCompleted ? 'Done' : 'Mark Done' }}
                    </button>
                  </div>
                </div>
              </TileCard>
            </div>

            <!-- Row 3: Bottom Tiles -->
            <div class="home-page__row home-page__row--bottom">
              <!-- Energy Chart -->
              <TileCard title="Energy (KWH)" class="tile--energy" size="md">
                <template #headerRight>
                  <div class="energy-toggle">
                    <button
                      class="energy-toggle__btn"
                      :class="{ 'energy-toggle__btn--active': energyPeriod === 'weekly' }"
                      @click="energyPeriod = 'weekly'"
                    >
                      Weekly
                    </button>
                    <button
                      class="energy-toggle__btn"
                      :class="{ 'energy-toggle__btn--active': energyPeriod === 'monthly' }"
                      @click="energyPeriod = 'monthly'"
                    >
                      Monthly
                    </button>
                  </div>
                </template>
                <MiniChart
                  :data="energyChart.data"
                  :labels="energyChart.labels"
                  :height="100"
                />
              </TileCard>

              <!-- Weather Tile -->
              <TileCard class="tile--weather" size="md" :interactive="false">
                <template #headerRight>
                  <button class="weather-settings-btn" type="button" @click.stop="showSettings = true">
                    <SettingsIcon :size="16" />
                  </button>
                </template>
                <div class="weather-content">
                  <div class="weather-today">
                    <component :is="weatherIcon" :size="48" class="weather-icon" />
                    <div class="weather-temps">
                      <span class="weather-current">
                        {{ formatTemperature(weatherData.temperature) }}
                      </span>
                      <div class="weather-range">
                        <span>{{ formatTemperature(weatherData.high) }}</span>
                        <span class="weather-divider">/</span>
                        <span>{{ formatTemperature(weatherData.low) }}</span>
                      </div>
                    </div>
                    <span class="weather-label">{{ weatherData.condition }}</span>
                    <span class="weather-location">{{ weatherData.location }}</span>
                  </div>
                  <div class="weather-week">
                    <div v-for="day in formattedForecast" :key="day.day" class="weather-day">
                      <span class="weather-day-name">{{ day.day }}</span>
                      <span class="weather-day-date">{{ formatTemperature(day.high) }}</span>
                      <span class="weather-day-low">{{ formatTemperature(day.low) }}</span>
                    </div>
                  </div>
                  <span class="weather-updated">Updated {{ weatherUpdatedLabel }}</span>
                </div>
              </TileCard>
            </div>
          </div>

          <!-- Section: Health -->
          <div class="home-page__section home-page__section--health">
            <div class="health-page">
              <div class="health-hero-card">
                <div class="health-hero-card__ring">
                  <ProgressRing :value="healthData.stepsPercent" :size="120">
                    <Footprints :size="32" />
                  </ProgressRing>
                  <div class="health-hero-card__stat">
                    <span class="health-hero-card__value">
                      {{ healthData.steps.toLocaleString() }}
                    </span>
                    <span class="health-hero-card__label">steps today</span>
                  </div>
                </div>
                <div class="health-hero-card__meta">
                  <div>
                    <span class="health-meta__label">Active calories</span>
                    <p class="health-meta__value">{{ healthData.calories }}</p>
                  </div>
                  <div>
                    <span class="health-meta__label">Sleep minutes</span>
                    <p class="health-meta__value">{{ healthData.sleepMinutes }}</p>
                  </div>
                </div>
                <div class="health-sync" :class="{ 'health-sync--warning': healthData.warningDays }">
                  <span>Last synced {{ healthSyncLabel }}</span>
                  <span v-if="healthData.warningDays">Reconnect Health source</span>
                </div>
              </div>

              <div class="health-trends">
                <div class="health-trend-card">
                  <div class="health-trend-card__header">
                    <span>Steps · 7 days</span>
                    <span class="health-trend-card__value">{{ latestHealthSteps }}</span>
                  </div>
                  <MiniChart
                    :data="healthTrend"
                    :labels="['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']"
                    color="#34d399"
                    gradient-start="rgba(52, 211, 153, 0.18)"
                  />
                </div>
                <div class="health-trend-card">
                  <div class="health-trend-card__header">
                    <span>Sleep minutes</span>
                    <span class="health-trend-card__value">{{ latestSleepMinutes }}</span>
                  </div>
                  <MiniChart
                    :data="sleepTrend"
                    :labels="['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']"
                    color="#60a5fa"
                    gradient-start="rgba(96, 165, 250, 0.2)"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Section: Strava (placeholder) -->
          <div class="home-page__section home-page__section--placeholder">
            <div class="placeholder-content">
              <Activity :size="48" />
              <span>Strava Section</span>
            </div>
          </div>

          <!-- Section: Tasks (placeholder) -->
          <div class="home-page__section home-page__section--placeholder">
            <div class="placeholder-content">
              <ListChecks :size="48" />
              <span>Tasks Section</span>
            </div>
          </div>

          <!-- Section: Reading (placeholder) -->
          <div class="home-page__section home-page__section--placeholder">
            <div class="placeholder-content">
              <BookOpen :size="48" />
              <span>Reading Section</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Task Modal -->
    <ModalSheet v-model="showAddTaskModal" title="Add Task">
      <form class="task-form" @submit.prevent="submitTask">
        <label class="form-label">
          Title
          <input
            v-model="newTaskTitle"
            class="form-input"
            type="text"
            name="title"
            placeholder="What do you need to remember?"
            required
          />
        </label>

        <label class="form-label">
          Type
          <div class="task-type-buttons">
            <button
              type="button"
              class="task-type-btn"
              :class="{ 'task-type-btn--active': newTaskType === 'daily' }"
              @click="newTaskType = 'daily'"
            >
              Daily
            </button>
            <button
              type="button"
              class="task-type-btn"
              :class="{ 'task-type-btn--active': newTaskType === 'oneoff' }"
              @click="newTaskType = 'oneoff'"
            >
              One-off
            </button>
          </div>
        </label>

        <p v-if="taskError" class="form-error">{{ taskError }}</p>
        <button class="form-submit" type="submit" :disabled="taskSaving">
          {{ taskSaving ? 'Saving...' : 'Save Task' }}
        </button>
      </form>
    </ModalSheet>

    <!-- All Tasks Modal -->
    <ModalSheet v-model="showAllTasksModal" title="Today's Tasks">
      <div class="task-modal-list">
        <div
          v-for="task in todayTasks"
          :key="task.id"
          class="task-item"
          :class="{ 'task-item--completed': task.completed }"
          @click="toggleTask(task.id)"
        >
          <div class="task-checkbox">
            <Check v-if="task.completed" :size="12" />
          </div>
          <span class="task-title">{{ task.title }}</span>
        </div>
      </div>
    </ModalSheet>

    <!-- AI Suggestions Modal -->
    <ModalSheet v-model="showAISuggestionsModal" title="AI Suggestions">
      <div v-if="pendingAISuggestions.length > 0" class="ai-modal-list">
        <div v-for="suggestion in pendingAISuggestions" :key="suggestion.id" class="ai-modal-item">
          <div class="ai-modal-body">
            <p class="ai-modal-title">{{ suggestion.title }}</p>
            <p class="ai-modal-reason">{{ suggestion.reason }}</p>
          </div>
          <div class="ai-modal-actions">
            <button @click="handleAIAccept(suggestion.id)">Accept</button>
            <button @click="handleAIDismiss(suggestion.id)">Dismiss</button>
          </div>
        </div>
      </div>
      <p v-else class="ai-modal-empty">No suggestions right now.</p>
    </ModalSheet>

    <!-- Settings Modal -->
    <ModalSheet v-model="showSettings" title="Weather Settings" size="md">
      <div class="settings-section">
        <span class="form-label">Location Mode</span>
        <div class="settings-radio-group">
          <label>
            <input
              v-model="weatherForm.locationMode"
              type="radio"
              value="city"
              name="locationMode"
            />
            City
          </label>
          <label>
            <input
              v-model="weatherForm.locationMode"
              type="radio"
              value="latlon"
              name="locationMode"
            />
            Latitude/Longitude
          </label>
        </div>

        <label v-if="weatherForm.locationMode === 'city'" class="form-label">
          City
          <input
            v-model="weatherForm.cityName"
            class="form-input"
            type="text"
            placeholder="Chicago"
          />
        </label>

        <div v-else class="coordinates-grid">
          <label class="form-label">
            Latitude
            <input
              v-model.number="weatherForm.latitude"
              class="form-input"
              type="number"
              step="0.01"
              placeholder="41.88"
            />
          </label>
          <label class="form-label">
            Longitude
            <input
              v-model.number="weatherForm.longitude"
              class="form-input"
              type="number"
              step="0.01"
              placeholder="-87.62"
            />
          </label>
        </div>

        <p v-if="loadingWeatherSettings" class="settings-note">Loading current settings...</p>
        <p v-if="weatherSettingsError" class="form-error">{{ weatherSettingsError }}</p>

        <button class="form-submit" type="button" :disabled="savingWeatherSettings" @click="saveWeatherSettings">
          {{ savingWeatherSettings ? 'Saving...' : 'Save Settings' }}
        </button>
      </div>
    </ModalSheet>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  Activity,
  ListChecks,
  Heart,
  BookOpen,
  Check,
  Plus,
  Footprints,
  Flame,
  CloudSun,
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  Settings as SettingsIcon,
} from 'lucide-vue-next'
import {
  Sidebar,
  TopBar,
  TileCard,
  SpotifyBar,
  MiniChart,
  ProgressRing,
  ModalSheet,
  TogglePill,
} from '../components'
import AIInboxTile from '../components/tiles/AIInboxTile.vue'
import { useDashboard } from '../composables/useDashboard'
import { useVerseOfDay } from '../composables/useVerseOfDay'
import type { WeatherSettings } from '@shared/types'

// Dashboard data from main process
const {
  displayName,
  todayTasks,
  tasksCompleted,
  totalTasks,
  aiSuggestions,
  stravaData,
  healthData,
  spotifyData,
  bibleData,
  lastSync,
  weatherData,
  completeTask,
  acceptSuggestion,
  dismissSuggestion,
  markBibleComplete,
  createTask,
  fetchSnapshot,
} = useDashboard()

// Navigation - Sections for swipe navigation
const sections = [
  { id: 'home', label: 'Home' },
  { id: 'health', label: 'Health' },
  { id: 'strava', label: 'Strava' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'reading', label: 'Reading' },
]

const currentSectionIndex = ref(0)
const currentSection = computed(() => sections[currentSectionIndex.value]?.id ?? 'home')
const showSettings = ref(false)
const showAddTaskModal = ref(false)
const showAllTasksModal = ref(false)
const showAISuggestionsModal = ref(false)
const stravaEnabled = ref(true)

function handleNavigate(route: string) {
  const index = sections.findIndex(s => s.id === route)
  if (index !== -1) {
    currentSectionIndex.value = index
  }
}

function goToSection(index: number) {
  currentSectionIndex.value = index
}

// Swipe handling
const swipeContainer = ref<HTMLElement | null>(null)
const touchStartX = ref(0)
const touchEndX = ref(0)
const minSwipeDistance = 50

function handleTouchStart(e: TouchEvent) {
  const touch = e.touches[0]
  if (touch) {
    touchStartX.value = touch.clientX
  }
}

function handleTouchMove(e: TouchEvent) {
  const touch = e.touches[0]
  if (touch) {
    touchEndX.value = touch.clientX
  }
}

function handleTouchEnd() {
  const swipeDistance = touchStartX.value - touchEndX.value

  if (Math.abs(swipeDistance) > minSwipeDistance) {
    if (swipeDistance > 0 && currentSectionIndex.value < sections.length - 1) {
      // Swipe left -> next section
      currentSectionIndex.value++
    } else if (swipeDistance < 0 && currentSectionIndex.value > 0) {
      // Swipe right -> previous section
      currentSectionIndex.value--
    }
  }

  touchStartX.value = 0
  touchEndX.value = 0
}

// AI Inbox handlers
function handleAIAccept(id: string) {
  acceptSuggestion(id)
}

function handleAIDismiss(id: string) {
  dismissSuggestion(id)
}

const shouldShowSpotify = computed(
  () => spotifyData.value.isPlaying && Boolean(spotifyData.value.track)
)

// Task toggle handler
function toggleTask(id: string) {
  completeTask(id)
}

const TASK_TILE_LIMIT = 5
const displayedTasks = computed(() => todayTasks.value.slice(0, TASK_TILE_LIMIT))
const hasMoreTasks = computed(() => todayTasks.value.length > displayedTasks.value.length)
const newTaskTitle = ref('')
const newTaskType = ref<'daily' | 'oneoff'>('daily')
const taskSaving = ref(false)
const taskError = ref<string | null>(null)

watch(showAddTaskModal, open => {
  if (!open) {
    resetTaskForm()
  }
})

function resetTaskForm() {
  newTaskTitle.value = ''
  newTaskType.value = 'daily'
  taskError.value = null
  taskSaving.value = false
}

async function submitTask() {
  if (!newTaskTitle.value.trim()) {
    taskError.value = 'Please enter a task title.'
    return
  }

  taskSaving.value = true
  taskError.value = null

  try {
    await createTask({ title: newTaskTitle.value.trim(), type: newTaskType.value })
    showAddTaskModal.value = false
    await fetchSnapshot(true)
  } catch (error) {
    console.error('Failed to create task', error)
    taskError.value = 'Unable to save task. Try again.'
  } finally {
    taskSaving.value = false
  }
}

const pendingAISuggestions = computed(() => aiSuggestions.value)

// Daily Reading - Verse of the Day (from local JSON for now, syncced with DB status)
const verseData = useVerseOfDay()

// Computed verse parts for better text hierarchy
const verseMain = computed(() => {
  // Use DB reference if possible, but we still need the text from the JSON
  // For now, we assume the plan matches or we just show the text we have
  const text = verseData.text.value
  // Get first sentence or first ~60 chars
  const firstSentence = text.match(/^[^.!?]+[.!?]?/)?.[0] || text
  return firstSentence.length > 80 ? text.slice(0, 60).trim() : firstSentence
})

const verseRest = computed(() => {
  const text = verseData.text.value
  const main = verseMain.value
  return text.slice(main.length).trim()
})

// Use DB data for status and reference
const currentReference = computed(() => bibleData.value.reference || verseData.reference.value)
const isBibleCompleted = computed(() => bibleData.value.completed)

function handleBibleAction() {
  markBibleComplete()
}

// Energy Chart
const energyPeriod = ref<'weekly' | 'monthly'>('weekly')
const energyChart = computed(() => {
  if (energyPeriod.value === 'weekly') {
    return {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      data: [80, 120, 100, 140, 110, 130, 145],
    }
  }
  return {
    labels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'],
    data: [540, 610, 575, 630],
  }
})

// Weather helpers
const weatherIconMap = {
  sun: Sun,
  'sun-cloud': CloudSun,
  cloud: Cloud,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
  fog: CloudFog,
} as const

const weatherIcon = computed(() => weatherIconMap[weatherData.value.icon] ?? CloudSun)

const fallbackForecast = ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => ({
  day,
  high: null,
  low: null,
}))

const formattedForecast = computed(
  () => weatherData.value.forecast?.map(item => ({ ...item })) ?? fallbackForecast
)

function formatTemperature(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return `${Math.round(value)}°`
}

function formatRelativeTime(timestamp?: number | null): string {
  if (!timestamp) return '—'
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const weatherUpdatedLabel = computed(() => formatRelativeTime(weatherData.value.lastUpdated))

// Weather settings form
const weatherForm = ref<WeatherSettings>({
  locationMode: 'city',
  cityName: 'New York',
  units: 'metric',
})
const loadingWeatherSettings = ref(false)
const savingWeatherSettings = ref(false)
const weatherSettingsError = ref<string | null>(null)

watch(showSettings, value => {
  if (value) {
    loadWeatherSettings()
  }
})

async function loadWeatherSettings() {
  loadingWeatherSettings.value = true
  weatherSettingsError.value = null
  try {
    const settings = (await window.electronAPI.getWeatherSettings()) as WeatherSettings
    weatherForm.value = { ...settings }
  } catch (error) {
    console.error('Failed to load weather settings', error)
    weatherSettingsError.value = 'Unable to load settings.'
  } finally {
    loadingWeatherSettings.value = false
  }
}

async function saveWeatherSettings() {
  weatherSettingsError.value = null

  if (weatherForm.value.locationMode === 'city' && !weatherForm.value.cityName?.trim()) {
    weatherSettingsError.value = 'Enter a city name.'
    return
  }

  if (
    weatherForm.value.locationMode === 'latlon' &&
    (weatherForm.value.latitude === undefined || weatherForm.value.longitude === undefined)
  ) {
    weatherSettingsError.value = 'Provide both latitude and longitude.'
    return
  }

  savingWeatherSettings.value = true
  try {
    await window.electronAPI.setWeatherSettings(weatherForm.value)
    await fetchSnapshot(true)
    showSettings.value = false
  } catch (error) {
    console.error('Failed to save weather settings', error)
    weatherSettingsError.value = 'Failed to save settings.'
  } finally {
    savingWeatherSettings.value = false
  }
}

// Health helpers
const healthTrend = computed(() => {
  const base = Math.max(2500, healthData.value.steps - 2000)
  return Array.from({ length: 7 }, (_, index) =>
    Math.round(base + Math.sin(index / 2) * 600)
  )
})
const sleepTrend = [420, 460, 410, 440, 400, 450, 430]
const healthSyncLabel = computed(() => formatRelativeTime(lastSync.value.health))
const latestHealthSteps = computed(() => {
  const trend = healthTrend.value
  const last = trend[trend.length - 1]
  return last ? last.toLocaleString() : '--'
})
const latestSleepMinutes = computed(() => {
  const last = sleepTrend[sleepTrend.length - 1]
  return last ? `${last}m` : '--'
})
</script>

<style scoped>
.home-page {
  display: flex;
  width: 100%;
  height: 100%;
}

.home-page__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: var(--space-md) var(--space-lg) var(--space-lg);
  overflow: hidden;
}

/* Page Dots Navigation */
.page-dots {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-dot {
  width: 8px;
  height: 8px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
  padding: 0;
}

.page-dot:hover {
  background: rgba(255, 255, 255, 0.4);
}

.page-dot--active {
  width: 24px;
  border-radius: 4px;
  background: var(--color-blue);
}

/* Swipeable Content */
.home-page__content {
  flex: 1;
  overflow: hidden;
  touch-action: pan-x;
}

.home-page__grid {
  display: flex;
  height: 100%;
  transition: transform var(--duration-normal) var(--ease-out);
}

.home-page__section {
  flex: 0 0 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  overflow-y: auto;
}

.home-page__section--placeholder {
  align-items: center;
  justify-content: center;
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  color: var(--text-tertiary);
  font-size: var(--text-lg);
}

.home-page__row {
  display: flex;
  gap: var(--space-md);
}

/* Top Row */
.home-page__row--top {
  min-height: 140px;
}

.tile--spotify {
  flex: 1.5;
}

.tile--ai-inbox {
  flex: 1;
}

/* Main Row */
.home-page__row--main {
  flex: 1;
}

.tile--strava {
  flex: 2;
}

.strava-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.strava-stats {
  display: flex;
  align-items: baseline;
  gap: var(--space-xs);
}

.strava-distance {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--color-white);
  letter-spacing: -0.02em;
}

.strava-unit {
  font-size: var(--text-lg);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
}

.strava-target {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  opacity: 0.8;
  margin-bottom: var(--space-md);
}

.tile--tasks {
  flex: 2;
}

.task-count {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.tasks-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.task-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm);
  background: rgba(255, 255, 255, 0.04);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-out);
}

.task-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.task-item--completed {
  opacity: 0.6;
}

.task-item--completed .task-title {
  text-decoration: line-through;
}

.task-checkbox {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  color: var(--color-green);
}

.task-item--completed .task-checkbox {
  background: var(--color-green);
  border-color: var(--color-green);
  color: var(--color-white);
}

.task-title {
  font-size: var(--text-sm);
  color: var(--text-primary);
}

.task-add {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm);
  background: transparent;
  border: 1px dashed rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}

.task-add:hover {
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-secondary);
}

.task-view-all {
  align-self: flex-start;
  padding: 4px 10px;
  margin-top: -4px;
  border-radius: var(--radius-chip);
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--text-xs);
  cursor: pointer;
}

.task-view-all:hover {
  background: rgba(255, 255, 255, 0.06);
}

.tile--health {
  flex: 1.5;
}

.health-content {
  display: flex;
  gap: var(--space-lg);
  justify-content: center;
  padding-top: var(--space-md);
}

.health-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
}

.health-stat-info {
  text-align: center;
}

.health-stat-value {
  display: block;
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--color-white);
  letter-spacing: -0.01em;
}

.health-stat-label {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  opacity: 0.8;
}

.tile--bible {
  flex: 1.5;
}

/* Solid variant for Daily Reading - more legible */
.tile--solid {
  background: var(--glass-tile-solid);
}

.bible-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-top: var(--space-xs);
}

.bible-reference {
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  color: rgba(255, 255, 255, 0.95);
  letter-spacing: -0.01em;
  margin: 0 0 var(--space-sm) 0;
}

.bible-verse {
  margin: 0;
  flex: 1;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
}

.bible-verse__main {
  font-size: var(--text-sm);
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.78);
}

.bible-verse__rest {
  font-size: var(--text-xs);
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.78);
}

.bible-actions {
  display: flex;
  justify-content: center;
  margin-top: var(--space-sm);
}

.bible-button {
  padding: var(--space-xs) var(--space-md);
  background: var(--color-green);
  border: 1px solid var(--color-green);
  border-radius: var(--radius-chip);
  color: var(--color-white);
  font-size: var(--text-sm);
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}

.bible-button--done {
  background: rgba(255, 255, 255, 0.12);
  color: var(--text-secondary);
  border-color: transparent;
}

/* Bottom Row */
.home-page__row--bottom {
  min-height: 140px;
}

.tile--energy {
  flex: 2;
}

.energy-toggle {
  display: flex;
  gap: 2px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: var(--radius-chip);
  padding: 2px;
}

.energy-toggle__btn {
  padding: var(--space-xs) var(--space-sm);
  background: transparent;
  border: none;
  border-radius: calc(var(--radius-chip) - 2px);
  color: var(--text-tertiary);
  font-size: var(--text-xs);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.energy-toggle__btn:hover {
  color: var(--text-secondary);
}

.energy-toggle__btn--active {
  background: rgba(255, 255, 255, 0.12);
  color: var(--text-primary);
}

.tile--weather {
  flex: 1;
}

.weather-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
}

.weather-settings-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  cursor: pointer;
}

.weather-today {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.weather-icon {
  color: var(--color-orange);
  margin-bottom: var(--space-xs);
}

.weather-temps {
  display: flex;
  align-items: baseline;
  gap: var(--space-xs);
}

.weather-current {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--color-white);
  letter-spacing: -0.02em;
}

.weather-range {
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.weather-divider {
  color: var(--text-tertiary);
  opacity: 0.6;
}

.weather-label {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.weather-location {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.weather-week {
  display: flex;
  gap: var(--space-sm);
}

.weather-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.weather-day-name {
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.weather-day-date {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.task-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.form-label {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.form-input {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-sm);
  padding: var(--space-sm);
  color: var(--text-primary);
}

.task-type-buttons {
  display: flex;
  gap: var(--space-sm);
}

.task-type-btn {
  flex: 1;
  padding: var(--space-sm);
  border-radius: var(--radius-sm);
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
}

.task-type-btn--active {
  background: rgba(34, 197, 94, 0.12);
  border-color: rgba(34, 197, 94, 0.5);
  color: var(--color-green);
}

.form-error {
  color: var(--color-red);
  font-size: var(--text-xs);
}

.form-submit {
  width: 100%;
  padding: var(--space-sm);
  border-radius: var(--radius-chip);
  border: none;
  background: var(--color-blue);
  color: var(--color-white);
  font-weight: var(--font-semibold);
  cursor: pointer;
}

.task-modal-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.ai-modal-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.ai-modal-item {
  display: flex;
  justify-content: space-between;
  gap: var(--space-sm);
  padding: var(--space-sm);
  border-radius: var(--radius-sm);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.ai-modal-body {
  flex: 1;
  min-width: 0;
}

.ai-modal-title {
  font-weight: var(--font-semibold);
  margin: 0;
}

.ai-modal-reason {
  margin: 4px 0 0;
  color: var(--text-tertiary);
  font-size: var(--text-xs);
}

.ai-modal-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ai-modal-actions button {
  padding: 6px 10px;
  border-radius: var(--radius-chip);
  border: none;
  cursor: pointer;
}

.ai-modal-actions button:first-child {
  background: rgba(34, 197, 94, 0.15);
  color: var(--color-green);
}

.ai-modal-actions button:last-child {
  background: rgba(239, 68, 68, 0.12);
  color: var(--color-red);
}

.ai-modal-empty {
  text-align: center;
  color: var(--text-tertiary);
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.settings-radio-group {
  display: flex;
  gap: var(--space-md);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.coordinates-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-md);
}

.settings-note {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.health-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  padding: var(--space-md);
}

.health-hero-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-md);
  border-radius: var(--radius-tile);
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
}

.health-hero-card__ring {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.health-hero-card__stat {
  display: flex;
  flex-direction: column;
}

.health-hero-card__value {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--color-white);
}

.health-hero-card__label {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.health-hero-card__meta {
  display: flex;
  justify-content: space-between;
}

.health-meta__label {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.health-meta__value {
  font-size: var(--text-lg);
  margin: 0;
}

.health-sync {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.health-sync--warning {
  color: var(--color-orange);
}

.health-trends {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-md);
}

.health-trend-card {
  padding: var(--space-md);
  border-radius: var(--radius-tile);
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.health-trend-card__header {
  display: flex;
  justify-content: space-between;
  color: var(--text-secondary);
}

.health-trend-card__value {
  color: var(--color-white);
  font-weight: var(--font-semibold);
}

.weather-day-low {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.weather-updated {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}
</style>
