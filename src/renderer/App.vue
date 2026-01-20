<template>
  <div class="app-wrapper" :style="wrapperStyle">
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { GlassShell, Toast } from './components'
import HomePage from './pages/HomePage.vue'
import {
  DESIGN_WIDTH,
  DESIGN_HEIGHT,
  getDynamicScale,
} from './theme/scaling'

// Toast ref for global access
const toastRef = ref<InstanceType<typeof Toast>>()

// Scaling
const currentScale = ref(getDynamicScale())

function updateScale() {
  currentScale.value = getDynamicScale()
}

onMounted(() => {
  window.addEventListener('resize', updateScale)
  updateScale()
})

onUnmounted(() => {
  window.removeEventListener('resize', updateScale)
})

// Wrapper styles (viewport)
const wrapperStyle = computed(() => ({
  width: '100vw',
  height: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: `url('/backgrounds/default.webp') center/cover no-repeat`,
  overflow: 'hidden',
}))

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
  }
})

// Provide toast globally
import { provide } from 'vue'
provide('toast', toastRef)
</script>

<style scoped>
.app-wrapper {
  position: relative;
}

.scaled-container {
  overflow: hidden;
}

.dashboard-shell {
  width: 100%;
  height: 100%;
}
</style>
