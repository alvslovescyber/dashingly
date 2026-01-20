<template>
  <Teleport to="body">
    <TransitionGroup name="toast" tag="div" class="toast-container">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="[`toast--${toast.type}`]"
        @click="dismiss(toast.id)"
      >
        <component :is="getIcon(toast.type)" :size="18" class="toast__icon" />
        <div class="toast__content">
          <p class="toast__message">{{ toast.message }}</p>
          <p v-if="toast.description" class="toast__description">
            {{ toast.description }}
          </p>
        </div>
        <button class="toast__close" @click.stop="dismiss(toast.id)">
          <X :size="14" />
        </button>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, type Component } from 'vue'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-vue-next'

interface Toast {
  id: number
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  description?: string
  duration?: number
}

const toasts = ref<Toast[]>([])
let toastId = 0

function getIcon(type: Toast['type']): Component {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
  }
  return icons[type]
}

function show(toast: Omit<Toast, 'id'>) {
  const id = ++toastId
  const duration = toast.duration ?? 4000

  toasts.value.push({ ...toast, id })

  if (duration > 0) {
    setTimeout(() => dismiss(id), duration)
  }

  return id
}

function dismiss(id: number) {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index > -1) {
    toasts.value.splice(index, 1)
  }
}

function dismissAll() {
  toasts.value = []
}

// Expose methods
defineExpose({
  show,
  dismiss,
  dismissAll,
  success: (message: string, description?: string) =>
    show({ type: 'success', message, description }),
  error: (message: string, description?: string) => show({ type: 'error', message, description }),
  info: (message: string, description?: string) => show({ type: 'info', message, description }),
  warning: (message: string, description?: string) =>
    show({ type: 'warning', message, description }),
})
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: var(--space-lg);
  right: var(--space-lg);
  display: flex;
  flex-direction: column-reverse;
  gap: var(--space-sm);
  z-index: 9999;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  min-width: 300px;
  max-width: 400px;
  padding: var(--space-md);
  background: var(--glass-dark-medium);
  backdrop-filter: blur(var(--blur-glass));
  -webkit-backdrop-filter: blur(var(--blur-glass));
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-glass);
  pointer-events: auto;
  cursor: pointer;
}

.toast__icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.toast--success .toast__icon {
  color: var(--color-green);
}

.toast--error .toast__icon {
  color: var(--color-red);
}

.toast--info .toast__icon {
  color: var(--color-blue);
}

.toast--warning .toast__icon {
  color: var(--color-orange);
}

.toast__content {
  flex: 1;
  min-width: 0;
}

.toast__message {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  margin: 0;
}

.toast__description {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  margin: var(--space-xs) 0 0;
}

.toast__close {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--ease-default),
    color var(--duration-fast) var(--ease-default);
}

.toast__close:hover {
  background: var(--glass-white);
  color: var(--text-primary);
}

/* Transition Animations */
.toast-enter-active {
  animation: toastIn var(--duration-normal) var(--ease-out);
}

.toast-leave-active {
  animation: toastOut var(--duration-fast) var(--ease-in);
}

@keyframes toastIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes toastOut {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}
</style>
