<template>
  <TileCard class="day-summary" :interactive="false">
    <div class="day-summary__header">
      <div>
        <p class="day-summary__label">Today</p>
        <p class="day-summary__title">{{ greeting }}</p>
      </div>
      <span class="day-summary__time">{{ now }}</span>
    </div>
    <div class="day-summary__stats">
      <div class="day-summary__stat">
        <span class="day-summary__value">{{ tasksCompleted }}/{{ totalTasks }}</span>
        <span class="day-summary__hint">Tasks</span>
      </div>
      <div class="day-summary__stat">
        <span class="day-summary__value">{{ weeklyDistance }} km</span>
        <span class="day-summary__hint">This week</span>
      </div>
      <div class="day-summary__stat">
        <span class="day-summary__value">{{ weatherSummary }}</span>
        <span class="day-summary__hint">Outside</span>
      </div>
    </div>
  </TileCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import TileCard from './TileCard.vue'

interface Props {
  tasksCompleted: number
  totalTasks: number
  weeklyDistance: string | number
  weatherSummary?: string
}

withDefaults(defineProps<Props>(), {
  weatherSummary: '—',
})

const now = computed(() =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date())
)

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
})
</script>

<style scoped>
.day-summary {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-lg);
}

.day-summary__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.day-summary__label {
  margin: 0;
  font-size: var(--text-xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}

.day-summary__title {
  margin: 4px 0 0;
  font-size: var(--text-lg);
  color: var(--text-primary);
}

.day-summary__time {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.day-summary__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-md);
}

.day-summary__stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.day-summary__value {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-white);
}

.day-summary__hint {
  font-size: var(--text-xs);
  color: var(--text-secondary);
}
</style>
