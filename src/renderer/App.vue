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
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { GlassShell, Toast } from './components'
import HomePage from './pages/HomePage.vue'
import { DESIGN_WIDTH, DESIGN_HEIGHT, getDynamicScale } from './theme/scaling'

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

// Provide toast globally
import { provide } from 'vue'
provide('toast', toastRef)
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
