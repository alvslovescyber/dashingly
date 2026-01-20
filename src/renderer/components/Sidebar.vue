<template>
  <nav class="sidebar">
    <div class="sidebar__top">
      <!-- Logo -->
      <div class="sidebar__logo">
        <div class="sidebar__logo-icon">
          <LayoutDashboard :size="22" :stroke-width="2" />
        </div>
      </div>

      <!-- Navigation Items -->
      <div class="sidebar__nav">
        <button
          v-for="item in navItems"
          :key="item.id"
          class="sidebar__item"
          :class="{ 'sidebar__item--active': currentRoute === item.id }"
          :title="item.label"
          @click="$emit('navigate', item.id)"
        >
          <component :is="item.icon" :size="20" :stroke-width="1.75" />
        </button>
      </div>
    </div>

    <div class="sidebar__bottom">
      <button
        class="sidebar__item"
        :class="{ 'sidebar__item--active': currentRoute === 'settings' }"
        title="Settings"
        @click="$emit('navigate', 'settings')"
      >
        <Settings :size="20" :stroke-width="1.75" />
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import {
  LayoutDashboard,
  Home,
  ListChecks,
  Activity,
  Heart,
  BookOpen,
  Music,
  Settings,
} from 'lucide-vue-next'

interface Props {
  currentRoute: string
}

defineProps<Props>()

defineEmits<{
  navigate: [route: string]
}>()

const navItems = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'tasks', icon: ListChecks, label: 'Tasks' },
  { id: 'activity', icon: Activity, label: 'Activity' },
  { id: 'health', icon: Heart, label: 'Health' },
  { id: 'bible', icon: BookOpen, label: 'Bible' },
  { id: 'music', icon: Music, label: 'Music' },
]
</script>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: var(--sidebar-width);
  height: 100%;
  /* Subtle transparency, letting shell background show */
  background: var(--glass-sidebar);
  border-right: var(--border-shell);
  padding: var(--space-md) var(--space-sm);
}

.sidebar__top {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-lg);
}

.sidebar__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
}

.sidebar__logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  background: linear-gradient(135deg, var(--color-blue) 0%, #1d7cf2 100%);
  border-radius: 10px;
  color: var(--color-white);
  box-shadow:
    0 4px 12px rgba(59, 130, 246, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.sidebar__nav {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.sidebar__bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.sidebar__item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: transparent;
  border: none;
  border-radius: var(--radius-button);
  /* Inactive = dimmer */
  color: rgba(255, 255, 255, 0.45);
  cursor: pointer;
  transition: all 0.2s ease-out;
}

.sidebar__item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

/* ACTIVE = brighter + background pill + glow */
.sidebar__item--active {
  background: var(--glass-active);
  color: var(--color-blue-light);
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.15);
}

.sidebar__item:active {
  transform: scale(0.94);
}
</style>
