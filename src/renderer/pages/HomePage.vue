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

              <!-- AI Inbox Tile -->
              <AIInboxTile
                :suggestions="aiSuggestions"
                next-suggestion-time="12:00"
                class="tile--ai-inbox"
                @accept="handleAIAccept"
                @dismiss="handleAIDismiss"
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
                  <p class="bible-reference">{{ verseData.reference }}</p>
                  <p class="bible-verse">
                    <span class="bible-verse__main">"{{ verseMain }}"</span>
                    <span v-if="verseRest" class="bible-verse__rest">
                      {{ verseRest }}
                    </span>
                  </p>
                  <div class="bible-actions">
                    <button
                      class="bible-button"
                      :class="{ 'bible-button--done': verseData.completed }"
                      @click="verseData.markDone()"
                    >
                      {{ verseData.completed ? 'Done' : 'Mark Done' }}
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
                  :data="[80, 120, 100, 140, 110, 130, 145]"
                  :labels="['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']"
                  :height="100"
                />
              </TileCard>

              <!-- Weather Tile -->
              <TileCard class="tile--weather" size="md" :interactive="false">
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
                    <div v-for="day in weatherForecast" :key="day.day" class="weather-day">
                      <span class="weather-day-name">{{ day.day }}</span>
                      <span class="weather-day-date">{{ day.date }}</span>
                    </div>
                  </div>
                </div>
              </TileCard>
            </div>
          </div>

          <!-- Section: Health (placeholder) -->
          <div class="home-page__section home-page__section--placeholder">
            <div class="placeholder-content">
              <Heart :size="48" />
              <span>Health Section</span>
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
  Check,
  Plus,
  Footprints,
  Flame,
  CloudSun,
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
import type { AISuggestion } from '../components/tiles/AIInboxTile.vue'
import { useVerseOfDay } from '../composables/useVerseOfDay'

// Config (will come from store/IPC later)
const displayName = ref('Friend')
const mockMode = true // Enable mock mode for development

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

// AI Inbox Mock Data
const aiSuggestions = ref<AISuggestion[]>([
  {
    id: '1',
    title: 'Schedule gym session',
    reason: 'Based on your fitness goals and free time tomorrow',
  },
  { id: '2', title: 'Call mom', reason: "It's been a week since your last call" },
  { id: '3', title: 'Review budget', reason: 'Monthly review is due in 2 days' },
])

function handleAIAccept(id: string) {
  console.log('Accepted suggestion:', id)
  aiSuggestions.value = aiSuggestions.value.filter(s => s.id !== id)
}

function handleAIDismiss(id: string) {
  console.log('Dismissed suggestion:', id)
  aiSuggestions.value = aiSuggestions.value.filter(s => s.id !== id)
}

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

const tasksCompleted = computed(() => todayTasks.value.filter(t => t.completed).length)
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

// Daily Reading - Verse of the Day
const verseData = useVerseOfDay()

// Computed verse parts for better text hierarchy
const verseMain = computed(() => {
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
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  opacity: 0.95;
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
  line-height: 1.4;
  color: var(--text-primary);
  opacity: 0.9;
}

.bible-verse__rest {
  font-size: var(--text-xs);
  line-height: 1.4;
  color: var(--text-secondary);
  opacity: 0.7;
}

.bible-actions {
  display: flex;
  justify-content: center;
  margin-top: var(--space-sm);
}

.bible-button {
  padding: var(--space-xs) var(--space-md);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-chip);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}

.bible-button:hover {
  background: rgba(255, 255, 255, 0.12);
  color: var(--text-primary);
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
  color: var(--color-white);
  letter-spacing: -0.02em;
}

.weather-divider {
  color: var(--text-tertiary);
  opacity: 0.6;
}

.weather-low {
  font-size: var(--text-lg);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
}

.weather-label {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  opacity: 0.8;
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
