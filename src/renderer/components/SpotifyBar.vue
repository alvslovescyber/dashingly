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
        <Music :size="24" />
      </div>
    </div>

    <!-- Track Info -->
    <div class="spotify-bar__info">
      <p class="spotify-bar__track">{{ track }}</p>
      <p class="spotify-bar__artist">{{ artist }}</p>
    </div>

    <!-- Controls -->
    <div class="spotify-bar__controls">
      <IconButton
        :icon="SkipBack"
        size="sm"
        variant="ghost"
        @click.stop="$emit('previous')"
      />
      <IconButton
        :icon="isPlaying ? Pause : Play"
        size="md"
        variant="glass"
        @click.stop="$emit('playPause')"
      />
      <IconButton
        :icon="SkipForward"
        size="sm"
        variant="ghost"
        @click.stop="$emit('next')"
      />
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
  // Note: Without Premium, this will just show a toast
  // explaining that controls require Premium
}
</script>

<style scoped>
.spotify-bar {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  background: var(--glass-white);
  backdrop-filter: blur(var(--blur-glass));
  -webkit-backdrop-filter: blur(var(--blur-glass));
  border: 1px solid var(--border-light);
  border-radius: var(--radius-tile);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-default);
}

.spotify-bar:hover {
  background: var(--glass-white-medium);
}

/* Album Art */
.spotify-bar__art {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  flex-shrink: 0;
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
  background: var(--glass-dark);
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
}

.spotify-bar__artist {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  margin: var(--space-xs) 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Controls */
.spotify-bar__controls {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

/* Progress */
.spotify-bar__progress {
  width: 100px;
  flex-shrink: 0;
}

.spotify-bar__progress-bar {
  height: 4px;
  background: var(--glass-dark);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.spotify-bar__progress-fill {
  height: 100%;
  background: var(--color-green);
  border-radius: var(--radius-full);
  transition: width 1s linear;
}
</style>
