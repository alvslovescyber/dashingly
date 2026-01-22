<template>
  <div class="settings-page">
    <aside class="settings-page__nav">
      <button
        v-for="section in navSections"
        :key="section.id"
        class="settings-nav__item"
        :class="{ 'settings-nav__item--active': currentSection === section.id }"
        type="button"
        @click="currentSection = section.id"
      >
        <span class="settings-nav__label">{{ section.label }}</span>
        <span class="settings-nav__description">{{ section.description }}</span>
      </button>
    </aside>

    <section class="settings-page__panel">
      <header class="settings-panel__header">
        <div>
          <p class="settings-panel__eyebrow">Settings</p>
          <h2 class="settings-panel__title">{{ activeSection.label }}</h2>
        </div>
        <p class="settings-panel__hint">{{ activeSection.description }}</p>
      </header>

      <div class="settings-panel__body">
        <!-- General -->
        <template v-if="currentSection === 'general'">
          <div class="form-field">
            <label class="form-label">
              Display name
              <input
                v-model="displayNameInput"
                class="form-input"
                type="text"
                maxlength="40"
                placeholder="Welcome, friend"
              />
            </label>
            <p class="form-hint">Used for greetings along the dashboard.</p>
            <p v-if="displayNameError" class="form-error">{{ displayNameError }}</p>
          </div>
          <div class="settings-actions">
            <button class="settings-button" :disabled="savingDisplayName" @click="saveDisplayName">
              {{ savingDisplayName ? 'Saving…' : 'Save name' }}
            </button>
          </div>
        </template>

        <!-- Display -->
        <template v-else-if="currentSection === 'display'">
          <div v-if="brightnessLoading" class="form-field">
            <p class="form-hint">Loading brightness status...</p>
          </div>

          <template v-else-if="brightnessSupported">
            <div class="form-field">
              <label class="form-label">Screen brightness</label>
              <div class="brightness-control">
                <button
                  class="brightness-btn"
                  type="button"
                  :disabled="currentBrightness <= 0"
                  @click="decreaseBrightness"
                >
                  <span class="brightness-btn__icon">-</span>
                </button>
                <div class="brightness-slider-wrap">
                  <input
                    type="range"
                    class="brightness-slider"
                    min="0"
                    max="100"
                    step="5"
                    :value="currentBrightness"
                    @input="
                      e => handleBrightnessChange(Number((e.target as HTMLInputElement).value))
                    "
                  />
                  <span class="brightness-value">{{ currentBrightness }}%</span>
                </div>
                <button
                  class="brightness-btn"
                  type="button"
                  :disabled="currentBrightness >= 100"
                  @click="increaseBrightness"
                >
                  <span class="brightness-btn__icon">+</span>
                </button>
              </div>
              <p class="form-hint">Adjust the screen brightness for your Raspberry Pi display.</p>
            </div>
          </template>

          <div v-else class="form-field">
            <p class="form-label">Brightness control unavailable</p>
            <p class="form-hint">
              Hardware brightness control is not available on this device. This feature requires a
              Raspberry Pi with an official touchscreen display.
            </p>
          </div>

          <!-- Screensaver -->
          <div class="settings-action-card">
            <div>
              <p class="settings-action-card__title">Screensaver</p>
              <p class="settings-action-card__copy">
                Activates automatically after 5 minutes of inactivity.
              </p>
            </div>
            <button class="settings-button settings-button--ghost" @click="startScreensaver">
              Start now
            </button>
          </div>
        </template>

        <!-- Weather -->
        <template v-else-if="currentSection === 'weather'">
          <div class="form-field">
            <label class="form-label">Location mode</label>
            <div class="segmented-control">
              <button
                class="segmented-control__button"
                :class="{
                  'segmented-control__button--active': weatherForm.locationMode === 'city',
                }"
                type="button"
                @click="setLocationMode('city')"
              >
                City search
              </button>
              <button
                class="segmented-control__button"
                :class="{
                  'segmented-control__button--active': weatherForm.locationMode === 'latlon',
                }"
                type="button"
                @click="setLocationMode('latlon')"
              >
                Coordinates
              </button>
            </div>
          </div>

          <div v-if="weatherForm.locationMode === 'city'" class="form-field">
            <label class="form-label">
              City
              <div class="input-wrapper">
                <input
                  v-model="weatherForm.cityName"
                  class="form-input"
                  type="text"
                  placeholder="Chicago"
                  @input="handleCityInput"
                  @focus="showCitySuggestions = citySuggestions.length > 0"
                  @blur="handleCityBlur"
                />
                <div v-if="searchingCity" class="input-spinner" />
                <div v-if="showCitySuggestions && citySuggestions.length" class="city-suggestions">
                  <button
                    v-for="(city, index) in citySuggestions"
                    :key="`${city.name}-${index}`"
                    type="button"
                    class="city-suggestions__item"
                    @mousedown.prevent="selectCity(city)"
                  >
                    {{ city.name }}
                  </button>
                </div>
              </div>
            </label>
          </div>

          <div v-else class="form-grid">
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

          <div class="form-field">
            <label class="form-label">Units</label>
            <div class="segmented-control segmented-control--compact">
              <button
                class="segmented-control__button"
                :class="{ 'segmented-control__button--active': weatherForm.units === 'metric' }"
                type="button"
                @click="weatherForm.units = 'metric'"
              >
                Celsius
              </button>
              <button
                class="segmented-control__button"
                :class="{ 'segmented-control__button--active': weatherForm.units === 'imperial' }"
                type="button"
                @click="weatherForm.units = 'imperial'"
              >
                Fahrenheit
              </button>
            </div>
          </div>

          <p v-if="weatherError" class="form-error">{{ weatherError }}</p>

          <div class="settings-actions">
            <button
              class="settings-button"
              :disabled="weatherSaving || weatherLoading"
              @click="saveWeather"
            >
              {{ weatherSaving ? 'Saving…' : 'Save weather settings' }}
            </button>
          </div>
        </template>

        <!-- Integrations -->
        <template v-else-if="currentSection === 'integrations'">
          <div class="integration-grid">
            <!-- Spotify -->
            <article class="integration-card">
              <div class="integration-card__header">
                <div>
                  <p class="integration-card__eyebrow">Spotify</p>
                  <p class="integration-card__title">Playback bridge</p>
                  <p class="integration-card__copy">Mirror now playing from your account.</p>
                </div>
                <span
                  class="status-pill"
                  :class="
                    integrationStatus.spotify.connected
                      ? 'status-pill--success'
                      : 'status-pill--danger'
                  "
                >
                  {{ integrationStatus.spotify.connected ? 'Connected' : 'Not connected' }}
                </span>
              </div>

              <div class="integration-card__body">
                <div class="integration-card__row">
                  <span class="integration-card__label">Enabled</span>
                  <TogglePill
                    :model-value="integrationToggles.spotify"
                    @update:model-value="value => handleIntegrationToggle('spotify', value)"
                  />
                </div>

                <div class="form-grid">
                  <label class="form-label">
                    Client ID
                    <input
                      v-model="integrationForms.spotify.clientId"
                      class="form-input"
                      type="text"
                      placeholder="123abc..."
                      autocomplete="off"
                    />
                  </label>
                  <label class="form-label">
                    Client secret
                    <input
                      v-model="integrationForms.spotify.clientSecret"
                      class="form-input"
                      type="password"
                      placeholder="••••••••"
                      autocomplete="off"
                    />
                  </label>
                </div>
                <p class="form-hint">
                  {{
                    integrationStatus.spotify.hasClientId &&
                    integrationStatus.spotify.hasClientSecret
                      ? 'Credentials stored securely on this device.'
                      : 'Add your app credentials to enable OAuth.'
                  }}
                </p>

                <div class="settings-actions settings-actions--inline">
                  <button
                    class="settings-button settings-button--ghost"
                    :disabled="integrationSaving.spotify"
                    @click="saveIntegrationCredentials('spotify')"
                  >
                    {{ integrationSaving.spotify ? 'Saving…' : 'Save credentials' }}
                  </button>
                  <button
                    class="settings-button settings-button--ghost"
                    :disabled="testingIntegration === 'spotify'"
                    @click="testIntegration('spotify')"
                  >
                    {{ testingIntegration === 'spotify' ? 'Testing…' : 'Test connection' }}
                  </button>
                  <button
                    v-if="integrationStatus.spotify.connected"
                    class="settings-button settings-button--text"
                    type="button"
                    @click="disconnectService('spotify')"
                  >
                    Disconnect
                  </button>
                </div>
                <p class="integration-card__foot">
                  Last sync: {{ formatRelativeTimestamp(integrationStatus.spotify.lastSync) }}
                </p>
              </div>
            </article>

            <!-- Strava -->
            <article class="integration-card">
              <div class="integration-card__header">
                <div>
                  <p class="integration-card__eyebrow">Strava</p>
                  <p class="integration-card__title">Weekly running data</p>
                  <p class="integration-card__copy">Sync runs and weekly targets.</p>
                </div>
                <span
                  class="status-pill"
                  :class="
                    integrationStatus.strava.connected
                      ? 'status-pill--success'
                      : 'status-pill--danger'
                  "
                >
                  {{ integrationStatus.strava.connected ? 'Connected' : 'Not connected' }}
                </span>
              </div>

              <div class="integration-card__body">
                <div class="integration-card__row">
                  <span class="integration-card__label">Enabled</span>
                  <TogglePill
                    :model-value="integrationToggles.strava"
                    @update:model-value="value => handleIntegrationToggle('strava', value)"
                  />
                </div>

                <div class="form-grid">
                  <label class="form-label">
                    Client ID
                    <input
                      v-model="integrationForms.strava.clientId"
                      class="form-input"
                      type="text"
                      placeholder="12345"
                      autocomplete="off"
                    />
                  </label>
                  <label class="form-label">
                    Client secret
                    <input
                      v-model="integrationForms.strava.clientSecret"
                      class="form-input"
                      type="password"
                      placeholder="••••••••"
                      autocomplete="off"
                    />
                  </label>
                </div>

                <div class="form-field">
                  <label class="form-label">
                    Weekly target (km)
                    <input
                      v-model.number="stravaWeeklyTarget"
                      class="form-input"
                      type="number"
                      min="1"
                      step="1"
                    />
                  </label>
                  <p v-if="stravaTargetError" class="form-error">{{ stravaTargetError }}</p>
                </div>

                <div class="settings-actions settings-actions--inline">
                  <button
                    class="settings-button settings-button--ghost"
                    :disabled="integrationSaving.strava"
                    @click="saveIntegrationCredentials('strava')"
                  >
                    {{ integrationSaving.strava ? 'Saving…' : 'Save credentials' }}
                  </button>
                  <button
                    class="settings-button settings-button--ghost"
                    :disabled="stravaTargetSaving"
                    @click="saveStravaTarget"
                  >
                    {{ stravaTargetSaving ? 'Saving…' : 'Save target' }}
                  </button>
                  <button
                    class="settings-button settings-button--ghost"
                    :disabled="testingIntegration === 'strava'"
                    @click="testIntegration('strava')"
                  >
                    {{ testingIntegration === 'strava' ? 'Testing…' : 'Test connection' }}
                  </button>
                  <button
                    v-if="integrationStatus.strava.connected"
                    class="settings-button settings-button--text"
                    type="button"
                    @click="disconnectService('strava')"
                  >
                    Disconnect
                  </button>
                </div>
                <p class="integration-card__foot">
                  Last sync: {{ formatRelativeTimestamp(integrationStatus.strava.lastSync) }}
                </p>
              </div>
            </article>

            <!-- Weather summary -->
            <article class="integration-card integration-card--compact">
              <div class="integration-card__header">
                <div>
                  <p class="integration-card__eyebrow">Weather</p>
                  <p class="integration-card__title">Location + units</p>
                  <p class="integration-card__copy">Powered by Open-Meteo with your chosen city.</p>
                </div>
                <span
                  class="status-pill"
                  :class="
                    integrationToggles.weather ? 'status-pill--success' : 'status-pill--muted'
                  "
                >
                  {{ integrationToggles.weather ? 'Active' : 'Paused' }}
                </span>
              </div>
              <div class="integration-card__body">
                <div class="integration-card__row">
                  <span class="integration-card__label">Enabled</span>
                  <TogglePill
                    :model-value="integrationToggles.weather"
                    @update:model-value="value => handleIntegrationToggle('weather', value)"
                  />
                </div>
                <p class="integration-weather-summary">
                  {{ weatherSummary }}
                </p>
                <div class="settings-actions settings-actions--inline">
                  <button
                    class="settings-button settings-button--ghost"
                    @click="currentSection = 'weather'"
                  >
                    Edit location
                  </button>
                  <button
                    class="settings-button settings-button--ghost"
                    :disabled="testingIntegration === 'weather'"
                    @click="testIntegration('weather')"
                  >
                    {{ testingIntegration === 'weather' ? 'Refreshing…' : 'Refresh weather' }}
                  </button>
                </div>
                <p class="integration-card__foot">
                  Last update: {{ formatRelativeTimestamp(integrationStatus.weather.lastSync) }}
                </p>
              </div>
            </article>
          </div>
        </template>

        <!-- AI -->
        <template v-else-if="currentSection === 'ai'">
          <div class="form-field form-field--inline">
            <div>
              <label class="form-label">Scheduled generation</label>
              <p class="form-hint">
                Keeps fresh suggestions each day at {{ aiForm.autoGenerateTime }}.
              </p>
            </div>
            <TogglePill v-model="aiForm.autoGenerateEnabled" />
          </div>

          <div class="form-field form-field--inline">
            <label class="form-label">
              Time
              <input
                v-model="aiForm.autoGenerateTime"
                class="form-input form-input--time"
                type="time"
              />
            </label>
            <button
              class="settings-button settings-button--ghost"
              :disabled="aiSaving"
              @click="saveAIConfig"
            >
              {{ aiSaving ? 'Saving…' : 'Save schedule' }}
            </button>
          </div>

          <div class="form-field">
            <label class="form-label">
              OpenAI key
              <input
                v-model="aiKeyInput"
                class="form-input"
                type="password"
                autocomplete="off"
                placeholder="sk-..."
              />
            </label>
            <p class="form-hint">
              {{
                hasStoredAIKey
                  ? 'Stored securely on this device.'
                  : 'Required to generate suggestions.'
              }}
            </p>
            <div class="settings-actions settings-actions--inline">
              <button class="settings-button" :disabled="aiKeySaving" @click="saveOpenAIKey">
                {{ aiKeySaving ? 'Saving…' : hasStoredAIKey ? 'Update key' : 'Save key' }}
              </button>
              <button
                v-if="hasStoredAIKey"
                class="settings-button settings-button--text"
                :disabled="aiKeySaving"
                @click="removeOpenAIKey"
              >
                Remove key
              </button>
            </div>
          </div>

          <div class="ai-actions">
            <div>
              <p class="ai-actions__title">Refresh suggestions</p>
              <p class="ai-actions__hint">Checks now without waiting for 12:00.</p>
            </div>
            <button
              class="settings-button settings-button--ghost"
              :disabled="aiGenerating || !hasStoredAIKey"
              @click="generateNow"
            >
              {{ aiGenerating ? 'Refreshing…' : 'Refresh now' }}
            </button>
          </div>
        </template>

        <!-- Demo mode -->
        <template v-else-if="currentSection === 'demo'">
          <div class="form-field form-field--inline">
            <div>
              <p class="form-label">Demo mode</p>
              <p class="form-hint">Use seeded sample data instead of live services.</p>
            </div>
            <TogglePill :model-value="demoMode" @update:model-value="handleDemoToggle" />
          </div>
        </template>

        <!-- Data -->
        <template v-else-if="currentSection === 'data'">
          <div class="settings-action-card">
            <div>
              <p class="settings-action-card__title">Export database</p>
              <p class="settings-action-card__copy">Makes a backup of your local data.</p>
            </div>
            <button
              class="settings-button settings-button--ghost"
              :disabled="exportingDb"
              @click="exportDatabase"
            >
              {{ exportingDb ? 'Exporting…' : 'Export' }}
            </button>
          </div>

          <div class="settings-action-card settings-action-card--danger">
            <div>
              <p class="settings-action-card__title">Reset to demo data</p>
              <p class="settings-action-card__copy">
                Wipes current data and reseeds the built-in demo.
              </p>
            </div>
            <button class="settings-button settings-button--danger" @click="showResetModal = true">
              Reset data
            </button>
          </div>
        </template>

        <!-- About -->
        <template v-else>
          <div class="about-grid">
            <div class="about-card">
              <span class="about-card__label">Version</span>
              <span class="about-card__value">{{ appInfo?.version ?? '—' }}</span>
            </div>
            <div class="about-card">
              <span class="about-card__label">Platform</span>
              <span class="about-card__value">{{ appInfo?.platform ?? '—' }}</span>
            </div>
            <div class="about-card">
              <span class="about-card__label">Architecture</span>
              <span class="about-card__value">{{ appInfo?.arch ?? '—' }}</span>
            </div>
          </div>
        </template>
      </div>
    </section>
  </div>

  <ModalSheet v-model="showResetModal" title="Reset demo data" size="sm">
    <div class="modal-warning">
      <p>This will wipe current tasks, health data, and suggestions before reseeding the demo.</p>
      <p class="modal-warning__highlight">This action cannot be undone.</p>
    </div>
    <template #footer>
      <button
        class="settings-button settings-button--ghost"
        type="button"
        @click="showResetModal = false"
      >
        Cancel
      </button>
      <button
        class="settings-button settings-button--danger"
        type="button"
        :disabled="resettingDemo"
        @click="resetDemoData"
      >
        {{ resettingDemo ? 'Resetting…' : 'Reset data' }}
      </button>
    </template>
  </ModalSheet>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, reactive, ref, watch, type Ref } from 'vue'
