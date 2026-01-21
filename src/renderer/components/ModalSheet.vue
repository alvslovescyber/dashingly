<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-sheet__overlay" @click="handleOverlayClick">
        <div class="modal-sheet" :class="[`modal-sheet--${size}`]" @click.stop>
          <!-- Header -->
          <div class="modal-sheet__header">
            <h2 class="modal-sheet__title">{{ title }}</h2>
            <button class="modal-sheet__close" @click="close">
              <X :size="20" />
            </button>
          </div>

          <!-- Content -->
          <div class="modal-sheet__content">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="modal-sheet__footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { X } from 'lucide-vue-next'

interface Props {
  modelValue: boolean
  title: string
  size?: 'sm' | 'md' | 'lg'
  closeOnOverlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  closeOnOverlay: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function close() {
  emit('update:modelValue', false)
}

function handleOverlayClick() {
  if (props.closeOnOverlay) {
    close()
  }
}

// Prevent body scroll when modal is open
watch(
  () => props.modelValue,
  isOpen => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
)
</script>

<style scoped>
.modal-sheet__overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center; /* Center vertically */
  justify-content: center; /* Center horizontally */
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 9998;
  padding: var(--space-md);
}

.modal-sheet {
  width: 100%;
  max-height: 85vh;
  /* Glassmorphic background */
  background: rgba(18, 18, 22, 0.65);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 24px 48px -12px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Size Variants */
.modal-sheet--sm {
  max-width: 400px;
}

.modal-sheet--md {
  max-width: 600px;
}

.modal-sheet--lg {
  max-width: 800px;
}

.modal-sheet__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg);
  border-bottom: 1px solid var(--border-light);
}

.modal-sheet__title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.modal-sheet__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--glass-white);
  border: none;
  border-radius: 50%;
  color: var(--text-secondary);
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--ease-default),
    color var(--duration-fast) var(--ease-default);
}

.modal-sheet__close:hover {
  background: var(--glass-white-medium);
  color: var(--text-primary);
}

.modal-sheet__content {
  flex: 1;
  padding: var(--space-lg);
  overflow-y: auto;
}

.modal-sheet__footer {
  padding: var(--space-lg);
  border-top: 1px solid var(--border-light);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
}

/* Transition Animations */
.modal-enter-active,
.modal-leave-active {
  transition: opacity var(--duration-normal) var(--ease-default);
}

.modal-enter-active .modal-sheet,
.modal-leave-active .modal-sheet {
  transition:
    transform var(--duration-normal) cubic-bezier(0.16, 1, 0.3, 1),
    opacity var(--duration-normal) var(--ease-default);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-sheet,
.modal-leave-to .modal-sheet {
  opacity: 0;
  transform: scale(0.96) translateY(10px);
}
</style>
