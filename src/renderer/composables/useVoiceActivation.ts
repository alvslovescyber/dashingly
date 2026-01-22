/**
 * Voice Activation Composable
 * Listens for wake word "hey alvis" using Web Speech API
 */

import { ref, onMounted, onUnmounted } from 'vue'

// Type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null
  onend: ((this: SpeechRecognition, ev: Event) => void) | null
  onerror: ((this: SpeechRecognition, ev: Event & { error: string }) => void) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

export interface VoiceActivationOptions {
  wakeWord?: string
  onWake?: () => void
  enabled?: boolean
}

export function useVoiceActivation(options: VoiceActivationOptions = {}) {
  const { wakeWord = 'hey alvis', onWake, enabled = true } = options

  const isSupported = ref(false)
  const isListening = ref(false)
  const lastHeard = ref<string>('')
  const error = ref<string | null>(null)

  let recognition: SpeechRecognition | null = null
  let restartTimeout: ReturnType<typeof setTimeout> | null = null

  // Wake word variations to match
  const wakeWordVariations = [
    wakeWord.toLowerCase(),
    'hey elvis', // Common misheard
    'a alvis',
    'hey alice',
    'hey alvie',
    'hey albus',
  ]

  function checkForWakeWord(transcript: string): boolean {
    const lower = transcript.toLowerCase().trim()
    return wakeWordVariations.some(variation => lower.includes(variation))
  }

  function initRecognition() {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognitionAPI) {
      console.warn('Speech Recognition API not supported')
      isSupported.value = false
      return
    }

    isSupported.value = true
    recognition = new SpeechRecognitionAPI()

    // Configure for continuous listening
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      isListening.value = true
      error.value = null
      console.log('Voice activation listening...')
    }

    recognition.onend = () => {
      isListening.value = false
      console.log('Voice activation stopped')

      // Auto-restart if still enabled
      if (enabled) {
        restartTimeout = setTimeout(() => {
          startListening()
        }, 1000)
      }
    }

    recognition.onerror = event => {
      const err = event.error
      console.warn('Voice activation error:', err)

      // Don't show error for "no-speech" - that's normal
      if (err !== 'no-speech' && err !== 'aborted') {
        error.value = err
      }

      // Restart on recoverable errors
      if (err === 'network' || err === 'audio-capture') {
        isListening.value = false
        restartTimeout = setTimeout(() => {
          startListening()
        }, 3000)
      }
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = event.results
      const latestResult = results[results.length - 1]

      if (latestResult && latestResult[0]) {
        const transcript = latestResult[0].transcript
        lastHeard.value = transcript

        if (checkForWakeWord(transcript)) {
          console.log('Wake word detected:', transcript)
          onWake?.()
        }
      }
    }
  }

  function startListening() {
    if (!recognition || !enabled) return

    try {
      recognition.start()
    } catch (err) {
      // May already be running
      console.warn('Could not start recognition:', err)
    }
  }

  function stopListening() {
    if (restartTimeout) {
      clearTimeout(restartTimeout)
      restartTimeout = null
    }

    if (recognition) {
      try {
        recognition.stop()
      } catch {
        // May already be stopped
      }
    }

    isListening.value = false
  }

  function toggle() {
    if (isListening.value) {
      stopListening()
    } else {
      startListening()
    }
  }

  onMounted(() => {
    if (enabled) {
      initRecognition()
      // Delay start slightly to let the app settle
      setTimeout(() => {
        startListening()
      }, 2000)
    }
  })

  onUnmounted(() => {
    stopListening()
    recognition = null
  })

  return {
    isSupported,
    isListening,
    lastHeard,
    error,
    startListening,
    stopListening,
    toggle,
  }
}
