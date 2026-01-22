<template>
  <div class="app-wrapper">
    <div class="app-background" />
    <div class="scaled-container" :style="scaledStyle">
      <GlassShell
        class="dashboard-shell"
        blur="glass"
        opacity="medium"
        rounded="glass"
        :border="true"
        :shadow="true"
        :padding="'none'"
      >
        <HomePage />
      </GlassShell>
    </div>
  </div>

  <!-- Toast Container -->
  <Toast ref="toastRef" />

  <!-- Screensaver -->
  <Screensaver
    ref="screensaverRef"
    :timeout="5 * 60 * 1000"
    :enabled="screensaverEnabled"
    :location="weatherData.location || 'London, UK'"
    @activate="handleScreensaverActivate"
    @dismiss="handleScreensaverDismiss"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { GlassShell, Toast, Screensaver } from './components'
import { useDashboard } from './composables/useDashboard'
import { useVoiceActivation } from './composables/useVoiceActivation'
import { initAudio } from './utils/notification-sound'
import HomePage from './pages/HomePage.vue'
import { DESIGN_WIDTH, DESIGN_HEIGHT, getDynamicScale } from './theme/scaling'

// Dashboard data
const { weatherData } = useDashboard()

// Toast ref for global access
const toastRef = ref<InstanceType<typeof Toast>>()

// Screensaver
const screensaverRef = ref<InstanceType<typeof Screensaver>>()
const screensaverEnabled = ref(true)

function handleScreensaverActivate() {
  console.log('Screensaver activated')
}

function handleScreensaverDismiss() {
  console.log('Screensaver dismissed')
}

// Voice activation for screensaver wake
const { isSupported: voiceSupported, isListening: voiceListening } = useVoiceActivation({
  wakeWord: 'hey alvis',
  enabled: true,
  onWake: () => {
    // Dismiss screensaver when wake word detected
    if (screensaverRef.value?.isActive) {
      screensaverRef.value.dismiss()
      console.log('Screensaver dismissed via voice')
    }
  },
})

// Log voice activation status (for debugging)
if (voiceSupported.value) {
  console.log('Voice activation supported, listening:', voiceListening.value)
}

// Scaling
const currentScale = ref(getDynamicScale())

function updateScale() {
  currentScale.value = getDynamicScale()
}

onMounted(() => {
  window.addEventListener('resize', updateScale)
  updateScale()

  // Initialize audio on first interaction (required by browsers)
  const initAudioOnInteraction = () => {
    initAudio()
    document.removeEventListener('click', initAudioOnInteraction)
    document.removeEventListener('touchstart', initAudioOnInteraction)
  }
  document.addEventListener('click', initAudioOnInteraction, { once: true })
  document.addEventListener('touchstart', initAudioOnInteraction, { once: true })
})

onUnmounted(() => {
  window.removeEventListener('resize', updateScale)
})

// Scaled container styles
const scaledStyle = computed(() => {
  const scale = currentScale.value
  const offsetX = (window.innerWidth - DESIGN_WIDTH * scale) / 2
  const offsetY = (window.innerHeight - DESIGN_HEIGHT * scale) / 2

  return {
    width: `${DESIGN_WIDTH}px`,
    height: `${DESIGN_HEIGHT}px`,
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
    position: 'absolute' as const,
    left: `${Math.max(0, offsetX)}px`,
    top: `${Math.max(0, offsetY)}px`,
    zIndex: 1, // Above background
  }
})

// Provide toast and screensaver globally
import { provide } from 'vue'
provide('toast', toastRef)
provide('screensaver', screensaverRef)
</script>

<style scoped>
.app-wrapper {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #000;
}

.app-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('/backgrounds/default.jpg') center/cover no-repeat;
  /* Darker, calmer background to let glass UI pop */
  filter: brightness(85%) saturate(90%);
  z-index: 0;
}

.scaled-container {
  overflow: hidden;
  /* Hardware acceleration for smooth scaling */
  will-change: transform;
}

.dashboard-shell {
  width: 100%;
  height: 100%;
}
</style>
