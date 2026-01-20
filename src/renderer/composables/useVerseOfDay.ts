import { ref, computed } from 'vue'
import versesData from '../assets/data/verses_of_day.json'

export interface Verse {
  date: string
  reference: string
  text: string
}

export interface VerseOfDayState {
  reference: string
  text: string
  completed: boolean
}

/**
 * Composable for accessing verse of the day
 * Uses World English Bible (WEB) - Public Domain
 */
export function useVerseOfDay() {
  const completed = ref(false)

  // Get today's date in MM-DD format
  const todayKey = computed(() => {
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${month}-${day}`
  })

  // Find verse for today, or use a fallback
  const todayVerse = computed<Verse>(() => {
    const verse = versesData.verses.find(v => v.date === todayKey.value)
    if (verse) return verse

    // Fallback: use index based on day of year
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    )
    const index = dayOfYear % versesData.verses.length
    // Guaranteed to have at least one verse in the data file
    return versesData.verses[index] as Verse
  })

  const reference = computed(() => todayVerse.value.reference)
  const text = computed(() => todayVerse.value.text)

  function markDone() {
    completed.value = !completed.value
  }

  return {
    reference,
    text,
    completed,
    markDone,
    source: versesData.source,
  }
}
