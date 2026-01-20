<template>
  <nav class="sidebar">
    <div class="sidebar__top">
      <!-- Logo -->
      <div class="sidebar__logo">
        <div class="sidebar__logo-icon">
          <LayoutDashboard :size="24" />
        </div>
      </div>

      <!-- Navigation Items -->
      <div class="sidebar__nav">
        <button
          v-for="item in navItems"
          :key="item.id"
          class="sidebar__item"
          :class="{ 'sidebar__item--active': currentRoute === item.id }"
          @click="$emit('navigate', item.id)"
        >
          <component :is="item.icon" :size="22" />
        </button>
      </div>
    </div>

    <div class="sidebar__bottom">
      <!-- Settings -->
      <button
        class="sidebar__item"
        :class="{ 'sidebar__item--active': currentRoute === 'settings' }"
        @click="$emit('navigate', 'settings')"
      >
        <Settings :size="22" />
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
  background: var(--glass-white-light);
  backdrop-filter: blur(var(--blur-subtle));
  -webkit-backdrop-filter: blur(var(--blur-subtle));
  border-right: 1px solid var(--border-light);
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
  width: 48px;
  height: 48px;
}

.sidebar__logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--color-blue) 0%, var(--color-teal) 100%);
  border-radius: var(--radius-button);
  color: var(--color-white);
}

.sidebar__nav {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
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
  width: 48px;
  height: 48px;
  background: transparent;
  border: none;
  border-radius: var(--radius-button);
  color: var(--text-tertiary);
  cursor: pointer;
  transition: 
    background-color var(--duration-fast) var(--ease-default),
    color var(--duration-fast) var(--ease-default);
  -webkit-tap-highlight-color: transparent;
}

.sidebar__item:hover {
  background: var(--glass-white);
  color: var(--text-primary);
}

.sidebar__item--active {
  background: var(--glass-white-medium);
  color: var(--color-blue);
}

.sidebar__item:active {
  transform: scale(0.95);
}
</style>
