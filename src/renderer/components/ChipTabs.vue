<template>
  <div class="chip-tabs">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      class="chip-tab"
      :class="{ 'chip-tab--active': modelValue === tab.value }"
      @click="$emit('update:modelValue', tab.value)"
    >
      <component
        v-if="tab.icon"
        :is="tab.icon"
        :size="14"
        class="chip-tab__icon"
      />
      <span>{{ tab.label }}</span>
    </button>

    <!-- Add Button (optional) -->
    <button
      v-if="showAdd"
      class="chip-tab chip-tab--add"
      @click="$emit('add')"
    >
      <Plus :size="14" />
      <span>New</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import type { Component } from 'vue'

interface Tab {
  value: string
  label: string
  icon?: Component
}

interface Props {
  tabs: Tab[]
  modelValue: string
  showAdd?: boolean
}

withDefaults(defineProps<Props>(), {
  showAdd: false,
})

defineEmits<{
  'update:modelValue': [value: string]
  add: []
}>()
</script>

<style scoped>
.chip-tabs {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-wrap: nowrap;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.chip-tabs::-webkit-scrollbar {
  display: none;
}

.chip-tab {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  background: var(--glass-white);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-chip);
  font-family: var(--font-family);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  cursor: pointer;
  white-space: nowrap;
  transition: 
    background-color var(--duration-fast) var(--ease-default),
    color var(--duration-fast) var(--ease-default),
    border-color var(--duration-fast) var(--ease-default);
  -webkit-tap-highlight-color: transparent;
}

.chip-tab:hover {
  background: var(--glass-white-medium);
  color: var(--text-primary);
}

.chip-tab:active {
  transform: scale(0.97);
}

.chip-tab--active {
  background: var(--color-blue);
  border-color: var(--color-blue);
  color: var(--color-white);
}

.chip-tab--active:hover {
  background: var(--color-blue-dark);
  border-color: var(--color-blue-dark);
  color: var(--color-white);
}

.chip-tab__icon {
  flex-shrink: 0;
}

/* Add Button Variant */
.chip-tab--add {
  background: transparent;
  border-style: dashed;
  color: var(--text-tertiary);
}

.chip-tab--add:hover {
  background: var(--glass-white-light);
  color: var(--text-secondary);
}
</style>
