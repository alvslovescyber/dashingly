<template>
  <div class="home-page">
    <!-- Sidebar -->
    <Sidebar :current-route="currentSection" @navigate="handleNavigate" />

    <!-- Main Content -->
    <div class="home-page__main">
      <!-- Top Bar -->
      <TopBar :display-name="displayName" @open-settings="openSettingsPanel">
        <!-- Page Indicator Dots -->
        <template #center>
          <div class="page-dots">
            <button
              v-for="section in pagerSections"
              :key="section.id"
              class="page-dot"
              :class="{ 'page-dot--active': currentSection === section.id }"
              @click="goToSectionById(section.id)"
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
                :is-playing="spotifyData.isPlaying"
                :track="spotifyData.track"
                :artist="spotifyData.artist"
                :album="spotifyData.album"
                :album-art="spotifyData.albumArt"
                :progress-ms="spotifyData.progressMs"
                :duration-ms="spotifyData.durationMs"
                :connected="spotifyData.connected"
                class="tile--spotify"
                @retry="handleSpotifyRetry"
                @manage="openSettingsPanel"
                @play-pause="handleSpotifyPlayPause"
                @next="handleSpotifyNext"
                @previous="handleSpotifyPrevious"
              />

              <!-- AI Inbox Tile -->
              <AIInboxTile
                :suggestions="aiSuggestions"
                next-suggestion-time="12:00"
                class="tile--ai-inbox"
                :generating="aiGenerating"
                :connected="aiConnected"
                @accept="handleAIAccept"
                @dismiss="handleAIDismiss"
                @view-all="showAISuggestionsModal = true"
                @generate="handleAIGenerate"
                @connect="openSettingsPanel"
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
                  <div class="strava-chart">
                    <MiniChart
                      :data="stravaData.weekData"
                      :labels="['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']"
                      color="#14B8A6"
                      gradient-start="rgba(34, 197, 94, 0.14)"
                      gradient-end="rgba(34, 197, 94, 0.02)"
                      :height="140"
                      :show-points="true"
                      :min-value="0"
                    />
                  </div>
                  <div class="strava-chart__labels">
                    <span
                      v-for="day in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']"
                      :key="day"
                    >
                      {{ day }}
                    </span>
                  </div>
                </div>
              </TileCard>

              <!-- Tasks Tile -->
              <TileCard title="Today's Tasks" :icon="ListChecks" class="tile--tasks" size="lg">
                <template #headerRight>
                  <span class="task-count">{{ tasksCompleted }}/{{ totalTasks }}</span>
                </template>
                <div class="tasks-content">
                  <TransitionGroup name="task-list" tag="div" class="tasks-list-container">
                    <div
                      v-for="task in displayedTasks"
                      :key="task.id"
                      class="task-item"
                      :class="{
                        'task-item--completed': task.completed,
                        'task-item--completing': completingTaskId === task.id,
                      }"
                      @click="toggleTask(task.id)"
                    >
                      <div class="task-checkbox">
                        <Check v-if="task.completed || completingTaskId === task.id" :size="12" />
                      </div>
                      <span class="task-title">{{ task.title }}</span>
                      <button
                        v-if="task.completed"
                        class="task-delete"
                        type="button"
                        @click.stop="handleTaskDelete(task.id)"
                      >
                        <Trash2 :size="14" />
                      </button>
                    </div>
                  </TransitionGroup>

                  <!-- Inline Task Creation -->
                  <div v-if="isInlineAdding" class="task-inline-add">
                    <input
                      ref="inlineTaskInput"
                      v-model="inlineTaskTitle"
                      class="task-inline-input"
                      type="text"
                      placeholder="New task..."
                      @focus="showInlineKeyboard"
                      @keydown.enter="submitInlineTask"
                      @keydown.escape="cancelInlineTask"
                      @blur="handleInlineBlur"
                    />
                  </div>
                  <button v-else class="task-add" type="button" @click.stop="startInlineAdd">
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
              <TileCard title="Health" :icon="Heart" class="tile--health" size="lg">
                <div class="health-content">
                  <div class="health-stat">
                    <ProgressRing :value="healthDisplay.stepsPercent" :size="64" color="#22c55e">
                      <Footprints :size="20" />
                    </ProgressRing>
                    <div class="health-stat-info">
                      <span class="health-stat-value">{{
                        healthDisplay.steps.toLocaleString()
                      }}</span>
                      <span class="health-stat-label">Steps</span>
                    </div>
                  </div>
                  <div class="health-stat">
                    <ProgressRing :value="healthDisplay.caloriesPercent" :size="64" color="#F97316">
                      <Flame :size="20" />
                    </ProgressRing>
                    <div class="health-stat-info">
                      <span class="health-stat-value">{{ healthDisplay.calories }}</span>
                      <span class="health-stat-label">Calories</span>
                    </div>
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
                  color="#22C55E"
                  gradient-start="rgba(34, 197, 94, 0.12)"
                  gradient-end="rgba(34, 197, 94, 0.02)"
                  :height="180"
                  :smart-scale="false"
                  :min-value="0"
                />
              </TileCard>

              <!-- Weather Tile -->
              <TileCard class="tile--weather" size="md" :interactive="false">
                <template #headerRight>
                  <button
                    class="weather-settings-btn"
                    type="button"
                    @click.stop="openSettingsPanel"
                  >
                    <SettingsIcon :size="14" />
                  </button>
                </template>

                <!-- Weather States -->
                <div class="weather-content">
                  <!-- Loading State -->
                  <div
                    v-if="!weatherData.temperature && !weatherData.condition"
                    class="weather-loading"
                  >
                    <Cloud :size="40" class="weather-loading__icon" />
                    <span class="weather-loading__text">Loading weather...</span>
                  </div>

                  <!-- Data Available -->
                  <template v-else>
                    <div class="weather-today">
                      <component :is="weatherIcon" :size="40" class="weather-icon" />
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
                      <div class="weather-meta">
                        <span class="weather-location-inline">{{ weatherData.location }}</span>
                        <span class="weather-condition">{{ weatherData.condition }}</span>
                      </div>
                    </div>
                    <div class="weather-week">
                      <div v-for="day in formattedForecast" :key="day.day" class="weather-day">
                        <span class="weather-day-name">{{ day.day }}</span>
                        <span class="weather-day-high">{{ formatTemperature(day.high) }}</span>
                        <span class="weather-day-low">{{ formatTemperature(day.low) }}</span>
                      </div>
                    </div>
                    <div class="weather-footer">
                      <span class="weather-updated">{{ weatherUpdatedLabel }}</span>
                    </div>
                  </template>
                </div>
              </TileCard>
            </div>
          </div>

          <!-- Section: Health -->
          <div class="home-page__section home-page__section--health">
            <div class="health-page">
              <TileCard title="Activity overview" :icon="Heart" size="lg" :interactive="false">
                <div class="health-hero-card">
                  <div class="health-hero-card__ring">
                    <ProgressRing :value="healthDisplay.stepsPercent" :size="120">
                      <Footprints :size="32" />
                    </ProgressRing>
                    <div class="health-hero-card__stat">
                      <span class="health-hero-card__value">
                        {{ healthDisplay.steps.toLocaleString() }}
                      </span>
                      <span class="health-hero-card__label">steps today</span>
                    </div>
                  </div>
                  <div class="health-hero-card__meta">
                    <div>
                      <span class="health-meta__label">Active calories</span>
                      <p class="health-meta__value">{{ healthDisplay.calories }}</p>
                    </div>
                  </div>
                  <div
                    class="health-sync"
                    :class="{ 'health-sync--warning': healthDisplay.warning }"
                  >
                    <span>Last synced {{ healthSyncLabel }}</span>
                    <span v-if="healthDisplay.warning">Reconnect Strava</span>
                  </div>
                </div>
              </TileCard>

              <div class="health-trends">
                <TileCard title="Steps · 7 days" class="health-trend-card" :interactive="false">
                  <div class="health-trend-card__header">
                    <span class="health-trend-card__value">{{ latestHealthSteps }}</span>
                  </div>
                  <MiniChart
                    :data="healthTrend"
                    :labels="['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']"
                    color="#34d399"
                    gradient-start="rgba(52, 211, 153, 0.18)"
                  />
                </TileCard>
              </div>
            </div>
          </div>

          <!-- Section: Tasks -->
          <div class="home-page__section home-page__section--tasks">
            <div class="tasks-page">
              <TileCard title="Today" :icon="ListChecks" :interactive="false">
                <template #headerRight>
                  <span class="tasks-count-pill">{{ tasksCompleted }}/{{ totalTasks }}</span>
                </template>
                <div v-if="pendingToday.length" class="tasks-page__list">
                  <button
                    v-for="task in pendingToday"
                    :key="task.id"
                    class="tasks-page__item tasks-page__item--action"
                    @click="toggleTask(task.id)"
                  >
                    <span>{{ task.title }}</span>
                    <span class="tasks-page__item-action">Mark done</span>
                  </button>
                </div>
                <p v-else class="tasks-page__empty">You're all set for today 🎉</p>
              </TileCard>

              <TileCard title="Upcoming" :interactive="false">
                <template #headerRight>
                  <button class="tasks-page__add" @click="showAddTaskModal = true">
                    <Plus :size="14" /> New
                  </button>
                </template>
                <div v-if="oneOffTasks.length" class="tasks-page__list">
                  <div
                    v-for="task in oneOffTasks"
                    :key="task.id"
                    class="tasks-page__item tasks-page__item--static"
                  >
                    <span>{{ task.title }}</span>
                  </div>
                </div>
                <p v-else class="tasks-page__empty">No upcoming tasks</p>
              </TileCard>

              <TileCard title="Completed" :interactive="false">
                <template #headerRight>
                  <span class="tasks-count-pill">{{ completedToday.length }}</span>
                </template>
                <div
                  v-if="completedToday.length"
                  class="tasks-page__list tasks-page__list--compact"
                >
                  <div
                    v-for="task in completedToday"
                    :key="task.id"
                    class="tasks-page__item tasks-page__item--complete"
                  >
                    <Check :size="14" />
                    <span>{{ task.title }}</span>
                    <button class="tasks-page__delete" @click.stop="handleTaskDelete(task.id)">
                      <Trash2 :size="14" />
                    </button>
                  </div>
                </div>
                <p v-else class="tasks-page__empty">Nothing completed yet</p>
              </TileCard>
            </div>
          </div>

          <!-- Section: Reading -->
          <div class="home-page__section home-page__section--reading">
            <div class="reading-page">
              <TileCard title="Daily reading" :icon="BookOpen" :interactive="false">
                <p class="reading-page__reference">{{ currentReference }}</p>
                <p class="reading-page__text">
                  “{{ verseMain }}
                  <span v-if="verseRest">{{ verseRest }}</span>
                  ”
                </p>
                <div class="reading-page__progress">
                  <p class="reading-page__label">Plan progress</p>
                  <div class="reading-page__progress-bar">
                    <div
                      class="reading-page__progress-fill"
                      :style="{ width: `${(bibleData.dayIndex % 365) / 3.65}%` }"
                    />
                  </div>
                </div>
                <div class="reading-page__actions">
                  <button
                    class="bible-button"
                    :class="{ 'bible-button--done': isBibleCompleted }"
                    @click="handleBibleAction"
                  >
                    {{ isBibleCompleted ? 'Completed today' : 'Mark Done' }}
                  </button>
                </div>
              </TileCard>
              <TileCard title="Recent readings" :interactive="false">
                <div v-if="verseHistory.length" class="reading-history">
                  <div
                    v-for="entry in verseHistory"
                    :key="entry.reference"
                    class="reading-history__item"
                  >
                    <span class="reading-history__ref">{{ entry.reference }}</span>
                    <span class="reading-history__date">{{ entry.date }}</span>
                  </div>
                </div>
                <p v-else class="reading-page__empty">History unavailable.</p>
              </TileCard>
            </div>
          </div>

          <!-- Section: Music -->
          <div class="home-page__section home-page__section--music">
            <div class="music-page">
              <TileCard title="Now playing" :icon="Music" :interactive="false">
                <div v-if="spotifyData.connected && spotifyData.track" class="music-now-playing">
                  <div class="music-now-playing__art">
                    <img :src="musicArt" alt="Album art" @error="handleMusicArtError" />
                  </div>
                  <div class="music-now-playing__body">
                    <div class="music-now-playing__headline">{{ spotifyData.track }}</div>
                    <span class="music-now-playing__artist">{{ spotifyData.artist }}</span>
                    <div class="music-now-playing__progress">
                      <span>{{ formatDuration(spotifyData.progressMs) }}</span>
                      <div class="music-now-playing__bar">
                        <div
                          class="music-now-playing__bar-fill"
                          :style="{ width: `${musicProgressPercent}%` }"
                        />
                      </div>
                      <span>{{ formatDuration(spotifyData.durationMs) }}</span>
                    </div>
                  </div>
                </div>
                <div v-else class="music-empty">
                  <p class="music-page__title">Waiting for Spotify</p>
                  <p class="music-page__copy">
                    Start playback on your phone or desktop and it will appear here.
                  </p>
                  <button class="music-connect" @click="handleSpotifyRetry">Refresh</button>
                </div>
              </TileCard>
              <TileCard title="Connection" :interactive="false">
                <div class="music-status">
                  <div>
                    <p class="music-status__label">Status</p>
                    <p class="music-status__value">
                      {{ spotifyData.connected ? 'Connected' : 'Not connected' }}
                    </p>
                  </div>
                  <button class="music-connect" @click="openSettingsPanel">
                    {{ spotifyData.connected ? 'Manage' : 'Connect Spotify' }}
                  </button>
                </div>
              </TileCard>
            </div>
          </div>

          <!-- Section: Settings -->
          <div class="home-page__section home-page__section--settings">
            <SettingsPage />
          </div>
        </div>
      </div>
    </div>

    <!-- Add Task Modal -->
    <ModalSheet v-model="showAddTaskModal" title="Add Task" size="sm">
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
            @focus="showModalKeyboard"
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
          <button
            v-if="task.completed"
            class="task-delete"
            type="button"
            @click.stop="handleTaskDelete(task.id)"
          >
            <Trash2 :size="14" />
          </button>
        </div>
      </div>
    </ModalSheet>

    <!-- Suggestions Modal -->
    <ModalSheet v-model="showAISuggestionsModal" title="Suggestions">
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

    <VirtualKeyboard
      v-model="keyboardValue"
      :visible="keyboardVisible"
      @enter="handleKeyboardEnter"
      @close="hideKeyboard"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, inject, type Ref } from 'vue'
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
  Trash2,
  Settings as SettingsIcon,
  Music,
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
  VirtualKeyboard,
} from '../components'
import AIInboxTile from '../components/tiles/AIInboxTile.vue'
import { useDashboard } from '../composables/useDashboard'
import { useVerseOfDay } from '../composables/useVerseOfDay'
import SettingsPage from './SettingsPage.vue'

