<template>
  <div class="home-page">
    <!-- Sidebar -->
    <Sidebar :current-route="currentSection" @navigate="handleNavigate" />

    <!-- Main Content -->
    <div class="home-page__main">
      <!-- Top Bar -->
      <TopBar
        :display-name="displayName"
        :focus-mode="focusMode"
        @toggle-focus="toggleFocusMode"
        @open-settings="showSettings = true"
      >
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

      <!-- Focus Mode -->
      <div v-if="focusMode" class="focus-mode">
        <p class="focus-mode__label">Focus mode</p>
        <p class="focus-mode__time">{{ focusClock }}</p>
        <p class="focus-mode__date">{{ focusDate }}</p>
        <div class="focus-mode__grid">
          <TileCard title="Today's Tasks" :interactive="false">
            <div v-if="pendingToday.length" class="focus-mode__list">
              <div v-for="task in pendingToday" :key="task.id" class="focus-mode__list-item">
                <button class="task-checkbox" @click="toggleTask(task.id)">
                  <Check v-if="task.completed" :size="12" />
                </button>
                <span>{{ task.title }}</span>
              </div>
            </div>
            <p v-else class="focus-mode__empty">All tasks complete</p>
          </TileCard>
          <TileCard title="Weekly Running" :interactive="false">
            <p class="focus-mode__stat">{{ stravaData.weeklyDistance }} km</p>
            <p class="focus-mode__hint">/{{ stravaData.weeklyTarget }} km target</p>
            <MiniChart
              :data="stravaData.weekData"
              :labels="['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']"
              color="#14B8A6"
              gradient-start="rgba(20, 184, 166, 0.12)"
              gradient-end="rgba(20, 184, 166, 0)"
              :show-points="true"
            />
          </TileCard>
          <TileCard title="Weather" :interactive="false">
            <p class="focus-mode__stat">{{ formatTemperature(weatherData.temperature) }}</p>
            <p class="focus-mode__hint">{{ weatherData.condition }}</p>
            <p class="focus-mode__hint">Updated {{ weatherUpdatedLabel }}</p>
          </TileCard>
        </div>
      </div>

      <!-- Swipeable Content Area -->
      <div
        v-else
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
                v-if="spotifyData.connected"
                :is-visible="shouldShowSpotify"
                :is-playing="spotifyData.isPlaying"
                :track="spotifyData.track"
                :artist="spotifyData.artist"
                :album="spotifyData.album"
                :album-art="spotifyData.albumArt"
                :progress-ms="spotifyData.progressMs"
                :duration-ms="spotifyData.durationMs"
                :connected="spotifyData.connected"
                class="tile--spotify"
              />
              <DaySummaryTile
                v-else
                class="tile--spotify"
                :tasks-completed="tasksCompleted"
                :total-tasks="totalTasks"
                :weekly-distance="weeklyDistanceDisplay"
                :weather-summary="daySummaryWeather"
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
                    :show-points="true"
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
                    <button
                      v-if="task.completed"
                      class="task-delete"
                      type="button"
                      @click.stop="handleTaskDelete(task.id)"
                    >
                      <Trash2 :size="14" />
                    </button>
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
                <MiniChart :data="energyChart.data" :labels="energyChart.labels" :height="100" />
              </TileCard>

              <!-- Weather Tile -->
              <TileCard class="tile--weather" size="md" :interactive="false">
                <template #headerRight>
                  <button
                    class="weather-settings-btn"
                    type="button"
                    @click.stop="showSettings = true"
                  >
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
                <div
                  class="health-sync"
                  :class="{ 'health-sync--warning': healthData.warningDays }"
                >
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

          <!-- Section: Tasks -->
          <div class="home-page__section home-page__section--tasks">
            <div class="tasks-page">
              <div class="tasks-page__column">
                <div class="tasks-page__header">
                  <h3>Today</h3>
                  <span>{{ tasksCompleted }}/{{ totalTasks }}</span>
                </div>
                <div v-if="pendingToday.length" class="tasks-page__list">
                  <button
                    v-for="task in pendingToday"
                    :key="task.id"
                    class="tasks-page__item"
                    @click="toggleTask(task.id)"
                  >
                    <span>{{ task.title }}</span>
                    <span class="tasks-page__item-action">Mark done</span>
                  </button>
                </div>
                <p v-else class="tasks-page__empty">You're all set for today 🎉</p>
              </div>

              <div class="tasks-page__column">
                <div class="tasks-page__header">
                  <h3>One-off</h3>
                  <button class="tasks-page__add" @click="showAddTaskModal = true">
                    <Plus :size="14" /> New
                  </button>
                </div>
                <div v-if="oneOffTasks.length" class="tasks-page__list">
                  <div v-for="task in oneOffTasks" :key="task.id" class="tasks-page__item tasks-page__item--static">
                    <span>{{ task.title }}</span>
                  </div>
                </div>
                <p v-else class="tasks-page__empty">No upcoming tasks</p>
              </div>

              <div class="tasks-page__column">
                <div class="tasks-page__header">
                  <h3>Completed</h3>
                  <span>{{ completedToday.length }}</span>
                </div>
                <div v-if="completedToday.length" class="tasks-page__list">
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
              </div>
            </div>
          </div>

          <!-- Section: Reading -->
          <div class="home-page__section home-page__section--reading">
            <div class="reading-page">
              <TileCard title="Daily Reading" :icon="BookOpen" :interactive="false">
                <p class="reading-page__reference">{{ currentReference }}</p>
                <p class="reading-page__text">
                  “{{ verseMain }}
                  <span v-if="verseRest">{{ verseRest }}</span>
                  ”
                </p>
                <div class="reading-page__actions">
                  <button class="bible-button" :class="{ 'bible-button--done': isBibleCompleted }" @click="handleBibleAction">
                    {{ isBibleCompleted ? 'Completed today' : 'Mark Done' }}
                  </button>
                </div>
              </TileCard>
              <div class="reading-page__progress">
                <p class="reading-page__label">Plan progress</p>
                <div class="reading-page__progress-bar">
                  <div class="reading-page__progress-fill" :style="{ width: `${(bibleData.dayIndex % 365) / 3.65}%` }" />
                </div>
              </div>
            </div>
          </div>

          <!-- Section: Music -->
          <div class="home-page__section home-page__section--music">
            <div class="music-page">
              <TileCard title="Spotify" :icon="Music" :interactive="false">
                <p class="music-page__title">Developer access pending</p>
                <p class="music-page__copy">
                  Focus on tasks, health, and reading while Spotify integration is offline. Add your own
                  tracks once Spotify Developer credentials are restored.
                </p>
              </TileCard>
            </div>
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
    <ModalSheet v-model="showSettings" title="Settings" size="sm">
      <div class="settings-section">
        <label class="form-label">
          Display Name
          <input
            v-model="settingsForm.displayName"
            class="form-input"
            type="text"
            placeholder="Your Name"
          />
        </label>

        <span class="form-label">Weather Location Mode</span>
        <div class="settings-radio-group">
          <label>
            <input
              v-model="settingsForm.locationMode"
              type="radio"
              value="city"
              name="locationMode"
            />
            City
          </label>
          <label>
            <input
              v-model="settingsForm.locationMode"
              type="radio"
              value="latlon"
              name="locationMode"
            />
            Latitude/Longitude
          </label>
        </div>

        <label v-if="settingsForm.locationMode === 'city'" class="form-label city-search-container">
          City
          <div class="input-wrapper">
            <input
              v-model="settingsForm.cityName"
              class="form-input"
              type="text"
              placeholder="Chicago"
              @input="handleCityInput"
            />
            <div v-if="showCitySuggestions" class="city-suggestions">
              <button
                v-for="(city, index) in citySuggestions"
                :key="index"
                class="city-suggestion-item"
                @click="selectCity(city)"
              >
                {{ city.name }}
              </button>
            </div>
            <div v-if="searchingCity" class="input-spinner"></div>
          </div>
        </label>

        <div v-else class="coordinates-grid">
          <label class="form-label">
            Latitude
            <input
              v-model.number="settingsForm.latitude"
              class="form-input"
              type="number"
              step="0.01"
              placeholder="41.88"
            />
          </label>
          <label class="form-label">
            Longitude
            <input
              v-model.number="settingsForm.longitude"
              class="form-input"
              type="number"
              step="0.01"
              placeholder="-87.62"
            />
          </label>
        </div>

        <label class="form-label">
          Units
          <div class="settings-radio-group settings-radio-group--compact">
            <label>
              <input v-model="settingsForm.units" type="radio" value="metric" name="units" />
              Celsius
            </label>
            <label>
              <input v-model="settingsForm.units" type="radio" value="imperial" name="units" />
              Fahrenheit
            </label>
          </div>
        </label>

        <p v-if="loadingSettings" class="settings-note">Loading current settings...</p>
        <p v-if="settingsError" class="form-error">{{ settingsError }}</p>

        <button class="form-submit" type="button" :disabled="savingSettings" @click="saveSettings">
          {{ savingSettings ? 'Saving...' : 'Save Settings' }}
        </button>
      </div>
    </ModalSheet>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
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
} from '../components'
import AIInboxTile from '../components/tiles/AIInboxTile.vue'
import { useDashboard } from '../composables/useDashboard'
import { useVerseOfDay } from '../composables/useVerseOfDay'
import type { WeatherSettings } from '@shared/types'
import DaySummaryTile from '../components/DaySummaryTile.vue'


