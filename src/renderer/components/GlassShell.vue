<template>
  <div
    class="glass-shell"
    :style="shellStyle"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  blur?: 'subtle' | 'glass' | 'strong'
  opacity?: 'light' | 'medium' | 'strong'
  rounded?: 'md' | 'lg' | 'xl' | 'glass'
  border?: boolean
  shadow?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}

const props = withDefaults(defineProps<Props>(), {
  blur: 'glass',
  opacity: 'medium',
  rounded: 'glass',
  border: true,
  shadow: true,
  padding: 'lg',
})

const shellStyle = computed(() => {
  const blurMap = {
    subtle: 'var(--blur-subtle)',
    glass: 'var(--blur-glass)',
    strong: 'var(--blur-strong)',
  }

  const opacityMap = {
    light: 'var(--glass-white-light)',
    medium: 'var(--glass-white)',
    strong: 'var(--glass-white-medium)',
  }

  const radiusMap = {
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
    xl: 'var(--radius-xl)',
    glass: 'var(--radius-glass)',
  }

  const paddingMap = {
    none: '0',
    sm: 'var(--space-sm)',
    md: 'var(--space-md)',
    lg: 'var(--space-lg)',
    xl: 'var(--space-xl)',
  }

  return {
    background: opacityMap[props.opacity],
    backdropFilter: `blur(${blurMap[props.blur]})`,
    WebkitBackdropFilter: `blur(${blurMap[props.blur]})`,
    borderRadius: radiusMap[props.rounded],
    border: props.border ? '1px solid var(--border-light)' : 'none',
    boxShadow: props.shadow ? 'var(--shadow-glass)' : 'none',
    padding: paddingMap[props.padding],
  }
})
</script>

<style scoped>
.glass-shell {
  position: relative;
  overflow: hidden;
}

/* Inner glow effect */
.glass-shell::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.2) 50%,
    transparent 100%
  );
  pointer-events: none;
}
</style>
