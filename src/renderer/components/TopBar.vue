<template>
  <header class="top-bar">
    <!-- Left: Greeting -->
    <div class="top-bar__left">
      <h1 class="top-bar__greeting">Welcome, {{ displayName }}</h1>
    </div>

    <!-- Center: Search or custom slot content -->
    <div class="top-bar__center">
      <slot name="center">
        <div class="top-bar__search">
          <Search :size="15" :stroke-width="2" class="top-bar__search-icon" />
          <span class="top-bar__search-placeholder">Search Here</span>
        </div>
      </slot>
    </div>

    <!-- Right: Actions -->
    <div class="top-bar__right">
      <IconButton :icon="Mic" size="md" variant="ghost" />
      <IconButton
        :icon="SettingsIcon"
        size="md"
        variant="ghost"
        @click="$emit('openSettings')"
      />

      <div class="top-bar__avatar">
        <User :size="18" :stroke-width="1.75" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Search, Mic, User, Settings as SettingsIcon } from 'lucide-vue-next'
import IconButton from './IconButton.vue'

interface Props {
  displayName: string
}

defineProps<Props>()

defineEmits<{
  openSettings: []
}>()
</script>

<style scoped>
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--topbar-height);
  padding: 0 var(--space-lg);
}

.top-bar__left {
  flex: 1;
}

.top-bar__greeting {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.02em;
}

.top-bar__center {
  flex: 1;
  display: flex;
  justify-content: center;
}

/* Search bar = pill CUT into glass */
.top-bar__search {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 220px;
  height: 38px;
  padding: 0 14px;
  /* Inset appearance */
  background: rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-inset-pill);
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out);
}

.top-bar__search:hover {
  background: rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.12);
}

.top-bar__search-icon {
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.top-bar__search-placeholder {
  color: var(--text-tertiary);
  font-size: var(--text-sm);
}

.top-bar__right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}

.top-bar__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  margin-left: 6px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  color: var(--text-secondary);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}
</style>
