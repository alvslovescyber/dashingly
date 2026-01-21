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
            <button
              class="settings-button"
              :disabled="savingDisplayName"
              @click="saveDisplayName"
            >
              {{ savingDisplayName ? 'Saving…' : 'Save name' }}
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
                :class="{ 'segmented-control__button--active': weatherForm.locationMode === 'city' }"
                type="button"
                @click="setLocationMode('city')"
              >
                City search
              </button>
              <button
                class="segmented-control__button"
                :class="{ 'segmented-control__button--active': weatherForm.locationMode === 'latlon' }"
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

        <!-- AI -->
        <template v-else-if="currentSection === 'ai'">
          <div class="form-field form-field--inline">
            <div>
              <label class="form-label">Scheduled generation</label>
              <p class="form-hint">Keeps fresh suggestions each day at {{ aiForm.autoGenerateTime }}.</p>
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
              {{ hasStoredAIKey ? 'Stored securely on this device.' : 'Required to generate suggestions.' }}
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
              <p class="ai-actions__title">Need ideas right now?</p>
              <p class="ai-actions__hint">Run the generator without waiting for the schedule.</p>
            </div>
            <button
              class="settings-button"
              :disabled="aiGenerating || !hasStoredAIKey"
              @click="generateNow"
            >
              {{ aiGenerating ? 'Generating…' : 'Generate now' }}
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
            <button class="settings-button settings-button--ghost" :disabled="exportingDb" @click="exportDatabase">
              {{ exportingDb ? 'Exporting…' : 'Export' }}
            </button>
          </div>

          <div class="settings-action-card settings-action-card--danger">
            <div>
              <p class="settings-action-card__title">Reset to demo data</p>
              <p class="settings-action-card__copy">Wipes current data and reseeds the built-in demo.</p>
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
      <button class="settings-button settings-button--ghost" type="button" @click="showResetModal = false">
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
import { useDashboard } from '../composables/useDashboard'
import type { Settings, WeatherSettings } from '@shared/types'

type ToastHandle = {
  success: (message: string, description?: string) => void
  error: (message: string, description?: string) => void
  info: (message: string, description?: string) => void
  warning: (message: string, description?: string) => void
}

const toast = inject<Ref<ToastHandle | undefined>>('toast')

function showToast(type: keyof ToastHandle, message: string, description?: string) {
  toast?.value?.[type](message, description)
}

const navSections = [
  { id: 'general', label: 'General', description: 'Greeting & personalization' },
  { id: 'weather', label: 'Weather', description: 'City search and units' },
  { id: 'ai', label: 'AI', description: 'Suggestions & OpenAI key' },
  { id: 'demo', label: 'Demo mode', description: 'Use fake or live data' },
  { id: 'data', label: 'Data', description: 'Export and reset options' },
  { id: 'about', label: 'About', description: 'Build metadata' },
] as const

type SectionId = (typeof navSections)[number]['id']

const currentSection = ref<SectionId>('general')
const activeSection = computed(() => navSections.find(section => section.id === currentSection.value)!)

const { displayName, settings, fetchSnapshot } = useDashboard()

type SettingsPatch = Partial<
  Omit<Settings, 'ai' | 'weather' | 'brightness' | 'notifications'>
> & {
  ai?: Partial<Settings['ai']>
  weather?: Partial<Settings['weather']>
  brightness?: Partial<Settings['brightness']>
  notifications?: Partial<Settings['notifications']>
}

// General
const displayNameInput = ref(displayName.value ?? '')
const savingDisplayName = ref(false)
const displayNameError = ref<string | null>(null)

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

  const merged: Settings = {
    ...base,
    ...partial,
    brightness: partial.brightness ? { ...base.brightness, ...partial.brightness } : base.brightness,
    notifications: partial.notifications
      ? { ...base.notifications, ...partial.notifications }
      : base.notifications,
    weather: partial.weather ? { ...base.weather, ...partial.weather } : base.weather,
    ai: partial.ai ? { ...base.ai, ...partial.ai } : base.ai,
  }

  await window.electronAPI.setSetting('settings', merged)
  await fetchSnapshot(true)
}

onMounted(() => {
  loadWeatherSettings()
  loadOpenAIKeyStatus()
  loadAppInfo()
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
</style>