import TogglePill from '../components/TogglePill.vue'
import ModalSheet from '../components/ModalSheet.vue'
import Screensaver from '../components/Screensaver.vue'
import { useDashboard } from '../composables/useDashboard'
import type { Settings, WeatherSettings } from '@shared/types'

// Screensaver ref from App.vue
const screensaverRef = inject<Ref<InstanceType<typeof Screensaver> | undefined>>('screensaver')

function startScreensaver() {
  screensaverRef?.value?.activate()
}

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

type CredentialService = 'spotify' | 'strava'
type IntegrationService = CredentialService | 'weather'

type IntegrationStatusResponse = {
  spotify: {
    connected: boolean
    lastSync: number | null
    hasClientId: boolean
    hasClientSecret: boolean
  }
  strava: {
    connected: boolean
    lastSync: number | null
    hasClientId: boolean
    hasClientSecret: boolean
  }
  weather: {
    hasLocation: boolean
    lastSync: number | null
  }
}

const toast = inject<Ref<ToastHandle | undefined>>('toast')

type ToastMethod = Exclude<keyof ToastHandle, 'show'>

function showToast(type: ToastMethod, message: string, description?: string) {
  toast?.value?.[type]?.(message, description)
}

function getServiceLabel(service: IntegrationService): string {
  if (service === 'spotify') return 'Spotify'
  if (service === 'strava') return 'Strava'
  return 'Weather'
}

