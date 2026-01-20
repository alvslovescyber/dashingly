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
        :size="13"
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
      <Plus :size="13" />
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
  gap: 6px;
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
  gap: 5px;
  padding: 8px 14px;
  /* Subtle background */
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-chip);
  font-family: var(--font-family);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  cursor: pointer;
  white-space: nowrap;
  transition: 
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
  -webkit-tap-highlight-color: transparent;
}

.chip-tab:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.chip-tab:active {
  transform: scale(0.97);
}

/* ACTIVE = strong fill + subtle glow */
.chip-tab--active {
  background: var(--color-blue);
  border-color: var(--color-blue);
  color: var(--color-white);
  font-weight: var(--font-semibold);
  box-shadow: 
    0 2px 8px rgba(59, 130, 246, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.chip-tab--active:hover {
  background: var(--color-blue-dark);
  border-color: var(--color-blue-dark);
  color: var(--color-white);
}

.chip-tab__icon {
  flex-shrink: 0;
  opacity: 0.8;
}

.chip-tab--active .chip-tab__icon {
  opacity: 1;
}

/* Add Button Variant */
.chip-tab--add {
  background: transparent;
  border-style: dashed;
  border-color: rgba(255, 255, 255, 0.15);
  color: var(--text-tertiary);
}

.chip-tab--add:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.2);
  color: var(--text-secondary);
}
</style>