type ToastHandle = {
  success: (message: string, description?: string) => void
  error: (message: string, description?: string) => void
  info: (message: string, description?: string) => void
  warning: (message: string, description?: string) => void
  show?: (toast: {
    type: 'success' | 'error' | 'info' | 'warning'
    message: string
    description?: string
    action?: { label: string; handler: () => void }
  }) => void
}

// Dashboard data from main process
const {
  displayName,
  tasks,
  todayTasks,
  tasksCompleted,
  totalTasks,
  aiSuggestions,
  stravaData,
  spotifyData,
  bibleData,
  lastSync,
  weatherData,
  hasOpenAIKey,
  completeTask,
  acceptSuggestion,
  dismissSuggestion,
  markBibleComplete,
  createTask,
  deleteTask: deleteTaskAction,
  fetchSnapshot,
} = useDashboard()

const toast = inject<Ref<ToastHandle | undefined>>('toast')

type ToastMethod = Exclude<keyof ToastHandle, 'show'>

function notify(type: ToastMethod, message: string, description?: string) {
  toast?.value?.[type]?.(message, description)
}

// Navigation - Sections for swipe navigation
const sections = [
  { id: 'home', label: 'Home', showInPager: true },
  { id: 'health', label: 'Health', showInPager: true },
  { id: 'tasks', label: 'Tasks', showInPager: true },
  { id: 'reading', label: 'Reading', showInPager: true },
  { id: 'music', label: 'Music', showInPager: true },
  { id: 'settings', label: 'Settings', showInPager: false },
] as const