const navSections = [
  { id: 'general', label: 'General', description: 'Greeting & personalization' },
  { id: 'display', label: 'Display', description: 'Brightness controls' },
  { id: 'weather', label: 'Weather', description: 'City search and units' },
  { id: 'integrations', label: 'Integrations', description: 'Spotify · Strava · Weather' },
  { id: 'ai', label: 'AI', description: 'Suggestions & OpenAI key' },
  { id: 'demo', label: 'Demo mode', description: 'Use fake or live data' },
  { id: 'data', label: 'Data', description: 'Export and reset options' },
  { id: 'about', label: 'About', description: 'Build metadata' },
] as const

type SectionId = (typeof navSections)[number]['id']

const currentSection = ref<SectionId>('general')
const activeSection = computed(
  () => navSections.find(section => section.id === currentSection.value)!
)

const { displayName, settings, fetchSnapshot, stravaData, weatherData } = useDashboard()

const integrationStatus = ref<IntegrationStatusResponse>({
  spotify: { connected: false, lastSync: null, hasClientId: false, hasClientSecret: false },
  strava: { connected: false, lastSync: null, hasClientId: false, hasClientSecret: false },
  weather: { hasLocation: false, lastSync: null },
})

const integrationForms = reactive<
  Record<CredentialService, { clientId: string; clientSecret: string }>
