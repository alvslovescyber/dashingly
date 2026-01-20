<template>
  <div class="home-page">
    <!-- Sidebar -->
    <Sidebar
      :current-route="currentSection"
      @navigate="handleNavigate"
    />

    <!-- Main Content -->
    <div class="home-page__main">
      <!-- Top Bar -->
      <TopBar
        :display-name="displayName"
        @open-settings="showSettings = true"
      />

      <!-- Chip Tabs -->
      <div class="home-page__tabs">
        <ChipTabs
          v-model="currentSection"
          :tabs="sectionTabs"
          :show-add="false"
        />
      </div>

      <!-- Tiles Grid -->
      <div class="home-page__grid">
        <!-- Row 1: Promo + Spotify + Camera -->
        <div class="home-page__row home-page__row--top">
          <!-- Upgrade Promo Tile -->
          <TileCard class="tile--promo" size="sm" :interactive="false">
            <div class="promo-content">
              <div class="promo-text">
                <span class="promo-title">Upgrade to Pro</span>
                <span class="promo-desc">Get 1 month free and unlock</span>
              </div>
              <button class="promo-button">Upgrade</button>
            </div>
          </TileCard>

          <!-- Spotify Now Playing -->
          <SpotifyBar
            :is-visible="spotifyData.isPlaying || mockMode"
            :is-playing="spotifyData.isPlaying"
            :track="spotifyData.track"
            :artist="spotifyData.artist"
            :album="spotifyData.album"
            :album-art="spotifyData.albumArt"
            :progress-ms="spotifyData.progressMs"
            :duration-ms="spotifyData.durationMs"
            class="tile--spotify"
          />

          <!-- Camera Preview Tile -->
          <TileCard class="tile--camera" size="sm">
            <div class="camera-preview">
              <div class="camera-header">
                <span class="camera-status">Online</span>
                <span class="camera-label">Hall</span>
              </div>
              <div class="camera-image">
                <Video :size="32" />
              </div>
              <div class="camera-controls">
                <IconButton :icon="Video" size="sm" variant="glass" />
                <IconButton :icon="Image" size="sm" variant="glass" />
                <IconButton :icon="ZoomIn" size="sm" variant="glass" />
              </div>
            </div>
          </TileCard>
        </div>

        <!-- Row 2: Main Tiles -->
        <div class="home-page__row home-page__row--main">
          <!-- Strava / Activity Tile -->
          <TileCard
            title="Weekly Running"
            :icon="Activity"
            class="tile--strava"
            size="lg"
          >
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
                gradient-start="rgba(20, 184, 166, 0.3)"
                gradient-end="rgba(20, 184, 166, 0)"
                :height="80"
              />
            </div>
          </TileCard>

          <!-- Tasks Tile -->
          <TileCard
            title="Today's Tasks"
            :icon="ListChecks"
            class="tile--tasks"
            size="lg"
          >
            <template #headerRight>
              <span class="task-count">{{ tasksCompleted }}/{{ totalTasks }}</span>
            </template>
            <div class="tasks-content">
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
              <button class="task-add">
                <Plus :size="14" />
                <span>Add task</span>
              </button>
            </div>
          </TileCard>

          <!-- Health Tile -->
          <TileCard
            title="Health"
            :icon="Heart"
            class="tile--health"
            size="md"
          >
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

          <!-- Bible Tile -->
          <TileCard
            title="Daily Reading"
            :icon="BookOpen"
            class="tile--bible"
            size="md"
          >
            <div class="bible-content">
              <p class="bible-reference">{{ bibleData.reference }}</p>
              <p class="bible-version">NIV</p>
              <div class="bible-actions">
                <button class="bible-button bible-button--primary" @click="openBibleOnPhone">
                  Open on Phone
                </button>
                <button
                  class="bible-button"
                  :class="{ 'bible-button--done': bibleData.completed }"
                  @click="markBibleDone"
                >
                  {{ bibleData.completed ? 'Done ✓' : 'Mark Done' }}
                </button>
              </div>
            </div>
          </TileCard>
        </div>

        <!-- Row 3: Bottom Tiles -->
        <div class="home-page__row home-page__row--bottom">
          <!-- Energy Chart -->
          <TileCard
            title="Energy (KWH)"
            class="tile--energy"
            size="md"
          >
            <template #headerRight>
              <ChipTabs
                v-model="energyPeriod"
                :tabs="[
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'monthly', label: 'Monthly' },
                ]"
              />
            </template>
            <MiniChart
              :data="[80, 120, 100, 140, 110, 130, 145]"
              :labels="['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']"
              :height="100"
            />
          </TileCard>

          <!-- Weather Tile -->
          <TileCard
            class="tile--weather"
            size="md"
            :interactive="false"
          >
            <div class="weather-content">
              <div class="weather-today">
                <CloudSun :size="48" class="weather-icon" />
                <div class="weather-temps">
                  <span class="weather-high">24°</span>
                  <span class="weather-divider">/</span>
                  <span class="weather-low">17°</span>
                </div>
                <span class="weather-label">Today Temperature</span>
              </div>
              <div class="weather-week">
                <div
                  v-for="day in weatherForecast"
                  :key="day.day"
                  class="weather-day"
                >
                  <span class="weather-day-name">{{ day.day }}</span>
                  <span class="weather-day-date">{{ day.date }}</span>
                </div>
              </div>
            </div>
          </TileCard>
        </div>
      </div>
    </div>

    <!-- Settings Modal -->
    <ModalSheet v-model="showSettings" title="Settings" size="lg">
      <p>Settings content goes here...</p>
    </ModalSheet>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Activity,
  ListChecks,
  Heart,
  BookOpen,
  Video,
  Image,
  ZoomIn,
  Check,
  Plus,
  Footprints,
  Flame,
  CloudSun,
} from 'lucide-vue-next'
import {
  Sidebar,
  TopBar,
  ChipTabs,
  TileCard,
  SpotifyBar,
  MiniChart,
  ProgressRing,
  ModalSheet,
  TogglePill,
  IconButton,
} from '../components'

