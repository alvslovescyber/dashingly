<template>
  <div class="progress-ring" :style="ringStyle">
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
      <!-- Background Circle -->
      <circle
        class="progress-ring__bg"
        :cx="center"
        :cy="center"
        :r="radius"
        :stroke-width="strokeWidth"
        fill="none"
      />
      <!-- Progress Circle -->
      <circle
        class="progress-ring__progress"
        :cx="center"
        :cy="center"
        :r="radius"
        :stroke-width="strokeWidth"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        fill="none"
        :stroke="color"
      />
    </svg>
    <!-- Center Content -->
    <div class="progress-ring__content">
      <slot>
        <span class="progress-ring__value">{{ Math.round(value) }}%</span>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  value: number // 0-100
  size?: number
  strokeWidth?: number
  color?: string
  bgColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 80,
  strokeWidth: 6,
  color: '#3B82F6',
  bgColor: 'rgba(255, 255, 255, 0.1)',
})

const center = computed(() => props.size / 2)
const radius = computed(() => (props.size - props.strokeWidth) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const dashOffset = computed(() => {
  const progress = Math.min(100, Math.max(0, props.value)) / 100
  return circumference.value * (1 - progress)
})

const ringStyle = computed(() => ({
  '--ring-size': `${props.size}px`,
  '--ring-bg-color': props.bgColor,
}))
</script>

<style scoped>
.progress-ring {
  position: relative;
  width: var(--ring-size);
  height: var(--ring-size);
}

.progress-ring svg {
  transform: rotate(-90deg);
}

.progress-ring__bg {
  stroke: var(--ring-bg-color);
}

.progress-ring__progress {
  stroke-linecap: round;
  transition: stroke-dashoffset var(--duration-slow) var(--ease-out);
}

.progress-ring__content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-ring__value {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}
</style>