>({
  spotify: { clientId: '', clientSecret: '' },
  strava: { clientId: '', clientSecret: '' },
})

const integrationSaving = reactive<Record<CredentialService, boolean>>({
  spotify: false,
  strava: false,
})

const integrationToggles = reactive<Record<IntegrationService, boolean>>({
  spotify: true,
  strava: true,
  weather: true,
})

const testingIntegration = ref<IntegrationService | null>(null)

type SettingsPatch = Partial<
  Omit<Settings, 'ai' | 'weather' | 'brightness' | 'notifications' | 'integrations'>
> & {
  ai?: Partial<Settings['ai']>
  weather?: Partial<Settings['weather']>
  brightness?: Partial<Settings['brightness']>
  notifications?: Partial<Settings['notifications']>
  integrations?: Partial<{
    [K in keyof Settings['integrations']]: Partial<Settings['integrations'][K]>
  }>
}

// General
const displayNameInput = ref(displayName.value ?? '')
const savingDisplayName = ref(false)
const displayNameError = ref<string | null>(null)

// Display / Brightness
const brightnessSupported = ref(false)
const currentBrightness = ref(50)
const brightnessLoading = ref(true)

watch(displayName, value => {
  displayNameInput.value = value ?? ''
})

async function saveDisplayName() {
  const name = displayNameInput.value.trim()
  if (!name) {
    displayNameError.value = 'Please provide a name.'
    return
  }

  displayNameError.value = null
  savingDisplayName.value = true
  try {
    await window.electronAPI.setSetting('displayName', name)
    await fetchSnapshot(true)
    showToast('success', 'Display name updated')
  } catch (error) {
    console.error('Failed to save display name', error)
    showToast('error', 'Unable to save display name')
  } finally {
    savingDisplayName.value = false
  }
}

