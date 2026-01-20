<template>
  <button
    class="icon-button"
    :class="[`icon-button--${size}`, `icon-button--${variant}`, { 'icon-button--active': active }]"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <component :is="icon" :size="iconSize" :stroke-width="1.75" />
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
  const sizeMap = { sm: 15, md: 18, lg: 22 }
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
  color: var(--text-tertiary);
  transition:
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
  -webkit-tap-highlight-color: transparent;
}

.icon-button:hover {
  color: var(--text-primary);
}

.icon-button:active {
  transform: scale(0.92);
}

.icon-button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* Size Variants */
.icon-button--sm {
  width: 30px;
  height: 30px;
}
.icon-button--md {
  width: 36px;
  height: 36px;
}
.icon-button--lg {
  width: 44px;
  height: 44px;
}

/* Variant: Ghost */
.icon-button--ghost:hover {
  background: rgba(255, 255, 255, 0.06);
}

/* Variant: Glass */
.icon-button--glass {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--text-secondary);
}

.icon-button--glass:hover {
  background: rgba(255, 255, 255, 0.12);
  color: var(--text-primary);
}

/* Variant: Solid */
.icon-button--solid {
  background: var(--color-blue);
  color: var(--color-white);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
}

.icon-button--solid:hover {
  background: var(--color-blue-dark);
}

/* Active State */
.icon-button--active {
  background: var(--color-blue);
  color: var(--color-white);
}
</style>
