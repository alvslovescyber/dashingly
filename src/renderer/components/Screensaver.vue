<template>
  <Teleport to="body">
    <Transition name="screensaver">
      <div
        v-if="isActive"
        class="screensaver"
        @click="dismiss"
        @touchstart="dismiss"
        @mousemove="handleMouseMove"
      >
        <div class="screensaver__content">
          <!-- Time Display -->
          <div class="screensaver__time">{{ formattedTime }}</div>

          <!-- Date Display -->
          <div class="screensaver__date">{{ formattedDate }}</div>

          <!-- Location -->
          <div v-if="location" class="screensaver__location">{{ location }}</div>
        </div>

        <!-- Subtle hint to dismiss -->
        <div class="screensaver__hint">
          <span>Tap anywhere to wake</span>
        </div>

        <!-- Animated gradient orbs for visual interest -->
        <div class="screensaver__orb screensaver__orb--1" />
        <div class="screensaver__orb screensaver__orb--2" />
        <div class="screensaver__orb screensaver__orb--3" />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

interface Props {
  timeout?: number // Inactivity timeout in milliseconds (default 5 minutes)
  enabled?: boolean
  location?: string // Location to display (e.g., "London, UK")
}

const props = withDefaults(defineProps<Props>(), {
  timeout: 5 * 60 * 1000, // 5 minutes
  enabled: true,
  location: '',
})

const emit = defineEmits<{
  activate: []
  dismiss: []
}>()

const isActive = ref(false)
const currentTime = ref(new Date())

let inactivityTimer: ReturnType<typeof setTimeout> | null = null
let clockInterval: ReturnType<typeof setInterval> | null = null
let lastMousePosition = { x: 0, y: 0 }

// Format time like Apple - large, clean
const formattedTime = computed(() => {
  const hours = currentTime.value.getHours()
  const minutes = currentTime.value.getMinutes()
  const h = hours.toString().padStart(2, '0')
  const m = minutes.toString().padStart(2, '0')
  return `${h}:${m}`
})

// Format date like Apple - weekday, month day
const formattedDate = computed(() => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }
  return currentTime.value.toLocaleDateString('en-US', options)
})

function resetInactivityTimer() {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer)
  }

  if (props.enabled && !isActive.value) {
    inactivityTimer = setTimeout(() => {
      activate()
    }, props.timeout)
  }
}

function activate() {
  if (!props.enabled) return
  isActive.value = true
  emit('activate')
  startClock()
}

function dismiss() {
  isActive.value = false
  emit('dismiss')
  stopClock()
  resetInactivityTimer()
}

function handleMouseMove(event: MouseEvent) {
  // Only dismiss on significant mouse movement (not micro movements)
  const dx = Math.abs(event.clientX - lastMousePosition.x)
  const dy = Math.abs(event.clientY - lastMousePosition.y)

  if (dx > 10 || dy > 10) {
    dismiss()
  }

  lastMousePosition = { x: event.clientX, y: event.clientY }
}

function startClock() {
  currentTime.value = new Date()
  clockInterval = setInterval(() => {
    currentTime.value = new Date()
  }, 1000)
}

function stopClock() {
  if (clockInterval) {
    clearInterval(clockInterval)
    clockInterval = null
  }
}

// Activity listeners
const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll']

function handleActivity() {
  if (isActive.value) {
    dismiss()
  } else {
    resetInactivityTimer()
  }
}

// Expose methods for external control (voice activation)
defineExpose({
  activate,
  dismiss,
  isActive,
})

watch(
  () => props.enabled,
  enabled => {
    if (!enabled && isActive.value) {
      dismiss()
    } else if (enabled) {
      resetInactivityTimer()
    }
  }
)

onMounted(() => {
  // Set up activity listeners
  activityEvents.forEach(event => {
    document.addEventListener(event, handleActivity, { passive: true })
  })

  // Start inactivity timer
  resetInactivityTimer()
})

onUnmounted(() => {
  // Clean up
  activityEvents.forEach(event => {
    document.removeEventListener(event, handleActivity)
  })

  if (inactivityTimer) {
    clearTimeout(inactivityTimer)
  }

  stopClock()
})
</script>

<style scoped>
.screensaver {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  user-select: none;
  /* Apple-style system font stack */
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', system-ui,
    sans-serif;
}

.screensaver__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  z-index: 1;
}

.screensaver__time {
  font-size: 140px;
  font-weight: 600;
  letter-spacing: -0.03em;
  color: #ffffff;
  line-height: 1;
  text-shadow: 0 4px 32px rgba(0, 0, 0, 0.4);
  /* Use proportional/rounded numbers like Apple */
  font-variant-numeric: proportional-nums;
  font-feature-settings:
    'cv01' 1,
    'cv02' 1;
}

.screensaver__date {
  font-size: 26px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 0.01em;
  margin-top: 4px;
}

.screensaver__location {
  font-size: 18px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 16px;
  text-align: center;
  letter-spacing: 0.02em;
}

.screensaver__hint {
  position: absolute;
  bottom: 48px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 14px;
  color: rgba(255, 255, 255, 0.3);
  z-index: 1;
  animation: pulse 3s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.6;
  }
}

/* Animated gradient orbs */
.screensaver__orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
  pointer-events: none;
}

.screensaver__orb--1 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  top: -100px;
  right: -100px;
  animation: float1 20s ease-in-out infinite;
}

.screensaver__orb--2 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  bottom: -50px;
  left: -50px;
  animation: float2 25s ease-in-out infinite;
}

.screensaver__orb--3 {
  width: 250px;
  height: 250px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: float3 30s ease-in-out infinite;
}

@keyframes float1 {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(-50px, 50px) scale(1.1);
  }
  66% {
    transform: translate(30px, -30px) scale(0.9);
  }
}

@keyframes float2 {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(40px, -40px) scale(1.15);
  }
  66% {
    transform: translate(-30px, 20px) scale(0.85);
  }
}

@keyframes float3 {
  0%,
  100% {
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
  }
}

/* Transition animations */
.screensaver-enter-active {
  transition: opacity 0.8s ease-out;
}

.screensaver-leave-active {
  transition: opacity 0.4s ease-in;
}

.screensaver-enter-from,
.screensaver-leave-to {
  opacity: 0;
}
</style>
