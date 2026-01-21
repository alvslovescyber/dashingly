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
        ref="progressCircle"
        class="progress-ring__progress"
        :class="{ 'progress-ring__progress--animated': isAnimated }"
        :cx="center"
        :cy="center"
        :r="radius"
        :stroke-width="strokeWidth"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="currentOffset"
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
import { computed, ref, onMounted, watch } from 'vue'

interface Props {
  value: number // 0-100
  size?: number
  strokeWidth?: number
  color?: string
  bgColor?: string
  animateOnMount?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 80,
  strokeWidth: 6,
  color: '#3B82F6',
  bgColor: 'rgba(255, 255, 255, 0.1)',
  animateOnMount: true,
})

const center = computed(() => props.size / 2)
const radius = computed(() => (props.size - props.strokeWidth) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)

// Animation state
const isAnimated = ref(false)

const dashOffset = computed(() => {
  const progress = Math.min(100, Math.max(0, props.value)) / 100
  return circumference.value * (1 - progress)
})

const currentOffset = computed(() => {
  if (!isAnimated.value) {
    // Before animation starts, show empty
    return circumference.value
  }
  return dashOffset.value
})

const ringStyle = computed(() => ({
  '--ring-size': `${props.size}px`,
  '--ring-bg-color': props.bgColor,
  '--ring-color': props.color,
}))

onMounted(() => {
  if (props.animateOnMount) {
    // Small delay for mount animation
    setTimeout(() => {
      isAnimated.value = true
    }, 100)
  } else {
    isAnimated.value = true
  }
})

// Re-animate when value changes significantly
watch(
  () => props.value,
  (newVal, oldVal) => {
    if (Math.abs(newVal - oldVal) > 5) {
      isAnimated.value = false
      setTimeout(() => {
        isAnimated.value = true
      }, 50)
    }
  }
)
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
  transition: none;
}

.progress-ring__progress--animated {
  transition: stroke-dashoffset 800ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.progress-ring__content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ring-color, var(--text-primary));
}

.progress-ring__value {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}
</style>