// Dashboard data from main process
const {
  displayName,
  tasks,
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
  deleteTask: deleteTaskAction,
  fetchSnapshot,
} = useDashboard()

// Navigation - Sections for swipe navigation
const sections = [
  { id: 'home', label: 'Home' },
  { id: 'health', label: 'Health' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'reading', label: 'Reading' },
  { id: 'music', label: 'Music' },
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

function toggleFocusMode() {
  focusMode.value = !focusMode.value
}

const shouldShowSpotify = computed(
  () => spotifyData.value.connected || Boolean(spotifyData.value.track)
)

const pendingToday = computed(() => todayTasks.value.filter(task => !task.completed))
const completedToday = computed(() => todayTasks.value.filter(task => task.completed))
const oneOffTasks = computed(() =>
  tasks.value.filter(task => task.type === 'oneoff' && task.isActive)
)

const daySummaryWeather = computed(() => {
  if (weatherData.value.temperature !== null && weatherData.value.condition) {
    return `${formatTemperature(weatherData.value.temperature)} • ${weatherData.value.condition}`
  }
  return weatherData.value.condition ?? '—'
})

const weeklyDistanceDisplay = computed(() =>
  stravaData.value.weeklyDistance ? Number(stravaData.value.weeklyDistance).toFixed(1) : '0'
)



// Task toggle handler
function toggleTask(id: string) {
  completeTask(id)
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
const focusMode = ref(false)
const focusNow = ref(new Date())
let focusTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  focusTimer = setInterval(() => {
    focusNow.value = new Date()
  }, 60 * 1000)
})

