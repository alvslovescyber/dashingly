<template>
  <header class="top-bar">
    <!-- Left: Greeting -->
    <div class="top-bar__left">
      <h1 class="top-bar__greeting">Welcome, {{ displayName }}</h1>
    </div>

    <!-- Center: Search -->
    <div class="top-bar__center">
      <div class="top-bar__search">
        <Search :size="16" class="top-bar__search-icon" />
        <span class="top-bar__search-placeholder">Search Here</span>
      </div>
    </div>

    <!-- Right: Actions -->
    <div class="top-bar__right">
      <IconButton
        :icon="Mic"
        size="md"
        variant="ghost"
      />
      <IconButton
        :icon="Settings"
        size="md"
        variant="ghost"
        @click="$emit('openSettings')"
      />
      <div class="top-bar__avatar">
        <User :size="20" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Search, Mic, Settings, User } from 'lucide-vue-next'
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
}

.top-bar__center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.top-bar__search {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  width: 240px;
  height: 40px;
  padding: 0 var(--space-md);
  background: var(--glass-white);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-default);
}

.top-bar__search:hover {
  background: var(--glass-white-medium);
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
  gap: var(--space-sm);
}

.top-bar__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--glass-white-medium);
  border: 1px solid var(--border-light);
  border-radius: 50%;
  color: var(--text-secondary);
  overflow: hidden;
}
</style>