// Brightness functions
async function loadBrightnessStatus() {
  brightnessLoading.value = true
  try {
    brightnessSupported.value = await window.electronAPI.getBrightnessSupport()
    if (brightnessSupported.value) {
      currentBrightness.value = await window.electronAPI.getBrightness()
    }
  } catch (error) {
    console.error('Failed to load brightness status', error)
    brightnessSupported.value = false
  } finally {
    brightnessLoading.value = false
  }
}

async function handleBrightnessChange(value: number) {
  currentBrightness.value = value
  try {
    await window.electronAPI.setBrightness(value)
  } catch (error) {
    console.error('Failed to set brightness', error)
    showToast('error', 'Unable to change brightness')
  }
}

function decreaseBrightness() {
  const newValue = Math.max(0, currentBrightness.value - 10)
  handleBrightnessChange(newValue)
}

function increaseBrightness() {
  const newValue = Math.min(100, currentBrightness.value + 10)
  handleBrightnessChange(newValue)
}

function syncIntegrationToggles() {
  const integrations = settings.value?.integrations
  if (!integrations) return
  integrationToggles.spotify = integrations.spotify?.enabled ?? true
  integrationToggles.strava = integrations.strava?.enabled ?? true
  integrationToggles.weather = integrations.weather?.enabled ?? true
}

watch(
  () => settings.value?.integrations,
  () => {
    syncIntegrationToggles()
  },
  { immediate: true }
)

const stravaWeeklyTarget = ref<number>(stravaData.value.weeklyTarget ?? 30)
const stravaTargetSaving = ref(false)
const stravaTargetError = ref<string | null>(null)

watch(
  () => stravaData.value.weeklyTarget,
  value => {
    if (typeof value === 'number' && !Number.isNaN(value)) {
      stravaWeeklyTarget.value = value
    }
  },
  { immediate: true }
)

// Weather
const weatherForm = reactive({
  locationMode: 'city' as WeatherSettings['locationMode'],
  cityName: '',
  latitude: undefined as number | undefined,
  longitude: undefined as number | undefined,
  units: 'metric' as WeatherSettings['units'],
})
const weatherLoading = ref(true)
const weatherSaving = ref(false)
const weatherError = ref<string | null>(null)
const citySuggestions = ref<Array<{ name: string; latitude: number; longitude: number }>>([])
const showCitySuggestions = ref(false)
const searchingCity = ref(false)
let citySearchTimeout: ReturnType<typeof setTimeout> | null = null

const weatherSummary = computed(() => {
  const locationLabel =
    weatherForm.locationMode === 'city'
      ? weatherForm.cityName || weatherData.value.location || 'Location not set'
      : weatherForm.latitude !== undefined && weatherForm.longitude !== undefined
        ? `${weatherForm.latitude.toFixed(2)}, ${weatherForm.longitude.toFixed(2)}`
        : weatherData.value.location || 'Location not set'
  const unitsLabel = weatherForm.units === 'metric' ? '°C' : '°F'
  return `${locationLabel} · ${unitsLabel}`
})

function setLocationMode(mode: WeatherSettings['locationMode']) {
  weatherForm.locationMode = mode
}

function handleCityBlur() {
  setTimeout(() => {
    showCitySuggestions.value = false
  }, 150)
}

function handleCityInput() {
  if (citySearchTimeout) clearTimeout(citySearchTimeout)

  if (!weatherForm.cityName || weatherForm.cityName.length < 2) {
    citySuggestions.value = []
    showCitySuggestions.value = false
    return
  }

  searchingCity.value = true
  citySearchTimeout = setTimeout(async () => {
    try {
      const results = await window.electronAPI.searchCities(weatherForm.cityName)
      citySuggestions.value = results
      showCitySuggestions.value = results.length > 0
    } catch (error) {
      console.error('City search failed', error)
    } finally {
      searchingCity.value = false
    }
  }, 400)
}

function selectCity(city: { name: string; latitude: number; longitude: number }) {
  weatherForm.cityName = city.name
  weatherForm.latitude = city.latitude
  weatherForm.longitude = city.longitude
  showCitySuggestions.value = false
}

async function loadWeatherSettings() {
  weatherLoading.value = true
  try {
    const result = await window.electronAPI.getWeatherSettings()
    weatherForm.locationMode = result.locationMode
    weatherForm.cityName = result.cityName ?? ''
    weatherForm.latitude = result.latitude
    weatherForm.longitude = result.longitude
    weatherForm.units = result.units
  } catch (error) {
    console.error('Failed to load weather settings', error)
  } finally {
    weatherLoading.value = false
  }
}

async function saveWeather() {
  if (weatherForm.locationMode === 'city' && !weatherForm.cityName.trim()) {
    weatherError.value = 'Enter a city name.'
    return
  }

  if (
    weatherForm.locationMode === 'latlon' &&
    (weatherForm.latitude === undefined || weatherForm.longitude === undefined)
  ) {
    weatherError.value = 'Provide both latitude and longitude.'
    return
  }

  weatherError.value = null
  weatherSaving.value = true
  try {
    const payload: WeatherSettings = {
      locationMode: weatherForm.locationMode,
      cityName: weatherForm.cityName,
      latitude: weatherForm.latitude,
      longitude: weatherForm.longitude,
      units: weatherForm.units,
    }
    await window.electronAPI.setWeatherSettings(payload)
    await fetchSnapshot(true)
    showToast('success', 'Weather preferences saved')
  } catch (error) {
    console.error('Failed to save weather settings', error)
    showToast('error', 'Unable to save weather settings')
    weatherError.value = 'Something went wrong. Try again.'
  } finally {
    weatherSaving.value = false
  }
}