// Config (will come from store/IPC later)
const displayName = ref('Friend')
const mockMode = true // Enable mock mode for development

// Navigation
const currentSection = ref('home')
const showSettings = ref(false)

const sectionTabs = [
  { value: 'home', label: 'My Home' },
  { value: 'living', label: 'Living Room' },
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'office', label: 'Office' },
  { value: 'kids', label: 'Kids Room' },
]

function handleNavigate(route: string) {
  currentSection.value = route
}

// Spotify Mock Data
const spotifyData = ref({
  isPlaying: true,
  track: 'Be Honest',
  artist: 'Jorja Smith ft Burna Boy',
  album: 'Lost & Found',
  albumArt: '',
  progressMs: 45000,
  durationMs: 180000,
})

// Strava Mock Data
const stravaEnabled = ref(true)
const stravaData = ref({
  weeklyDistance: 23.4,
  weeklyTarget: 30,
  weekData: [3.2, 5.1, 0, 4.8, 6.2, 2.1, 2.0],
})

// Tasks Mock Data
interface Task {
  id: string
  title: string
  completed: boolean
}

const todayTasks = ref<Task[]>([
  { id: '1', title: 'Morning run - 5km', completed: true },
  { id: '2', title: 'Read Bible passage', completed: false },
  { id: '3', title: 'Review weekly goals', completed: false },
  { id: '4', title: 'Meditate 10 minutes', completed: false },
])

const tasksCompleted = computed(() =>
  todayTasks.value.filter(t => t.completed).length
)
const totalTasks = computed(() => todayTasks.value.length)

function toggleTask(id: string) {
  const task = todayTasks.value.find(t => t.id === id)
  if (task) {
    task.completed = !task.completed
  }
}

// Health Mock Data
const healthData = ref({
  steps: 7842,
  stepsPercent: 78,
  calories: 423,
  caloriesPercent: 56,
  sleepMinutes: 420,
})