onUnmounted(() => {
  if (focusTimer) {
    clearInterval(focusTimer)
  }
})

const focusClock = computed(() =>
  new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(focusNow.value)
)

const focusDate = computed(() =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(focusNow.value)
)

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
const settingsForm = ref({
  displayName: '',
  locationMode: 'city',
  cityName: 'New York',
  latitude: undefined as number | undefined,
  longitude: undefined as number | undefined,
  units: 'metric',
})
const loadingSettings = ref(false)
const savingSettings = ref(false)
const settingsError = ref<string | null>(null)
const citySuggestions = ref<Array<{ name: string; latitude: number; longitude: number }>>([])
const searchingCity = ref(false)
const showCitySuggestions = ref(false)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

function handleCityInput(e: Event) {
  const query = (e.target as HTMLInputElement).value

  if (searchTimeout) clearTimeout(searchTimeout)

  if (!query || query.length < 2) {
    citySuggestions.value = []
    showCitySuggestions.value = false
    return
  }

  searchingCity.value = true
  // Debounce search
  searchTimeout = setTimeout(async () => {
    try {
      const results = await window.electronAPI.searchCities(query)
      citySuggestions.value = results
      showCitySuggestions.value = results.length > 0
    } catch (err) {
      console.error('Search failed', err)
    } finally {
      searchingCity.value = false
    }
  }, 500)
}

function selectCity(city: { name: string; latitude: number; longitude: number }) {
  settingsForm.value.cityName = city.name
  settingsForm.value.latitude = city.latitude
  settingsForm.value.longitude = city.longitude

  showCitySuggestions.value = false
  citySuggestions.value = []
}

// Close suggestions on click outside
watch(showSettings, value => {
  if (value) {
    loadSettings()
    // Reset suggestion state
    citySuggestions.value = []
    showCitySuggestions.value = false
  }
})

async function loadSettings() {
  loadingSettings.value = true
  settingsError.value = null
  try {
    const [weatherSettings, currentName] = await Promise.all([
      window.electronAPI.getWeatherSettings(),
      window.electronAPI.getSetting('displayName'),
    ])

    settingsForm.value = {
      locationMode: weatherSettings.locationMode,
      cityName: weatherSettings.cityName || '',
      latitude: weatherSettings.latitude,
      longitude: weatherSettings.longitude,
      units: weatherSettings.units,
      displayName: (currentName as string) || 'Alvaro',
    }
  } catch (error) {
    console.error('Failed to load settings', error)
    settingsError.value = 'Unable to load settings.'
  } finally {
    loadingSettings.value = false
  }
}

async function saveSettings() {
  settingsError.value = null

  if (settingsForm.value.locationMode === 'city' && !settingsForm.value.cityName?.trim()) {
    settingsError.value = 'Enter a city name.'
    return
  }

  if (
    settingsForm.value.locationMode === 'latlon' &&
    (settingsForm.value.latitude === undefined || settingsForm.value.longitude === undefined)
  ) {
    settingsError.value = 'Provide both latitude and longitude.'
    return
  }

  savingSettings.value = true
  try {
    // Save Display Name
    await window.electronAPI.setSetting('displayName', settingsForm.value.displayName)

    // Save Weather Settings
    // Convert reactive object to plain object for IPC serialization and strip extra fields
    const weatherPayload: WeatherSettings = {
      locationMode: settingsForm.value.locationMode as 'city' | 'latlon',
      cityName: settingsForm.value.cityName || '',
      latitude: settingsForm.value.latitude,
      longitude: settingsForm.value.longitude,
      units: settingsForm.value.units as 'metric' | 'imperial',
    }

    await window.electronAPI.setWeatherSettings(weatherPayload)
    await fetchSnapshot(true)
    showSettings.value = false
  } catch (error) {
    console.error('Failed to save settings', error)
    settingsError.value = 'Failed to save settings.'
  } finally {
    savingSettings.value = false
  }
}

// Health helpers
const healthTrend = computed(() => {
  const base = Math.max(2500, healthData.value.steps - 2000)
  return Array.from({ length: 7 }, (_, index) => Math.round(base + Math.sin(index / 2) * 600))
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
  justify-content: flex-start;
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