// Integrations
async function loadIntegrationStatus() {
  try {
    const payload = (await window.electronAPI.getIntegrationStatus()) as IntegrationStatusResponse
    integrationStatus.value = payload
  } catch (error) {
    console.error('Failed to load integration status', error)
  }
}

async function saveIntegrationCredentials(service: CredentialService) {
  const form = integrationForms[service]
  if (!form.clientId && !form.clientSecret) {
    showToast('warning', `Add a credential before saving`)
    return
  }

  integrationSaving[service] = true
  try {
    await window.electronAPI.setIntegrationCredentials({
      service,
      clientId: form.clientId || undefined,
      clientSecret: form.clientSecret || undefined,
    })
    form.clientId = ''
    form.clientSecret = ''
    await loadIntegrationStatus()
    showToast('success', `${getServiceLabel(service)} credentials saved`)
  } catch (error) {
    console.error('Failed to save credentials', error)
    showToast('error', `Unable to save ${getServiceLabel(service)} credentials`)
  } finally {
    integrationSaving[service] = false
  }
}

async function handleIntegrationToggle(service: IntegrationService, value: boolean) {
  const previous = integrationToggles[service]
  integrationToggles[service] = value
  try {
    await saveSettingsPartial({
      integrations: {
        [service]: { enabled: value },
      },
    })
    showToast('success', `${getServiceLabel(service)} ${value ? 'enabled' : 'disabled'}`)
  } catch (error) {
    console.error('Failed to toggle integration', error)
    integrationToggles[service] = previous
    showToast('error', `Unable to update ${getServiceLabel(service)}`)
  }
}

async function testIntegration(service: IntegrationService) {
  if (testingIntegration.value) return
  testingIntegration.value = service
  try {
    const result = await window.electronAPI.testIntegration(service)
    if (result.success) {
      showToast('success', `${getServiceLabel(service)} looks good`, result.message)
      if (service === 'weather') {
        await fetchSnapshot(true)
      }
    } else {
      showToast('error', `${getServiceLabel(service)} test failed`, result.message)
    }
  } catch (error) {
    console.error('Integration test failed', error)
    showToast('error', `Unable to test ${getServiceLabel(service)}`)
  } finally {
    testingIntegration.value = null
  }
}

async function disconnectService(service: CredentialService) {
  try {
    await window.electronAPI.disconnectIntegration(service)
    await fetchSnapshot(true)
    await loadIntegrationStatus()
    showToast('info', `${getServiceLabel(service)} disconnected`)
  } catch (error) {
    console.error('Failed to disconnect integration', error)
    showToast('error', `Unable to disconnect ${getServiceLabel(service)}`)
  }
}

async function saveStravaTarget() {
  if (!stravaWeeklyTarget.value || stravaWeeklyTarget.value <= 0) {
    stravaTargetError.value = 'Enter a positive distance.'
    return
  }

  stravaTargetError.value = null
  stravaTargetSaving.value = true
  try {
    await window.electronAPI.setSetting(
      'strava_weekly_target',
      Math.round(stravaWeeklyTarget.value)
    )
    await fetchSnapshot(true)
    showToast('success', 'Weekly target updated')
  } catch (error) {
    console.error('Failed to save Strava target', error)
    showToast('error', 'Unable to save weekly target')
  } finally {
    stravaTargetSaving.value = false
  }
}

