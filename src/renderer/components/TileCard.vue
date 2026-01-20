<template>
  <div
    class="tile-card"
    :class="[`tile-card--${size}`, { 'tile-card--interactive': interactive }]"
    @click="handleClick"
  >
    <!-- Header -->
    <div v-if="title || $slots.header" class="tile-header">
      <slot name="header">
        <div class="tile-header__content">
          <component
            :is="icon"
            v-if="icon"
            class="tile-header__icon"
            :size="16"
            :stroke-width="2"
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
import type { Component } from 'vue'
import TogglePill from './TogglePill.vue'

interface Props {
  title?: string
  icon?: Component
  size?: 'sm' | 'md' | 'lg' | 'xl'
  interactive?: boolean
  showToggle?: boolean
  toggleValue?: boolean
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

function handleClick() {
  if (props.interactive) {
    emit('click')
  }
}
</script>

<style scoped>
.tile-card {
  position: relative;
  display: flex;
  flex-direction: column;
  /* GRADIENT background, NO backdrop blur */
  background: var(--glass-tile);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;

  /* Precise hairline border */
  border: var(--border-tile);
  border-radius: var(--radius-tile);

  /* Layered shadows for depth */
  box-shadow: var(--shadow-tile);

  padding: var(--space-md);
  overflow: hidden;
  transition:
    transform var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out),
    background var(--duration-normal) var(--ease-out);
}

.tile-card--interactive {
  cursor: pointer;
}

.tile-card--interactive:hover {
  background: var(--glass-tile-hover);
  box-shadow: var(--shadow-tile-hover);
}

.tile-card--interactive:active {
  transform: scale(0.98);
  box-shadow: var(--shadow-tile);
  transition-duration: 50ms;
}

/* Size Variants */
.tile-card--sm {
  min-height: 80px;
}
.tile-card--md {
  min-height: 120px;
}
.tile-card--lg {
  min-height: 180px;
}
.tile-card--xl {
  min-height: 240px;
}

/* Header - REFINED TYPOGRAPHY */
.tile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-sm);
}

.tile-header__content {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tile-header__icon {
  color: var(--text-secondary);
  flex-shrink: 0;
}

.tile-header__title {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  letter-spacing: -0.01em;
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
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

/* Toggle Position */
.tile-toggle {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
}

/* Top edge highlight */
.tile-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.12) 50%,
    transparent 100%
  );
  pointer-events: none;
}
</style>