// Bible Mock Data
const bibleData = ref({
  reference: 'Psalm 23:1-6',
  completed: false,
})

function openBibleOnPhone() {
  // Will trigger deep link or show QR
  console.log('Open Bible on phone')
}

function markBibleDone() {
  bibleData.value.completed = !bibleData.value.completed
}

// Energy Chart
const energyPeriod = ref('weekly')

// Weather Mock Data
const weatherForecast = [
  { day: 'S', date: '17' },
  { day: 'M', date: '20' },
  { day: 'T', date: '18' },
  { day: 'W', date: '23' },
  { day: 'T', date: '22' },
  { day: 'F', date: '17' },
  { day: 'S', date: '24' },
]
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

.home-page__tabs {
  margin-bottom: var(--space-md);
}

.home-page__grid {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  overflow-y: auto;
}

.home-page__row {
  display: flex;
  gap: var(--space-md);
}

/* Top Row */
.home-page__row--top {
  min-height: 80px;
}

.tile--promo {
  flex: 1;
  min-height: auto;
  padding: var(--space-sm) var(--space-md);
}

.promo-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}

.promo-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.promo-title {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.promo-desc {
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.promo-button {
  padding: var(--space-xs) var(--space-md);
  background: var(--color-blue);
  border: none;
  border-radius: var(--radius-chip);
  color: var(--color-white);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-default);
}

.promo-button:hover {
  background: var(--color-blue-dark);
}

.tile--spotify {
  flex: 1.5;
}

.tile--camera {
  flex: 1;
  min-height: auto;
  padding: var(--space-sm);
}

.camera-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.camera-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xs);
}

.camera-status {
  font-size: var(--text-xs);
  color: var(--color-green);
}

.camera-label {
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.camera-image {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--glass-dark);
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
}

.camera-controls {
  display: flex;
  justify-content: center;
  gap: var(--space-xs);
  margin-top: var(--space-xs);
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
  color: var(--text-primary);
}

.strava-unit {
  font-size: var(--text-lg);
  color: var(--text-secondary);
}

.strava-target {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
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
  background: var(--glass-white-light);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-default);
}

.task-item:hover {
  background: var(--glass-white);
}

.task-item--completed {
  opacity: 0.6;
}

.task-item--completed .task-title {
  text-decoration: line-through;
}

.task-checkbox {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--glass-white);
  border: 1px solid var(--border-medium);
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
  border: 1px dashed var(--border-light);
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: 
    background-color var(--duration-fast) var(--ease-default),
    color var(--duration-fast) var(--ease-default);
}

.task-add:hover {
  background: var(--glass-white-light);
  color: var(--text-secondary);
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
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.health-stat-label {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.tile--bible {
  flex: 1.5;
}

.bible-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding-top: var(--space-md);
}

.bible-reference {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.bible-version {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin-top: var(--space-xs);
}

.bible-actions {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-md);
}

.bible-button {
  padding: var(--space-xs) var(--space-md);
  background: var(--glass-white);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-chip);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: 
    background-color var(--duration-fast) var(--ease-default),
    color var(--duration-fast) var(--ease-default);
}

.bible-button:hover {
  background: var(--glass-white-medium);
  color: var(--text-primary);
}

.bible-button--primary {
  background: var(--color-blue);
  border-color: var(--color-blue);
  color: var(--color-white);
}

.bible-button--primary:hover {
  background: var(--color-blue-dark);
}

.bible-button--done {
  background: var(--color-green);
  border-color: var(--color-green);
  color: var(--color-white);
}

/* Bottom Row */
.home-page__row--bottom {
  min-height: 140px;
}

.tile--energy {
  flex: 2;
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

.weather-high {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}

.weather-divider {
  color: var(--text-tertiary);
}

.weather-low {
  font-size: var(--text-lg);
  color: var(--text-secondary);
}

.weather-label {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
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
</style>
