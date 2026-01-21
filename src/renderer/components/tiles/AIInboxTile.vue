<template>
  <TileCard title="AI Inbox" :icon="Zap" class="ai-inbox-tile" size="md" :interactive="false">
    <template #headerRight>
      <div class="ai-inbox-header-actions">
        <span class="ai-inbox-count" :class="{ 'ai-inbox-count--has-items': suggestions.length > 0 }">
          {{ suggestions.length > 0 ? suggestions.length : '—' }}
        </span>
        <button
          class="ai-inbox-generate"
          type="button"
          :disabled="generating"
          @click="emit('generate')"
        >
          {{ generating ? 'Generating…' : 'Generate' }}
        </button>
      </div>
    </template>

    <div class="ai-inbox-content">
      <!-- Suggestions List -->
      <TransitionGroup
        v-if="suggestions.length > 0"
        name="suggestion"
        tag="div"
        class="ai-inbox-list"
      >
        <div
          v-for="suggestion in displayedSuggestions"
          :key="suggestion.id"
          class="ai-inbox-item"
          :class="{ 'ai-inbox-item--accepting': acceptingId === suggestion.id, 'ai-inbox-item--dismissing': dismissingId === suggestion.id }"
        >
          <div class="ai-inbox-item__content">
            <span class="ai-inbox-item__title">{{ suggestion.title }}</span>
            <span class="ai-inbox-item__reason">{{ truncateReason(suggestion.reason) }}</span>
          </div>
          <div class="ai-inbox-item__actions">
            <button
              class="ai-inbox-btn ai-inbox-btn--accept"
              title="Accept suggestion"
              :disabled="acceptingId === suggestion.id || dismissingId === suggestion.id"
              @click="handleAccept(suggestion.id)"
            >
              <Check :size="14" :stroke-width="2.5" />
            </button>
            <button
              class="ai-inbox-btn ai-inbox-btn--dismiss"
              title="Dismiss suggestion"
              :disabled="acceptingId === suggestion.id || dismissingId === suggestion.id"
              @click="handleDismiss(suggestion.id)"
            >
              <X :size="14" :stroke-width="2.5" />
            </button>
          </div>
        </div>
      </TransitionGroup>

      <!-- View All Button (outside transition) -->
      <button
        v-if="suggestions.length > 0"
        class="ai-inbox-view-all"
        type="button"
        @click="handleViewAll"
      >
        View all<span v-if="suggestions.length > 3"> ({{ suggestions.length }})</span>
      </button>

      <!-- Empty State -->
      <div v-if="suggestions.length === 0" class="ai-inbox-empty">
        <div class="ai-inbox-empty__icon-wrap">
          <Zap :size="20" class="ai-inbox-empty__icon" />
        </div>
        <span class="ai-inbox-empty__title">All caught up</span>
        <span class="ai-inbox-empty__text">Next check at {{ nextSuggestionTime }}</span>
      </div>
    </div>
  </TileCard>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Zap, Check, X } from 'lucide-vue-next'
import TileCard from '../TileCard.vue'

export interface AISuggestion {
  id: string
  title: string
  reason: string
}

interface Props {
  suggestions: AISuggestion[]
  nextSuggestionTime?: string
  generating?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  suggestions: () => [],
  nextSuggestionTime: '12:00',
  generating: false,
})

const emit = defineEmits<{
  accept: [id: string]
  dismiss: [id: string]
  viewAll: []
  generate: []
}>()

// Animation state
const acceptingId = ref<string | null>(null)
const dismissingId = ref<string | null>(null)

// Show max 3 suggestions
const displayedSuggestions = computed(() => props.suggestions.slice(0, 3))

function truncateReason(reason: string, maxLength = 45): string {
  if (reason.length <= maxLength) return reason
  return reason.slice(0, maxLength).trim() + '…'
}

function handleAccept(id: string) {
  acceptingId.value = id
  // Emit after brief animation delay
  setTimeout(() => {
    emit('accept', id)
    acceptingId.value = null
  }, 200)
}

function handleDismiss(id: string) {
  dismissingId.value = id
  // Emit after brief animation delay
  setTimeout(() => {
    emit('dismiss', id)
    dismissingId.value = null
  }, 200)
}

function handleViewAll() {
  emit('viewAll')
}
</script>

<style scoped>
.ai-inbox-tile {
  min-height: 140px;
}

.ai-inbox-header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.ai-inbox-count {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  min-width: 32px;
  text-align: center;
  padding: 4px 8px;
  border-radius: var(--radius-full);
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
}

.ai-inbox-count--has-items {
  color: var(--text-primary);
  border-color: rgba(255, 255, 255, 0.2);
}

.ai-inbox-generate {
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  padding: 6px 12px;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-out);
}

.ai-inbox-generate:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ai-inbox-generate:not(:disabled):hover {
  background: rgba(255, 255, 255, 0.14);
}

.ai-inbox-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.ai-inbox-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
}

/* TransitionGroup animations */
.suggestion-enter-active,
.suggestion-leave-active {
  transition: all var(--duration-normal) var(--ease-out);
}

.suggestion-enter-from {
  opacity: 0;
  transform: translateX(-12px);
}

.suggestion-leave-to {
  opacity: 0;
  transform: translateX(12px);
}

.suggestion-move {
  transition: transform var(--duration-normal) var(--ease-out);
}

.ai-inbox-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  transition: all var(--duration-fast) var(--ease-out);
}

.ai-inbox-item:hover {
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(255, 255, 255, 0.06);
}

/* Accepting animation */
.ai-inbox-item--accepting {
  background: rgba(34, 197, 94, 0.12);
  border-color: rgba(34, 197, 94, 0.2);
  transform: scale(0.98);
}

/* Dismissing animation */
.ai-inbox-item--dismissing {
  background: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.15);
  opacity: 0.6;
  transform: scale(0.98);
}

.ai-inbox-view-all {
  align-self: flex-start;
  margin-top: var(--space-sm);
  padding: 4px 12px;
  border-radius: var(--radius-full);
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-out);
}

.ai-inbox-view-all:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-primary);
}

.ai-inbox-item__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ai-inbox-item__title {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.ai-inbox-item__reason {
  font-size: 11px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.ai-inbox-item__actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.ai-inbox-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.ai-inbox-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ai-inbox-btn:active:not(:disabled) {
  transform: scale(0.88);
}

/* Accept button */
.ai-inbox-btn--accept {
  background: rgba(34, 197, 94, 0.12);
  color: rgba(34, 197, 94, 0.8);
}

.ai-inbox-btn--accept:hover:not(:disabled) {
  background: rgba(34, 197, 94, 0.22);
  color: var(--color-green);
}

/* Dismiss button */
.ai-inbox-btn--dismiss {
  background: rgba(239, 68, 68, 0.08);
  color: rgba(239, 68, 68, 0.7);
}

.ai-inbox-btn--dismiss:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.16);
  color: var(--color-red);
}

/* Empty State */
.ai-inbox-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-lg) var(--space-md);
}

.ai-inbox-empty__icon-wrap {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  margin-bottom: var(--space-xs);
}

.ai-inbox-empty__icon {
  color: var(--text-secondary);
}

.ai-inbox-empty__title {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.ai-inbox-empty__text {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  text-align: center;
}
</style>
