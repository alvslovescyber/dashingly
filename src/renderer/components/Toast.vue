<template>
  <Teleport to="body">
    <TransitionGroup name="toast" tag="div" class="toast-container">
      <article
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="[`toast--${toast.type}`]"
      >
        <component :is="getIcon(toast.type)" :size="18" class="toast__icon" />
        <div class="toast__content">
          <p class="toast__message">{{ toast.message }}</p>
          <p v-if="toast.description" class="toast__description">
            {{ toast.description }}
          </p>
          <button
            v-if="toast.action"
            class="toast__action"
            type="button"
            @click.stop="handleAction(toast)"
          >
            {{ toast.action.label }}
          </button>
        </div>
        <button class="toast__close" type="button" @click.stop="dismiss(toast.id)">
          <X :size="14" />
        </button>
      </article>
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
  action?: {
    label: string
    handler: () => void
  }
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
  const duration = toast.duration ?? (toast.type === 'error' ? 6000 : 4500)

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

function handleAction(toast: Toast) {
  toast.action?.handler()
  dismiss(toast.id)
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
  bottom: 18px;
  right: 18px;
  display: flex;
  flex-direction: column-reverse;
  gap: 10px;
  z-index: 9999;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  width: min(360px, calc(100vw - 32px));
  padding: 12px 14px;
  background: rgba(13, 18, 30, 0.8);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  box-shadow:
    0 18px 40px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  pointer-events: auto;
  cursor: default;
}

.toast__icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.toast--success .toast__icon {
  color: #22c55e;
}

.toast--error .toast__icon {
  color: #f87171;
}

.toast--info .toast__icon {
  color: #a5b4fc;
}

.toast--warning .toast__icon {
  color: #fbbf24;
}

.toast__content {
  flex: 1;
  min-width: 0;
}

.toast__message {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.toast__description {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 4px 0 6px;
}

.toast__action {
  align-self: flex-start;
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out);
}

.toast__action:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.18);
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
  animation: toastIn 220ms var(--ease-out);
}

.toast-leave-active {
  animation: toastOut 180ms var(--ease-in);
}

@keyframes toastIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes toastOut {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(12px);
  }
}
</style>
