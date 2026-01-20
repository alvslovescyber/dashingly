<template>
  <div v-if="isVisible" class="spotify-bar" @click="handleClick">
    <!-- Album Art -->
    <div class="spotify-bar__art">
      <img
        v-if="albumArt"
        :src="albumArt"
        :alt="album"
        class="spotify-bar__art-image"
      />
      <div v-else class="spotify-bar__art-placeholder">
        <Music :size="20" :stroke-width="1.5" />
      </div>
    </div>

    <!-- Track Info -->
    <div class="spotify-bar__info">
      <p class="spotify-bar__track">{{ track }}</p>
      <p class="spotify-bar__artist">{{ artist }}</p>
    </div>

    <!-- Controls -->
    <div class="spotify-bar__controls">
      <IconButton :icon="SkipBack" size="sm" variant="ghost" @click.stop="$emit('previous')" />
      <button class="spotify-bar__play-btn" @click.stop="$emit('playPause')">
        <component :is="isPlaying ? Pause : Play" :size="18" :stroke-width="2" />
      </button>
      <IconButton :icon="SkipForward" size="sm" variant="ghost" @click.stop="$emit('next')" />
    </div>

    <!-- Progress -->
    <div class="spotify-bar__progress">
      <div class="spotify-bar__progress-bar">
        <div
          class="spotify-bar__progress-fill"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Music, Play, Pause, SkipBack, SkipForward } from 'lucide-vue-next'
import IconButton from './IconButton.vue'

interface Props {
  isVisible: boolean
  isPlaying: boolean
  track: string
  artist: string
  album?: string
  albumArt?: string
  progressMs: number
  durationMs: number
}

const props = defineProps<Props>()

defineEmits<{
  click: []
  playPause: []
  previous: []
  next: []
}>()

const progressPercent = computed(() => {
  if (props.durationMs === 0) return 0
  return (props.progressMs / props.durationMs) * 100
})

function handleClick() {
  // Show toast about Premium requirement
}
</script>

<style scoped>
.spotify-bar {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: 10px 14px;
  /* Gradient tile style */
  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.12) 0%,
    rgba(255, 255, 255, 0.06) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-tile);
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out);
}

.spotify-bar:hover {
  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.15) 0%,
    rgba(255, 255, 255, 0.08) 100%
  );
}

/* Album Art */
.spotify-bar__art {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.spotify-bar__art-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.spotify-bar__art-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  color: var(--text-tertiary);
}

/* Track Info */
.spotify-bar__info {
  flex: 1;
  min-width: 0;
}

.spotify-bar__track {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.01em;
}

.spotify-bar__artist {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin: 2px 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Controls */
.spotify-bar__controls {
  display: flex;
  align-items: center;
  gap: 2px;
}

.spotify-bar__play-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--color-white);
  border: none;
  border-radius: 50%;
  color: #000;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: transform var(--duration-fast) var(--ease-out);
}

.spotify-bar__play-btn:hover {
  transform: scale(1.05);
}

.spotify-bar__play-btn:active {
  transform: scale(0.95);
}

/* Progress */
.spotify-bar__progress {
  width: 80px;
  flex-shrink: 0;
}

.spotify-bar__progress-bar {
  height: 3px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.spotify-bar__progress-fill {
  height: 100%;
  background: #1DB954;
  border-radius: var(--radius-full);
  transition: width 1s linear;
}
</style>
