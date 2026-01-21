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

  const todayIndex = computed(() => {
    const verseIndex = versesData.verses.findIndex(v => v.date === todayKey.value)
    if (verseIndex !== -1) return verseIndex

    // Fallback: use index based on day of year
    const startOfYear = new Date(new Date().getFullYear(), 0, 0).getTime()
    const dayOfYear = Math.floor((Date.now() - startOfYear) / 86400000)
    return dayOfYear % versesData.verses.length
  })

  // Find verse for today
  const todayVerse = computed<Verse>(() => {
    return versesData.verses[todayIndex.value] as Verse
  })

  const reference = computed(() => todayVerse.value.reference)
  const text = computed(() => todayVerse.value.text)

  const history = computed<Verse[]>(() => {
    return Array.from({ length: 3 }, (_, offset) => {
      const index =
        (todayIndex.value - offset - 1 + versesData.verses.length) % versesData.verses.length
      return versesData.verses[index] as Verse
    })
  })

  function markDone() {
    completed.value = !completed.value
  }

  return {
    reference,
    text,
    completed,
    markDone,
    source: versesData.source,
    history,
  }
}
