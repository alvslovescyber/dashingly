<template>
  <TileCard title="AI Inbox" :icon="Sparkles" class="ai-inbox-tile" size="md" :interactive="false">
    <template #headerRight>
      <span class="ai-inbox-count">
        {{ suggestions.length > 0 ? `${suggestions.length} suggestions` : 'No suggestions' }}
      </span>
    </template>

    <div class="ai-inbox-content">
      <!-- Suggestions List -->
      <div v-if="suggestions.length > 0" class="ai-inbox-list">
        <div v-for="suggestion in displayedSuggestions" :key="suggestion.id" class="ai-inbox-item">
          <div class="ai-inbox-item__content">
            <span class="ai-inbox-item__title">{{ suggestion.title }}</span>
            <span class="ai-inbox-item__reason">{{ truncateReason(suggestion.reason) }}</span>
          </div>
          <div class="ai-inbox-item__actions">
            <button class="ai-inbox-btn ai-inbox-btn--accept" @click="handleAccept(suggestion.id)">
              <Check :size="12" />
            </button>
            <button
              class="ai-inbox-btn ai-inbox-btn--dismiss"
              @click="handleDismiss(suggestion.id)"
            >
              <X :size="12" />
            </button>
          </div>
        </div>
        <button
          v-if="suggestions.length > displayedSuggestions.length"
          class="ai-inbox-view-all"
          type="button"
          @click="handleViewAll"
        >
          View all
        </button>
      </div>

      <!-- Empty State -->
      <div v-else class="ai-inbox-empty">
        <Clock :size="24" class="ai-inbox-empty__icon" />
        <span class="ai-inbox-empty__title">No suggestions right now</span>
        <span class="ai-inbox-empty__text">Next check at {{ nextSuggestionTime }}</span>
      </div>
    </div>
  </TileCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Sparkles, Check, X, Clock } from 'lucide-vue-next'
import TileCard from '../TileCard.vue'

export interface AISuggestion {
  id: string
  title: string
  reason: string
}

interface Props {
  suggestions: AISuggestion[]
  nextSuggestionTime?: string
}

const props = withDefaults(defineProps<Props>(), {
  suggestions: () => [],
  nextSuggestionTime: '12:00',
})

const emit = defineEmits<{
  accept: [id: string]
  dismiss: [id: string]
  viewAll: []
}>()

// Show max 3 suggestions
const displayedSuggestions = computed(() => props.suggestions.slice(0, 3))

function truncateReason(reason: string, maxLength = 50): string {
  if (reason.length <= maxLength) return reason
  return reason.slice(0, maxLength).trim() + '...'
}

function handleAccept(id: string) {
  emit('accept', id)
}

function handleDismiss(id: string) {
  emit('dismiss', id)
}

function handleViewAll() {
  emit('viewAll')
}
</script>

<style scoped>
.ai-inbox-tile {
  min-height: 140px;
}

.ai-inbox-count {
  font-size: var(--text-xs);
  color: var(--text-muted);
  opacity: 0.6;
}

.ai-inbox-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.ai-inbox-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.ai-inbox-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  padding: var(--space-sm);
  background: rgba(255, 255, 255, 0.04);
  border-radius: var(--radius-sm);
  transition: background-color var(--duration-fast) var(--ease-out);
}

.ai-inbox-view-all {
  margin-left: auto;
  margin-top: var(--space-xs);
  padding: 4px 10px;
  border-radius: var(--radius-chip);
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  font-size: var(--text-xs);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-out);
}

.ai-inbox-view-all:hover {
  background: rgba(255, 255, 255, 0.08);
}

.ai-inbox-item:hover {
  background: rgba(255, 255, 255, 0.08);
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
}

.ai-inbox-item__reason {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ai-inbox-item__actions {
  display: flex;
  gap: var(--space-xs);
  flex-shrink: 0;
}

.ai-inbox-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.ai-inbox-btn:active {
  transform: scale(0.92);
}

/* Desaturated colors so buttons don't steal attention from task titles */
.ai-inbox-btn--accept {
  background: rgba(34, 197, 94, 0.1);
  color: rgba(34, 197, 94, 0.75);
}

.ai-inbox-btn--accept:hover {
  background: rgba(34, 197, 94, 0.18);
  color: var(--color-green);
}

.ai-inbox-btn--dismiss {
  background: rgba(239, 68, 68, 0.08);
  color: rgba(239, 68, 68, 0.7);
}

.ai-inbox-btn--dismiss:hover {
  background: rgba(239, 68, 68, 0.15);
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
  padding: var(--space-md);
}

.ai-inbox-empty__icon {
  color: var(--text-muted);
}

.ai-inbox-empty__title {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
}

.ai-inbox-empty__text {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  text-align: center;
}
</style>