function formatRelativeTimestamp(value?: number | null): string {
  if (!value) return '—'
  const diff = Date.now() - value
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// AI
const aiForm = reactive<{ autoGenerateEnabled: boolean; autoGenerateTime: string }>({
  autoGenerateEnabled: settings.value?.ai.autoGenerateEnabled ?? true,
  autoGenerateTime: settings.value?.ai.autoGenerateTime ?? '12:00',
})
const aiSaving = ref(false)
const aiGenerating = ref(false)
const aiKeyInput = ref('')
const aiKeySaving = ref(false)
const hasStoredAIKey = ref(false)

watch(
  () => settings.value?.ai,
  aiSettings => {
    if (!aiSettings) return
    aiForm.autoGenerateEnabled = aiSettings.autoGenerateEnabled
    aiForm.autoGenerateTime = aiSettings.autoGenerateTime
  },
  { immediate: true }
)

async function saveAIConfig() {
  if (!/^\d{2}:\d{2}$/.test(aiForm.autoGenerateTime)) {
    showToast('error', 'Provide a valid time (HH:MM)')
    return
  }

  aiSaving.value = true
  try {
    await saveSettingsPartial({
      ai: {
        autoGenerateEnabled: aiForm.autoGenerateEnabled,
        autoGenerateTime: aiForm.autoGenerateTime,
      },
    })
    showToast('success', 'AI schedule updated')
  } catch (error) {
    console.error('Failed to save AI config', error)
    showToast('error', 'Unable to save AI schedule')
  } finally {
    aiSaving.value = false
  }
}

async function generateNow() {
  aiGenerating.value = true
  try {
    const result = await window.electronAPI.triggerAISuggestions()
    if (!result.success) {
      showToast('error', result.reason ?? 'Generator is busy')
      return
    }
    await fetchSnapshot(true)
    showToast('success', 'Suggestions refreshed')
  } catch (error) {
    console.error('Manual AI trigger failed', error)
    showToast('error', 'Unable to generate suggestions')
  } finally {
    aiGenerating.value = false
  }
}

async function loadOpenAIKeyStatus() {
  try {
    const status = await window.electronAPI.getOpenAIKeyStatus()
    hasStoredAIKey.value = status.hasKey
  } catch (error) {
    console.error('Failed to load OpenAI key status', error)
  }
}

async function saveOpenAIKey() {
  if (!aiKeyInput.value.trim()) {
    showToast('warning', 'Enter a valid key before saving')
    return
  }

  aiKeySaving.value = true
  try {
    await window.electronAPI.setOpenAIKey(aiKeyInput.value.trim())
    aiKeyInput.value = ''
    await loadOpenAIKeyStatus()
    await fetchSnapshot(true)
    showToast('success', 'OpenAI key saved securely')
  } catch (error) {
    console.error('Failed to save OpenAI key', error)
    showToast('error', 'Unable to save OpenAI key')
  } finally {
    aiKeySaving.value = false
  }
}

async function removeOpenAIKey() {
  aiKeySaving.value = true
  try {
    await window.electronAPI.setOpenAIKey(null)
    await loadOpenAIKeyStatus()
    await fetchSnapshot(true)
    showToast('info', 'OpenAI key removed')
  } catch (error) {
    console.error('Failed to remove OpenAI key', error)
    showToast('error', 'Unable to remove OpenAI key')
  } finally {
    aiKeySaving.value = false
  }
}

// Demo mode
const demoMode = ref(settings.value?.mockMode ?? false)

watch(
  () => settings.value?.mockMode,
  value => {
    if (value !== undefined) {
      demoMode.value = value
    }
  },
  { immediate: true }
)

async function handleDemoToggle(value: boolean) {
  try {
    await saveSettingsPartial({ mockMode: value })
    demoMode.value = value
    showToast('success', `Demo mode ${value ? 'enabled' : 'disabled'}`)
  } catch (error) {
    console.error('Failed to toggle demo mode', error)
    showToast('error', 'Unable to toggle demo mode')
  }
}

// Data actions
const exportingDb = ref(false)
const showResetModal = ref(false)
const resettingDemo = ref(false)

async function exportDatabase() {
  exportingDb.value = true
  try {
    const result = await window.electronAPI.exportDatabase()
    if (result.canceled) return
    showToast('success', 'Database exported', result.filePath)
  } catch (error) {
    console.error('Export failed', error)
    showToast('error', 'Unable to export database')
  } finally {
    exportingDb.value = false
  }
}

async function resetDemoData() {
  resettingDemo.value = true
  try {
    await window.electronAPI.resetDemoData()
    await fetchSnapshot(true)
    showToast('success', 'Demo data restored')
    showResetModal.value = false
  } catch (error) {
    console.error('Reset failed', error)
    showToast('error', 'Unable to reset demo data')
  } finally {
    resettingDemo.value = false
  }
}

// About info
const appInfo = ref<{ version: string; platform: string; arch: string } | null>(null)

async function loadAppInfo() {
  try {
    appInfo.value = await window.electronAPI.getAppInfo()
  } catch (error) {
    console.error('Failed to load app info', error)
  }
}

// Settings helper
async function saveSettingsPartial(partial: SettingsPatch) {
  const stored = (await window.electronAPI.getSetting('settings')) as Settings | null
  const base = stored ?? settings.value
  if (!base) {
    throw new Error('Settings unavailable')
  }

  // Convert to plain objects to avoid structured clone errors across IPC
  const basePlain = JSON.parse(JSON.stringify(base)) as Settings
  const partialPlain = JSON.parse(JSON.stringify(partial)) as SettingsPatch

  const baseIntegrations: Settings['integrations'] = basePlain.integrations ?? {
    spotify: { enabled: true },
    strava: { enabled: true },
    weather: { enabled: true },
  }

  const merged: Settings = {
    ...basePlain,
    ...partialPlain,
    brightness: partialPlain.brightness
      ? { ...basePlain.brightness, ...partialPlain.brightness }
      : basePlain.brightness,
    notifications: partialPlain.notifications
      ? { ...basePlain.notifications, ...partialPlain.notifications }
      : basePlain.notifications,
    weather: partialPlain.weather
      ? { ...basePlain.weather, ...partialPlain.weather }
      : basePlain.weather,
    ai: partialPlain.ai ? { ...basePlain.ai, ...partialPlain.ai } : basePlain.ai,
    integrations: partialPlain.integrations
      ? (Object.keys(baseIntegrations) as Array<keyof Settings['integrations']>).reduce(
          (acc, key) => {
            acc[key] = {
              ...baseIntegrations[key],
              ...(partialPlain.integrations?.[key] ?? {}),
            }
            return acc
          },
          {} as Settings['integrations']
        )
      : baseIntegrations,
  }

  await window.electronAPI.setSetting('settings', merged)
  await fetchSnapshot(true)
}

onMounted(() => {
  loadWeatherSettings()
  loadOpenAIKeyStatus()
  loadAppInfo()
  loadIntegrationStatus()
  loadBrightnessStatus()
})

onUnmounted(() => {
  if (citySearchTimeout) {
    clearTimeout(citySearchTimeout)
  }
})
</script>

<style scoped>
.settings-page {
  display: flex;
  gap: var(--space-lg);
  width: 100%;
  height: 100%;
  padding-bottom: var(--space-md);
}

.settings-page__nav {
  width: 200px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.settings-nav__item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  width: 100%;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-secondary);
  text-align: left;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.settings-nav__item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.settings-nav__item--active {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.settings-nav__label {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
}

.settings-nav__description {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.settings-page__panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(17, 25, 40, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.settings-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-lg);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.settings-panel__eyebrow {
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
  margin-bottom: 6px;
}

.settings-panel__title {
  margin: 0;
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.settings-panel__hint {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  max-width: 260px;
}

.settings-panel__body {
  flex: 1;
  padding-top: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  overflow-y: auto;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.form-field--inline {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.form-label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.02);
  color: var(--text-primary);
  font-size: var(--text-sm);
  transition: border-color var(--duration-fast) var(--ease-out);
}

.form-input:focus {
  border-color: rgba(34, 197, 94, 0.6);
}

.form-input--time {
  width: 140px;
}

.form-hint {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin: 0;
}

.form-error {
  font-size: var(--text-xs);
  color: var(--color-red);
  margin: 0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--space-md);
}

.segmented-control {
  display: inline-flex;
  background: rgba(255, 255, 255, 0.04);
  border-radius: var(--radius-full);
  padding: 3px;
  gap: 4px;
}

.segmented-control--compact {
  padding: 2px;
}

.segmented-control__button {
  border: none;
  background: transparent;
  padding: 6px 14px;
  border-radius: var(--radius-full);
  color: var(--text-tertiary);
  font-size: var(--text-xs);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.segmented-control__button--active {
  background: rgba(255, 255, 255, 0.12);
  color: var(--text-primary);
}

.settings-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.settings-actions--inline {
  flex-wrap: wrap;
}

.settings-button {
  border: none;
  border-radius: var(--radius-md);
  padding: 10px 18px;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  color: #0f172a;
  background: var(--color-green);
  transition: transform var(--duration-fast) var(--ease-out);
}

.settings-button:hover {
  transform: translateY(-1px);
}

.settings-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.settings-button--ghost {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.settings-button--danger {
  background: rgba(239, 68, 68, 0.9);
  color: var(--color-white);
}

.settings-button--text {
  background: transparent;
  color: var(--text-tertiary);
}

.settings-action-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-md);
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
}

.settings-action-card--danger {
  border-color: rgba(239, 68, 68, 0.4);
}

.settings-action-card__title {
  margin: 0;
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
}

.settings-action-card__copy {
  margin: 4px 0 0;
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.input-wrapper {
  position: relative;
}

.input-spinner {
  position: absolute;
  top: 50%;
  right: 10px;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: rgba(34, 197, 94, 0.8);
  border-radius: 50%;
  transform: translateY(-50%);
  animation: spin 0.8s linear infinite;
}

.city-suggestions {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  z-index: 5;
  max-height: 160px;
  overflow-y: auto;
}

.city-suggestions__item {
  background: transparent;
  border: none;
  color: var(--text-primary);
  padding: 8px 12px;
  text-align: left;
  cursor: pointer;
}

.city-suggestions__item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.integration-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--space-md);
}

.integration-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-md);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(17, 25, 40, 0.6);
  box-shadow:
    0 10px 24px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.integration-card--compact {
  min-height: auto;
}

.integration-card__header {
  display: flex;
  justify-content: space-between;
  gap: var(--space-md);
  align-items: center;
}

.integration-card__eyebrow {
  margin: 0;
  font-size: var(--text-xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}

.integration-card__title {
  margin: 4px 0 2px;
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.integration-card__copy {
  margin: 0;
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.integration-card__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.integration-card__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.integration-card__label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.integration-card__foot {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin-top: var(--space-sm);
}

.integration-weather-summary {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: var(--font-semibold);
  border: 1px solid transparent;
  white-space: nowrap;
}

.status-pill--success {
  background: rgba(34, 197, 94, 0.12);
  border-color: rgba(34, 197, 94, 0.25);
  color: #34d399;
}

.status-pill--muted {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  color: var(--text-tertiary);
}

.status-pill--danger {
  background: rgba(248, 113, 113, 0.12);
  border-color: rgba(248, 113, 113, 0.28);
  color: #f87171;
}

.ai-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-md);
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
}

.ai-actions__title {
  margin: 0;
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
}

.ai-actions__hint {
  margin: 4px 0 0;
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.about-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--space-md);
}

.about-card {
  padding: var(--space-md);
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
}

.about-card__label {
  display: block;
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin-bottom: 4px;
}

.about-card__value {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
}

.modal-warning {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.modal-warning__highlight {
  color: var(--color-red);
  font-weight: var(--font-medium);
}

@keyframes spin {
  from {
    transform: translateY(-50%) rotate(0deg);
  }
  to {
    transform: translateY(-50%) rotate(360deg);
  }
}

/* Brightness Control */
.brightness-control {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  background: rgba(255, 255, 255, 0.03);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.brightness-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-primary);
  font-size: var(--text-xl);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.brightness-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.25);
}

.brightness-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.brightness-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.brightness-btn__icon {
  font-weight: var(--font-bold);
  line-height: 1;
}

.brightness-slider-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
}

.brightness-slider {
  width: 100%;
  height: 8px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-full);
  outline: none;
  cursor: pointer;
}

.brightness-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--color-white);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: transform var(--duration-fast) var(--ease-out);
}

.brightness-slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

.brightness-slider::-moz-range-thumb {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: var(--color-white);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  cursor: pointer;
}

.brightness-value {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  min-width: 48px;
  text-align: center;
}
</style>