const pagerSections = sections.filter(section => section.showInPager !== false)

const currentSectionIndex = ref(0)
const currentSection = computed(() => sections[currentSectionIndex.value]?.id ?? 'home')
const showAddTaskModal = ref(false)
const showAllTasksModal = ref(false)
const showAISuggestionsModal = ref(false)
const aiGenerating = ref(false)
const stravaEnabled = ref(true)
const aiConnected = computed(() => hasOpenAIKey.value)

function handleNavigate(route: string) {
  goToSectionById(route)
}

function goToSectionById(id: string) {
  const index = sections.findIndex(section => section.id === id)
  if (index !== -1) {
    currentSectionIndex.value = index
  }
}

function openSettingsPanel() {
  goToSectionById('settings')
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

async function handleAIGenerate() {
  if (aiGenerating.value) return
  if (!aiConnected.value) {
    toast?.value?.show?.({
      type: 'warning',
      message: 'OpenAI not connected',
      description: 'Add your OpenAI key in Settings → AI.',
      action: { label: 'Open settings', handler: openSettingsPanel },
    })
    return
  }
  aiGenerating.value = true
  try {
    const result = await window.electronAPI.triggerAISuggestions()
    if (!result.success) {
      if (result.reason?.toString().toLowerCase().includes('key')) {
        toast?.value?.show?.({
          type: 'warning',
          message: 'OpenAI not connected',
          description: 'Add your OpenAI key in Settings → AI.',
          action: { label: 'Open settings', handler: openSettingsPanel },
        })
      } else {
        notify('error', 'Unable to generate suggestions', result.reason)
      }
      return
    }
    await fetchSnapshot(true)
    notify('success', 'AI suggestions refreshed')
  } catch (error) {
    console.error('AI generation failed', error)
    notify('error', 'Unable to generate suggestions')
  } finally {
    aiGenerating.value = false
  }
}

async function handleSpotifyRetry() {
  try {
    await fetchSnapshot(true)
    notify('info', 'Spotify refreshed')
  } catch (error) {
    console.error('Spotify refresh failed', error)
    notify('error', 'Unable to refresh Spotify')
  }
}

async function handleSpotifyPlayPause() {
  try {
    if (spotifyData.value.isPlaying) {
      await window.electronAPI.pauseSpotify()
    } else {
      await window.electronAPI.playSpotify()
    }
    await fetchSnapshot(true)
  } catch (error) {
    console.error('Spotify play/pause failed', error)
    notify('error', 'Unable to control Spotify')
  }
}

async function handleSpotifyNext() {
  try {
    await window.electronAPI.nextSpotify()
    await fetchSnapshot(true)
  } catch (error) {
    console.error('Spotify next failed', error)
    notify('error', 'Unable to skip track')
  }
}

async function handleSpotifyPrevious() {
  try {
    await window.electronAPI.previousSpotify()
    await fetchSnapshot(true)
  } catch (error) {
    console.error('Spotify previous failed', error)
    notify('error', 'Unable to go back')
  }
}

const pendingToday = computed(() => todayTasks.value.filter(task => !task.completed))
const completedToday = computed(() => todayTasks.value.filter(task => task.completed))
const oneOffTasks = computed(() =>
  tasks.value.filter(task => task.type === 'oneoff' && task.isActive)
)

// Task toggle handler with animation
function toggleTask(id: string) {
  const task = todayTasks.value.find(t => t.id === id)
  if (!task) return

  // If completing (not un-completing), show animation
  if (!task.completed) {
    completingTaskId.value = id
    setTimeout(() => {
      completeTask(id)
      completingTaskId.value = null
    }, 200)
  } else {
    // Un-completing, no animation needed
    completeTask(id)
  }
}

async function handleTaskDelete(id: string) {
  try {
    await deleteTaskAction(id)
  } catch (error) {
    console.error('Failed to delete task', error)
  }
}

const TASK_TILE_LIMIT = 5
const displayedTasks = computed(() => todayTasks.value.slice(0, TASK_TILE_LIMIT))
const hasMoreTasks = computed(() => todayTasks.value.length > displayedTasks.value.length)
const newTaskTitle = ref('')
const newTaskType = ref<'daily' | 'oneoff'>('daily')
const taskSaving = ref(false)
const taskError = ref<string | null>(null)

// Inline task creation state
const isInlineAdding = ref(false)
const inlineTaskTitle = ref('')
const inlineTaskInput = ref<HTMLInputElement | null>(null)
const completingTaskId = ref<string | null>(null)
const keyboardTarget = ref<'inline' | 'modal' | null>(null)

const keyboardVisible = computed(() => keyboardTarget.value !== null)
const keyboardValue = computed({
  get() {
    if (keyboardTarget.value === 'inline') return inlineTaskTitle.value
    if (keyboardTarget.value === 'modal') return newTaskTitle.value
    return ''
  },
  set(value: string) {
    if (keyboardTarget.value === 'inline') {
      inlineTaskTitle.value = value
    } else if (keyboardTarget.value === 'modal') {
      newTaskTitle.value = value
    }
  },
})

function showInlineKeyboard() {
  keyboardTarget.value = 'inline'
}

function showModalKeyboard() {
  keyboardTarget.value = 'modal'
}

function hideKeyboard() {
  keyboardTarget.value = null
}

function handleKeyboardEnter() {
  if (keyboardTarget.value === 'inline') {
    submitInlineTask()
  } else if (keyboardTarget.value === 'modal') {
    submitTask()
  }
}

function startInlineAdd() {
  isInlineAdding.value = true
  inlineTaskTitle.value = ''
  showInlineKeyboard()
  // Focus input on next tick
  setTimeout(() => {
    inlineTaskInput.value?.focus()
  }, 10)
}

function cancelInlineTask() {
  isInlineAdding.value = false
  inlineTaskTitle.value = ''
  if (keyboardTarget.value === 'inline') {
    hideKeyboard()
  }
}

function handleInlineBlur() {
  // Small delay to allow submit to fire first if Enter was pressed
  setTimeout(() => {
    if (keyboardTarget.value === 'inline') {
      return
    }
    if (isInlineAdding.value && !inlineTaskTitle.value.trim()) {
      cancelInlineTask()
    }
  }, 150)
}

async function submitInlineTask() {
  const title = inlineTaskTitle.value.trim()
  if (!title) {
    cancelInlineTask()
    return
  }

  try {
    await createTask({ title, type: 'daily' })
    inlineTaskTitle.value = ''
    await fetchSnapshot(true)
    // Keep input focused for rapid entry
    inlineTaskInput.value?.focus()
  } catch (error) {
    console.error('Failed to create task', error)
  }
}

watch(showAddTaskModal, open => {
  if (!open) {
    resetTaskForm()
    if (keyboardTarget.value === 'modal') {
      hideKeyboard()
    }
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
    hideKeyboard()
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
const verseHistory = verseData.history
const musicFallbackArt =
  'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/a5/c4/90/a5c490a1-d914-9943-7e02-32f8320e5840/12UMGIM12516.rgb.jpg/600x600bb.jpg'

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
const stravaConnected = computed(() => stravaData.value.connected)
const weeklyRunData = computed(() =>
  stravaConnected.value ? [...stravaData.value.weekData] : [0, 0, 0, 0, 0, 0, 0]
)

const monthlyRunData = computed(() => {
  const source = weeklyRunData.value
  const buckets = [0, 0, 0, 0]
  source.forEach((val, idx) => {
    const bucket = Math.min(3, Math.floor(idx / 2))
    if (bucket >= 0 && bucket < buckets.length) {
      buckets[bucket] = (buckets[bucket] ?? 0) + val
    }
  })
  return buckets
})

const energyChart = computed(() => {
  if (energyPeriod.value === 'weekly') {
    return {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      data: weeklyRunData.value,
    }
  }
  return {
    labels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'],
    data: monthlyRunData.value,
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

type WeatherIconKey = keyof typeof weatherIconMap

const weatherIcon = computed(() => {
  const key = (weatherData.value.icon ?? 'cloud') as WeatherIconKey
  return weatherIconMap[key] ?? CloudSun
})

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

function formatDuration(ms: number | null | undefined): string {
  if (!ms) return '0:00'
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
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

// Settings form (Weather + General)

// Health helpers (powered by Strava for now)
const healthDisplay = computed(() => {
  if (!stravaConnected.value) {
    return { steps: 0, stepsPercent: 0, calories: 0, caloriesPercent: 0, warning: true }
  }
  const weekKm = stravaData.value.weekData.reduce((sum, d) => sum + d, 0)
  const steps = Math.round(weekKm * 1300) // rough conversion
  const calories = Math.round(weekKm * 60) // rough run kcal estimate
  const stepsPercent = Math.min(100, Math.round((steps / 10000) * 100))
  const caloriesPercent = Math.min(100, Math.round((calories / 500) * 100))
  return { steps, stepsPercent, calories, caloriesPercent, warning: false }
})

const healthTrend = computed(() => weeklyRunData.value)
const healthSyncLabel = computed(() => formatRelativeTime(lastSync.value.strava))
const latestHealthSteps = computed(() => {
  const trend = healthTrend.value
  const last = trend[trend.length - 1]
  return last ? Math.round(last * 1300).toLocaleString() : '--'
})

const musicArt = computed(() => spotifyData.value.albumArt || musicFallbackArt)

const musicProgressPercent = computed(() => {
  if (!spotifyData.value.durationMs) return 0
  const pct = (spotifyData.value.progressMs / spotifyData.value.durationMs) * 100
  return Math.min(100, Math.max(0, pct))
})

function handleMusicArtError(event: Event) {
  const target = event.target as HTMLImageElement
  if (target && target.src !== musicFallbackArt) {
    target.src = musicFallbackArt
  }
}
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
  min-height: 0; /* Allow flex child to shrink */
}

/* Custom scrollbar for sections */
.home-page__section::-webkit-scrollbar {
  width: 6px;
}
.home-page__section::-webkit-scrollbar-track {
  background: transparent;
}
.home-page__section::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 999px;
}
.home-page__section::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
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
  overflow-x: hidden;
  padding-bottom: var(--space-lg);
  /* Ensure content doesn't get cut off */
  min-height: 0;
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
  min-height: 220px;
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
  gap: var(--space-sm);
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

.strava-chart {
  flex: 1;
  display: flex;
  align-items: flex-end;
}

.strava-chart__labels {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  margin-top: 8px;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-tertiary);
  gap: 4px;
}

.strava-chart__labels span {
  text-align: center;
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

.tasks-list-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  position: relative;
}

/* Task list animations */
.task-list-enter-active,
.task-list-leave-active {
  transition: all var(--duration-normal) var(--ease-out);
}

.task-list-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.task-list-leave-to {
  opacity: 0;
  transform: translateX(16px);
}

.task-list-move {
  transition: transform var(--duration-normal) var(--ease-out);
}

.task-item {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: var(--space-sm);
  padding: var(--space-sm);
  background: rgba(255, 255, 255, 0.04);
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
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

/* Completing animation state */
.task-item--completing {
  background: rgba(34, 197, 94, 0.12);
  border-color: rgba(34, 197, 94, 0.2);
  transform: scale(0.98);
}

.task-item--completing .task-checkbox {
  background: var(--color-green);
  border-color: var(--color-green);
  color: var(--color-white);
  animation: check-pop 0.2s var(--ease-out);
}

@keyframes check-pop {
  0% {
    transform: scale(0.8);
  }
  50% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
  }
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
  transition: all var(--duration-fast) var(--ease-out);
}

/* Inline task input */
.task-inline-add {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.task-inline-input {
  flex: 1;
  padding: var(--space-sm) 10px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: var(--text-sm);
  outline: none;
  transition: all var(--duration-fast) var(--ease-out);
}

.task-inline-input:focus {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--color-blue);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

.task-inline-input::placeholder {
  color: var(--text-muted);
}

.task-item--completed .task-checkbox {
  background: var(--color-green);
  border-color: var(--color-green);
  color: var(--color-white);
}

.task-title {
  font-size: var(--text-sm);
  color: var(--text-primary);
  flex: 1;
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

.task-delete {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-out);
}

.task-delete:hover {
  background: rgba(255, 255, 255, 0.08);
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

.tasks-page {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-md);
}

.tasks-page__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.tasks-page__list--compact .tasks-page__item {
  padding: 8px 10px;
}

.tasks-page__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px var(--space-sm);
  background: rgba(255, 255, 255, 0.04);
  border-radius: var(--radius-sm);
  border: 1px solid rgba(255, 255, 255, 0.06);
  font-size: var(--text-sm);
  color: var(--text-primary);
}

.tasks-page__item--action {
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-out);
}

.tasks-page__item--action:hover {
  background: rgba(255, 255, 255, 0.08);
}

.tasks-page__item-action {
  font-size: var(--text-xs);
  color: var(--color-green);
}

.tasks-page__item--complete {
  gap: var(--space-sm);
}

.tasks-page__empty {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.tasks-count-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.tasks-page__add {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--text-xs);
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: var(--radius-full);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: var(--text-primary);
  cursor: pointer;
}

.tile--health {
  flex: 2;
}

.reading-page {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--space-md);
}

.reading-page__reference {
  font-size: var(--text-sm);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-tertiary);
  margin-bottom: var(--space-sm);
}

.reading-page__text {
  font-size: var(--text-lg);
  line-height: 1.6;
  margin: 0 0 var(--space-md);
  color: var(--text-primary);
}

.reading-page__progress {
  margin-top: var(--space-md);
}

.reading-page__label {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin-bottom: var(--space-xs);
}

.reading-page__progress-bar {
  width: 100%;
  height: 6px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.reading-page__progress-fill {
  height: 100%;
  background: var(--color-green);
  border-radius: var(--radius-full);
}

.reading-page__actions {
  margin-top: var(--space-md);
}

.reading-history {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.reading-history__item {
  display: flex;
  justify-content: space-between;
  padding: 10px var(--space-sm);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.03);
  font-size: var(--text-sm);
}

.reading-history__ref {
  color: var(--text-primary);
}

.reading-history__date {
  color: var(--text-tertiary);
  font-size: var(--text-xs);
}

.music-page {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--space-md);
}

.music-now-playing {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-sm);
  align-items: center;
}

.music-now-playing__art {
  width: 112px;
  height: 112px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 26px rgba(0, 0, 0, 0.25);
}

.music-now-playing__art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.music-now-playing__body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.music-now-playing__headline {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  line-height: 1.2;
}

.music-now-playing__artist {
  color: var(--text-tertiary);
  font-size: var(--text-sm);
}

.music-now-playing__progress {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.music-now-playing__bar {
  flex: 1;
  height: 4px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.music-now-playing__bar-fill {
  height: 100%;
  background: var(--color-green);
  border-radius: var(--radius-full);
}

.music-empty {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  color: var(--text-secondary);
}

.music-page__title {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  margin: 0;
}

.music-page__copy {
  margin: 0;
  color: var(--text-tertiary);
  font-size: var(--text-sm);
}

.music-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
}

.music-status__label {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin: 0;
}

.music-status__value {
  font-size: var(--text-base);
  color: var(--text-primary);
  margin: 4px 0 0;
}

.music-connect {
  align-self: flex-start;
  padding: 6px 12px;
  border-radius: var(--radius-full);
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: transparent;
  color: var(--text-primary);
  font-size: var(--text-xs);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-out);
}

.music-connect:hover {
  background: rgba(255, 255, 255, 0.08);
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
  gap: var(--space-sm);
}

.bible-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.bible-reference {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  letter-spacing: 0.02em;
  text-transform: uppercase;
  background: rgba(255, 255, 255, 0.08);
  padding: 3px 8px;
  border-radius: var(--radius-chip);
}

.bible-verse-container {
  flex: 1;
  display: flex;
  gap: var(--space-sm);
  overflow: hidden;
}

.bible-verse-border {
  width: 3px;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-full);
}

