<template>
  <div v-if="isVisible" class="spotify-bar" @click="handleClick">
    <template v-if="showUnavailable">
      <div class="spotify-bar__empty">
        <Music :size="40" />
        <p class="spotify-bar__empty-title">Spotify unavailable</p>
        <p class="spotify-bar__empty-copy">
          Connect a Spotify Developer app to enable playback controls.
        </p>
      </div>
    </template>
    <template v-else>
      <div class="spotify-bar__art">
        <img
          v-if="artSrc"
          :src="artSrc"
          :alt="album || 'Album cover'"
          class="spotify-bar__art-image"
          @error="handleArtError"
        />
        <div v-else class="spotify-bar__art-placeholder">
          <Music :size="28" :stroke-width="1.5" />
        </div>
      </div>

      <div class="spotify-bar__body">
        <!-- Track Info + Controls -->
        <div class="spotify-bar__row">
          <div class="spotify-bar__info">
            <span class="spotify-bar__label">Now Playing</span>
            <p class="spotify-bar__track">
              {{ hasTrack ? track : 'Nothing playing right now' }}
            </p>
            <p class="spotify-bar__artist">{{ hasTrack ? artist : 'Tap play on Spotify to begin' }}</p>
          </div>

          <div v-if="hasTrack" class="spotify-bar__controls">
            <IconButton :icon="SkipBack" size="sm" variant="ghost" @click.stop="$emit('previous')" />
            <button class="spotify-bar__play-btn" @click.stop="$emit('playPause')">
              <component :is="isPlaying ? Pause : Play" :size="18" :stroke-width="2" />
            </button>
            <IconButton :icon="SkipForward" size="sm" variant="ghost" @click.stop="$emit('next')" />
          </div>
        </div>

        <!-- Progress -->
        <div v-if="hasTrack" class="spotify-bar__progress">
          <div class="spotify-bar__progress-bar">
            <div class="spotify-bar__progress-fill" :style="{ width: `${progressPercent}%` }" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Music, Play, Pause, SkipBack, SkipForward } from 'lucide-vue-next'
import fallbackAlbumArt from '@renderer/assets/spotify-placeholder.svg'
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
  connected: boolean
}

const props = defineProps<Props>()

const artSrc = ref<string | null>(props.albumArt ?? null)

watch(
  () => props.albumArt,
  value => {
    artSrc.value = value ?? null
  }
)

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

const hasTrack = computed(() => Boolean(props.track))
const showUnavailable = computed(() => !props.connected)

function handleClick() {
  // Show toast about Premium requirement
}

function handleArtError(event: Event) {
  if (artSrc.value === fallbackAlbumArt) return
  artSrc.value = fallbackAlbumArt
  ;(event.target as HTMLImageElement).src = fallbackAlbumArt
}
</script>

<style scoped>
.spotify-bar {
  display: flex;
  gap: 12px;
  padding: 8px 12px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.05) 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-tile);
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out);
}

.spotify-bar:hover {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.08) 100%);
}

.spotify-bar__art {
  flex: 0 0 84px;
  width: 84px;
  height: 84px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.spotify-bar__art-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.spotify-bar__art-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.6);
  color: var(--text-tertiary);
}

.spotify-bar__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--space-sm);
  min-width: 0;
}

.spotify-bar__row {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.spotify-bar__info {
  flex: 1;
  min-width: 0;
}

.spotify-bar__empty {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  text-align: center;
  color: var(--text-secondary);
  padding: var(--space-md) 0;
}

.spotify-bar__empty-title {
  font-weight: var(--font-semibold);
  margin: 0;
  color: var(--text-primary);
}

.spotify-bar__empty-copy {
  margin: 0;
  max-width: 240px;
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.spotify-bar__label {
  display: block;
  font-size: var(--text-xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.55);
  margin-bottom: 4px;
}

.spotify-bar__track {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-white);
  margin: 0;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.01em;
}

.spotify-bar__artist {
  font-size: var(--text-sm);
  color: rgba(255, 255, 255, 0.7);
  margin: 2px 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.spotify-bar__controls {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
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
  width: 100%;
}

.spotify-bar__progress-bar {
  height: 3px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.spotify-bar__progress-fill {
  height: 100%;
  background: #1db954;
  border-radius: var(--radius-full);
  transition: width 1s linear;
}
</style>
