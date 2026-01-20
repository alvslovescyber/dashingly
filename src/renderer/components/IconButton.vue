<template>
  <button
    class="icon-button"
    :class="[
      `icon-button--${size}`,
      `icon-button--${variant}`,
      { 'icon-button--active': active }
    ]"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <component :is="icon" :size="iconSize" />
  </button>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'

interface Props {
  icon: Component
  size?: 'sm' | 'md' | 'lg'
  variant?: 'ghost' | 'glass' | 'solid'
  active?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'ghost',
  active: false,
  disabled: false,
})

defineEmits<{
  click: []
}>()

const iconSize = computed(() => {
  const sizeMap = {
    sm: 16,
    md: 20,
    lg: 24,
  }
  return sizeMap[props.size]
})
</script>

<style scoped>
.icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: var(--radius-button);
  color: var(--text-secondary);
  transition: 
    background-color var(--duration-fast) var(--ease-default),
    color var(--duration-fast) var(--ease-default),
    transform var(--duration-fast) var(--ease-default);
  -webkit-tap-highlight-color: transparent;
}

.icon-button:hover {
  color: var(--text-primary);
}

.icon-button:active {
  transform: scale(0.95);
}

.icon-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Size Variants */
.icon-button--sm {
  width: 32px;
  height: 32px;
}

.icon-button--md {
  width: 40px;
  height: 40px;
}

.icon-button--lg {
  width: 48px;
  height: 48px;
}

/* Variant: Ghost */
.icon-button--ghost:hover {
  background: var(--glass-white-light);
}

/* Variant: Glass */
.icon-button--glass {
  background: var(--glass-white);
  border: 1px solid var(--border-light);
}

.icon-button--glass:hover {
  background: var(--glass-white-medium);
}

/* Variant: Solid */
.icon-button--solid {
  background: var(--color-blue);
  color: var(--color-white);
}

.icon-button--solid:hover {
  background: var(--color-blue-dark);
  color: var(--color-white);
}

/* Active State */
.icon-button--active {
  background: var(--color-blue);
  color: var(--color-white);
}
</style>
