/**
 * Notification Sound Utility
 * Uses Web Audio API to generate pleasant notification sounds
 */

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    )()
  }
  return audioContext
}

/**
 * Play a pleasant notification "ting" sound
 * Inspired by Apple's notification sounds
 */
export function playNotificationSound(volume = 0.3): void {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime

    // Create oscillators for a pleasant bell-like tone
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gainNode = ctx.createGain()

    // Connect nodes
    osc1.connect(gainNode)
    osc2.connect(gainNode)
    gainNode.connect(ctx.destination)

    // Set frequencies for a pleasant major chord feel
    osc1.frequency.setValueAtTime(880, now) // A5
    osc2.frequency.setValueAtTime(1108.73, now) // C#6 (major third above)

    // Use sine waves for a soft, clean sound
    osc1.type = 'sine'
    osc2.type = 'sine'

    // Volume envelope - quick attack, medium decay
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.01) // Quick attack
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4) // Decay

    // Start and stop
    osc1.start(now)
    osc2.start(now)
    osc1.stop(now + 0.5)
    osc2.stop(now + 0.5)
  } catch (error) {
    console.warn('Could not play notification sound:', error)
  }
}

/**
 * Play a softer, more subtle notification sound
 */
export function playSoftNotification(volume = 0.2): void {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()

    osc.connect(gainNode)
    gainNode.connect(ctx.destination)

    // Single high note for subtlety
    osc.frequency.setValueAtTime(1318.51, now) // E6
    osc.type = 'sine'

    // Very quick, gentle envelope
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.005)
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2)

    osc.start(now)
    osc.stop(now + 0.25)
  } catch (error) {
    console.warn('Could not play notification sound:', error)
  }
}

/**
 * Play success sound (two ascending notes)
 */
export function playSuccessSound(volume = 0.25): void {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime

    // First note
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.frequency.setValueAtTime(523.25, now) // C5
    osc1.type = 'sine'
    gain1.gain.setValueAtTime(0, now)
    gain1.gain.linearRampToValueAtTime(volume, now + 0.01)
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15)
    osc1.start(now)
    osc1.stop(now + 0.2)

    // Second note (higher)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.frequency.setValueAtTime(659.25, now + 0.1) // E5
    osc2.type = 'sine'
    gain2.gain.setValueAtTime(0, now + 0.1)
    gain2.gain.linearRampToValueAtTime(volume, now + 0.11)
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.35)
    osc2.start(now + 0.1)
    osc2.stop(now + 0.4)
  } catch (error) {
    console.warn('Could not play success sound:', error)
  }
}

/**
 * Initialize audio context on user interaction
 * Call this on first user interaction to enable sounds
 */
export function initAudio(): void {
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') {
      ctx.resume()
    }
  } catch (error) {
    console.warn('Could not initialize audio:', error)
  }
}
