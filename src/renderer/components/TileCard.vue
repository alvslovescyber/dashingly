<template>
  <div
    class="tile-card"
    :class="[
      `tile-card--${size}`,
      { 'tile-card--interactive': interactive }
    ]"
    :style="tileStyle"
    @click="handleClick"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
  >
    <!-- Header -->
    <div v-if="title || $slots.header" class="tile-header">
      <slot name="header">
        <div class="tile-header__content">
          <component
            v-if="icon"
            :is="icon"
            class="tile-header__icon"
            :size="18"
          />
          <span class="tile-header__title">{{ title }}</span>
        </div>
        <div v-if="$slots.headerRight" class="tile-header__right">
          <slot name="headerRight" />
        </div>
      </slot>
    </div>

    <!-- Content -->
    <div class="tile-content">
      <slot />
    </div>

    <!-- Footer -->
    <div v-if="$slots.footer" class="tile-footer">
      <slot name="footer" />
    </div>

    <!-- Toggle (optional) -->
    <TogglePill
      v-if="showToggle"
      :model-value="toggleValue"
      class="tile-toggle"
      @update:model-value="$emit('update:toggleValue', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, type Component } from 'vue'
import TogglePill from './TogglePill.vue'

interface Props {
  title?: string
  icon?: Component
  size?: 'sm' | 'md' | 'lg' | 'xl'
  interactive?: boolean
  showToggle?: boolean
  toggleValue?: boolean
  accentColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  interactive: true,
  showToggle: false,
  toggleValue: false,
})

const emit = defineEmits<{
  click: []
  'update:toggleValue': [value: boolean]
}>()

const isPressed = ref(false)

const tileStyle = computed(() => ({
  '--accent-color': props.accentColor || 'var(--color-blue)',
}))

function handleClick() {
  if (props.interactive) {
    emit('click')
  }
}

function handleTouchStart() {
  if (props.interactive) {
    isPressed.value = true
  }
}

function handleTouchEnd() {
  isPressed.value = false
}
</script>

<style scoped>
.tile-card {
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--glass-white);
  backdrop-filter: blur(var(--blur-glass));
  -webkit-backdrop-filter: blur(var(--blur-glass));
  border-radius: var(--radius-tile);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-tile);
  padding: var(--space-md);
  transition: 
    transform var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
  overflow: hidden;
}

.tile-card--interactive {
  cursor: pointer;
}

.tile-card--interactive:hover {
  box-shadow: var(--shadow-tile-hover);
}

.tile-card--interactive:active {
  transform: scale(0.98);
}

/* Size Variants */
.tile-card--sm {
  min-height: 100px;
}

.tile-card--md {
  min-height: 140px;
}

.tile-card--lg {
  min-height: 200px;
}

.tile-card--xl {
  min-height: 280px;
}

/* Header */
.tile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-sm);
}

.tile-header__content {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.tile-header__icon {
  color: var(--text-secondary);
  flex-shrink: 0;
}

.tile-header__title {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.tile-header__right {
  display: flex;
  align-items: center;
}

/* Content */
.tile-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Footer */
.tile-footer {
  margin-top: auto;
  padding-top: var(--space-sm);
  border-top: 1px solid var(--border-light);
}

/* Toggle Position */
.tile-toggle {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
}

/* Inner glow effect */
.tile-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.15) 50%,
    transparent 100%
  );
  pointer-events: none;
}
</style>
