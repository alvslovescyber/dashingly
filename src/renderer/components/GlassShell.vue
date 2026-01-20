<template>
  <div class="glass-shell">
    <slot />
  </div>
</template>

<script setup lang="ts">
// GlassShell - Main container with CONTROLLED blur
// This is the ONLY element that should have heavy backdrop blur
</script>

<style scoped>
.glass-shell {
  position: relative;
  width: 100%;
  height: 100%;
  /* Subtle glass effect - BLURRED SHELL ONLY */
  background: var(--glass-shell);
  backdrop-filter: blur(18px) saturate(120%);
  -webkit-backdrop-filter: blur(18px) saturate(120%);
  border-radius: var(--radius-glass);
  border: var(--border-shell);
  /* Machined glass: outer shadow + inner top highlight */
  box-shadow:
    var(--shadow-shell),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  overflow: hidden;
}

/* Top edge highlight for depth */
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
    rgba(255, 255, 255, 0.3) 20%,
    rgba(255, 255, 255, 0.3) 80%,
    transparent 100%
  );
  pointer-events: none;
}
</style>