.bible-verse {
  margin: 0;
  font-size: var(--text-sm);
  line-height: 1.5;
  color: var(--text-primary);
  font-style: italic;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
}

.bible-verse__rest {
  color: var(--text-primary);
}

.bible-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  width: 100%;
  padding: 10px var(--space-md);
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.25);
  border-radius: var(--radius-sm);
  color: var(--color-green);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
  margin-top: auto;
}

.bible-button:hover {
  background: rgba(34, 197, 94, 0.25);
  border-color: rgba(34, 197, 94, 0.35);
}

.bible-button:active {
  transform: scale(0.98);
}

.bible-button--done {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
}

.bible-button--done:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* Bottom Row */
.home-page__row--bottom {
  min-height: 200px;
}

.tile--energy {
  flex: 2.25;
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
  flex: 1.25;
}

.weather-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  height: 100%;
}

.weather-settings-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.weather-settings-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
}

/* Weather Loading State */
.weather-loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  color: var(--text-tertiary);
}

.weather-loading__icon {
  opacity: 0.4;
  animation: weather-pulse 2s ease-in-out infinite;
}

@keyframes weather-pulse {
  0%,
  100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.6;
  }
}

.weather-loading__text {
  font-size: var(--text-sm);
}

.weather-today {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.weather-icon {
  color: var(--color-orange);
  filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.3));
}

