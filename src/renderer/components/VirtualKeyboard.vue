<template>
  <transition name="vk-slide">
    <div v-if="visible" class="vk">
      <div class="vk__header">
        <span>On-screen keyboard</span>
        <button class="vk__close" type="button" @click="$emit('close')">Hide</button>
      </div>
      <div v-for="(row, index) in rows" :key="index" class="vk__row">
        <button
          v-for="key in row"
          :key="key.label"
          type="button"
          class="vk__key"
          :class="{
            'vk__key--wide': key.wide,
            'vk__key--action': key.action,
          }"
          @click="handleKey(key)"
        >
          {{ key.label }}
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type KeyDef = {
  label: string
  value?: string
  action?: 'backspace' | 'space' | 'enter'
  wide?: boolean
}

const props = defineProps<{
  modelValue: string
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'enter'): void
  (e: 'close'): void
}>()

const rows = computed<KeyDef[][]>(() => [
  [
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '0',
    { label: '⌫', action: 'backspace', wide: true },
  ].map(normalizeKey),
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'].map(normalizeKey),
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'].map(normalizeKey),
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'].map(normalizeKey),
  [
    { label: 'Space', action: 'space', wide: true },
    { label: 'Enter', action: 'enter', wide: true },
  ],
])

function normalizeKey(key: string | KeyDef): KeyDef {
  return typeof key === 'string' ? { label: key, value: key } : key
}

function handleKey(key: KeyDef) {
  const current = props.modelValue ?? ''
  switch (key.action) {
    case 'backspace':
      emit('update:modelValue', current.slice(0, -1))
      return
    case 'space':
      emit('update:modelValue', `${current} `)
      return
    case 'enter':
      emit('enter')
      return
    default:
      emit('update:modelValue', `${current}${key.value ?? key.label}`)
  }
}
</script>

<style scoped>
.vk {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  padding: 12px;
  background: rgba(15, 22, 30, 0.9);
  backdrop-filter: blur(14px);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.vk__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--text-secondary);
  font-size: var(--text-sm);
}

.vk__close {
  background: rgba(255, 255, 255, 0.12);
  color: var(--text-primary);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-button);
  padding: 8px 12px;
  font-size: var(--text-sm);
  cursor: pointer;
}

.vk__row {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.vk__key {
  flex: 1;
  min-width: 48px;
  padding: 12px 0;
  font-size: var(--text-lg);
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-button);
  cursor: pointer;
  transition:
    transform var(--duration-fast) var(--ease-out),
    background var(--duration-fast) var(--ease-out);
}

.vk__key:active {
  transform: translateY(1px);
  background: rgba(255, 255, 255, 0.15);
}

.vk__key--wide {
  flex: 2;
}

.vk__key--action {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.4);
}

.vk-slide-enter-active,
.vk-slide-leave-active {
  transition:
    transform var(--duration-normal) var(--ease-out),
    opacity var(--duration-normal) var(--ease-out);
}
.vk-slide-enter-from,
.vk-slide-leave-to {
  transform: translateY(20px);
  opacity: 0;
}
</style>
