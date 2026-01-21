<template>
  <div class="spotify-tile" :class="stateClass">
    <!-- State: Not Connected -->
    <template v-if="showUnavailable">
      <div class="spotify-tile__empty">
        <div class="spotify-tile__empty-icon">
          <Music :size="28" :stroke-width="1.5" />
        </div>
        <div class="spotify-tile__empty-text">
          <p class="spotify-tile__empty-title">Not connected</p>
          <p class="spotify-tile__empty-copy">Connect Spotify from Settings to see playback.</p>
        </div>
        <button class="spotify-tile__retry" type="button" @click="$emit('manage')">
          Open settings
        </button>
      </div>
    </template>

    <!-- State: Error -->
    <template v-else-if="!hasTrack">
      <div class="spotify-tile__empty">
        <div class="spotify-tile__empty-icon">
          <Music :size="28" :stroke-width="1.5" />
        </div>
        <div class="spotify-tile__empty-text">
          <p class="spotify-tile__empty-title">No playback detected</p>
          <p class="spotify-tile__empty-copy">Retry to refresh the current track.</p>
        </div>
        <button class="spotify-tile__retry" type="button" @click="$emit('retry')">Retry</button>
      </div>
    </template>

    <!-- State: Connected -->
    <template v-else>
      <!-- Top Row: Art + Track Info (aligned baseline) -->
      <div class="spotify-tile__main">
        <!-- Album Art - Fixed 72x72 -->
        <div class="spotify-tile__art">
          <img
            v-if="artSrc"
            :src="artSrc"
            :alt="album || 'Album cover'"
            class="spotify-tile__art-image"
            @error="handleArtError"
          />
          <div v-else class="spotify-tile__art-placeholder">
            <Music :size="24" :stroke-width="1.5" />
          </div>
          <div v-if="isPlaying" class="spotify-tile__art-indicator" />
        </div>

        <!-- Track Info - Vertically Centered -->
        <div class="spotify-tile__info">
          <span class="spotify-tile__label">Now Playing</span>
          <p class="spotify-tile__track">{{ track }}</p>
          <p class="spotify-tile__artist">{{ artist }}</p>
        </div>
      </div>

      <!-- Progress + Controls -->
      <div class="spotify-tile__playback">
        <div class="spotify-tile__progress">
          <div class="spotify-tile__progress-bar">
            <div class="spotify-tile__progress-fill" :style="{ width: `${progressPercent}%` }" />
          </div>
          <div class="spotify-tile__times">
            <span>{{ formatTime(progressMs) }}</span>
            <span>{{ formatTime(durationMs) }}</span>
          </div>
        </div>

        <div class="spotify-tile__controls">
          <button class="spotify-tile__btn" :disabled="!hasTrack" @click.stop="$emit('previous')">
            <SkipBack :size="14" :stroke-width="2" />
          </button>
          <button
            class="spotify-tile__play"
            :class="{ 'spotify-tile__play--active': isPlaying }"
            @click.stop="$emit('playPause')"
          >
            <component :is="isPlaying ? Pause : Play" :size="18" :stroke-width="2.5" />
          </button>
          <button class="spotify-tile__btn" :disabled="!hasTrack" @click.stop="$emit('next')">
            <SkipForward :size="14" :stroke-width="2" />
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Music, Play, Pause, SkipBack, SkipForward } from 'lucide-vue-next'
import fallbackAlbumArt from '@renderer/assets/spotify-placeholder.svg'

interface Props {
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
  retry: []
  manage: []
}>()

const progressPercent = computed(() => {
  if (props.durationMs === 0) return 0
  return (props.progressMs / props.durationMs) * 100
})

const hasTrack = computed(() => Boolean(props.track))
const showUnavailable = computed(() => !props.connected)

// State class for different visual states
const stateClass = computed(() => {
  if (!props.connected) return 'spotify-tile--disconnected'
  if (!hasTrack.value) return 'spotify-tile--error'
  if (props.isPlaying) return 'spotify-tile--playing'
  return 'spotify-tile--paused'
})

// Format milliseconds to mm:ss
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function handleArtError(event: Event) {
  if (artSrc.value === fallbackAlbumArt) return
  artSrc.value = fallbackAlbumArt
  ;(event.target as HTMLImageElement).src = fallbackAlbumArt
}
</script>

<style scoped>
/* Spotify Tile - Clean Layout */
.spotify-tile {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-tile);
  box-shadow:
    0 4px 18px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  transition: all var(--duration-normal) var(--ease-out);
}

.spotify-tile--playing {
  border-color: rgba(34, 197, 94, 0.22);
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.spotify-tile--paused {
  border-color: rgba(255, 255, 255, 0.06);
}

.spotify-tile--error {
  border-style: dashed;
  opacity: 0.9;
}

.spotify-tile--disconnected {
  opacity: 0.85;
}

/* Main Row: Art + Info */
.spotify-tile__main {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

/* Album Art - Fixed 72x72 */
.spotify-tile__art {
  position: relative;
  flex: 0 0 88px;
  width: 88px;
  height: 88px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.28);
}

.spotify-tile__art-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.spotify-tile__art-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(30, 41, 59, 0.8);
  color: var(--text-tertiary);
}

/* Playing indicator dot */
.spotify-tile__art-indicator {
  position: absolute;
  bottom: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  background: #1db954;
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(29, 185, 84, 0.6);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.15);
  }
}

/* Track Info - Vertically Centered */
.spotify-tile__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  gap: 4px;
}

.spotify-tile__label {
  font-size: 11px;
  font-weight: var(--font-semibold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}

.spotify-tile__track {
  font-size: 20px;
  font-weight: var(--font-semibold);
  color: var(--color-white);
  margin: 0;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.spotify-tile__artist {
  font-size: 13px;
  color: var(--text-tertiary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Progress Bar */
.spotify-tile__playback {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.spotify-tile__progress {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.spotify-tile__progress-bar {
  height: 2px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.spotify-tile__progress-fill {
  height: 100%;
  background: #22c55e;
  border-radius: var(--radius-full);
  transition: width 1s ease-out;
}

.spotify-tile__times {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
}

/* Controls Row */
.spotify-tile__controls {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.spotify-tile__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.spotify-tile__btn:hover:not(:disabled) {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.08);
}

.spotify-tile__btn:active:not(:disabled) {
  transform: scale(0.92);
}

.spotify-tile__btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Play/Pause Button */
.spotify-tile__play {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: var(--color-white);
  border: none;
  border-radius: 50%;
  color: #000;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
  transition: all var(--duration-fast) var(--ease-out);
}

.spotify-tile__play:hover {
  transform: scale(1.06);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
}

.spotify-tile__play:active {
  transform: scale(0.95);
}

.spotify-tile__play--active {
  background: #1db954;
  color: var(--color-white);
}

/* Empty State */
.spotify-tile__empty {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) 0;
  width: 100%;
  justify-content: space-between;
}

.spotify-tile__empty-icon {
  flex: 0 0 56px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  color: var(--text-tertiary);
}

.spotify-tile__empty-text {
  flex: 1;
  min-width: 0;
}

.spotify-tile__empty-title {
  font-size: 15px;
  font-weight: var(--font-semibold);
  margin: 0;
  color: var(--text-primary);
}

.spotify-tile__empty-copy {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--text-tertiary);
}

.spotify-tile__retry {
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-primary);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  padding: 6px 12px;
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-out);
}

.spotify-tile__retry:hover {
  background: rgba(255, 255, 255, 0.1);
}
</style>