.weather-temps {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.weather-current {
  font-size: 26px;
  font-weight: var(--font-bold);
  color: var(--color-white);
  letter-spacing: -0.02em;
  line-height: 1;
}

.weather-range {
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.weather-divider {
  color: var(--text-tertiary);
  opacity: 0.6;
}

.weather-meta {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 0;
}

.weather-condition {
  font-size: 12px;
  color: var(--text-secondary);
  text-transform: capitalize;
}

.weather-location-inline {
  font-size: 14px;
  color: var(--text-primary);
  opacity: 0.82;
  font-weight: var(--font-medium);
}

.weather-week {
  display: flex;
  gap: 10px;
  margin-top: auto;
  padding-bottom: 6px;
}

.weather-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}

.weather-footer {
  display: flex;
  justify-content: flex-end;
  width: 100%;
  padding-top: var(--space-sm);
  padding-bottom: 2px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.weather-updated {
  font-size: 11px;
  color: var(--text-muted);
}

.weather-day-name {
  font-size: 10px;
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  text-transform: uppercase;
}

.weather-day-high {
  font-size: 12px;
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.weather-day-low {
  font-size: 11px;
  color: var(--text-tertiary);
}

.task-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.form-label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.form-input {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  color: var(--text-primary);
  font-size: var(--text-sm);
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.05);
}

.task-type-buttons {
  display: flex;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.task-type-btn {
  flex: 1;
  padding: 8px;
  border-radius: calc(var(--radius-sm) - 2px);
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  transition: all 0.2s ease;
}

.task-type-btn:hover {
  color: var(--text-secondary);
}

.task-type-btn--active {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.form-error {
  color: var(--color-red);
  font-size: var(--text-xs);
  background: rgba(239, 68, 68, 0.1);
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.form-submit {
  width: 100%;
  padding: 12px;
  border-radius: var(--radius-sm);
  border: none;
  background: var(--color-blue);
  color: var(--color-white);
  font-weight: var(--font-bold);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 8px;
}

.form-submit:hover {
  background: var(--color-blue-light);
}

.form-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

/* Full Width Form Layout */
.settings-section,
.task-form {
  width: 100%;
}

.city-search-container {
  position: relative;
}

.input-wrapper {
  position: relative;
}

.city-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #1a1a1a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-sm);
  margin-top: 4px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.city-suggestion-item {
  width: 100%;
  text-align: left;
  padding: 8px 12px;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: var(--text-sm);
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.city-suggestion-item:last-child {
  border-bottom: none;
}

.city-suggestion-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.input-spinner {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--color-blue);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  pointer-events: none;
}

@keyframes spin {
  to {
    transform: translateY(-50%) rotate(360deg);
  }
}

.settings-radio-group {
  display: flex;
  gap: var(--space-md);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.settings-radio-group--compact {
  gap: var(--space-sm);
}

.settings-radio-group label {
  display: flex;
  align-items: center;
  gap: 6px;
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
}

.health-hero-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding-top: var(--space-sm);
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
