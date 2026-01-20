import { getDatabase, setSetting } from './database'
import { getTodayLogicalDay, addDays } from '../../shared/utils/logical-day'
import { randomUUID } from 'node:crypto'

/**
 * Seed the database with realistic demo data
 * Run via: npx tsx src/main/db/seed.ts
 */
export function seedDatabase(): void {
  const db = getDatabase()
  const today = getTodayLogicalDay()

  console.log('Seeding database...')
  console.log('Today logical day:', today)

  // Clear existing data
  db.exec(`
    DELETE FROM tasks;
    DELETE FROM task_completions;
    DELETE FROM task_suggestions;
    DELETE FROM strava_activities;
    DELETE FROM strava_daily_agg;
    DELETE FROM health_snapshots;
    DELETE FROM bible_plan;
    DELETE FROM bible_completions;
    DELETE FROM spotify_now_playing;
    DELETE FROM sync_status;
  `)

  // Set user config
  setSetting('displayName', 'Alvaro')
  setSetting('timezone', 'America/New_York')
  setSetting('strava_connected', true)
  setSetting('strava_weekly_target', 30) // 30km weekly goal
  setSetting('spotify_connected', true)
  setSetting('bible_plan_start', today)

  // ============================================
  // Tasks
  // ============================================
  const tasks = [
    { id: randomUUID(), title: 'Morning Prayer', type: 'daily' },
    { id: randomUUID(), title: 'Read Scripture', type: 'daily' },
    { id: randomUUID(), title: 'Exercise', type: 'daily' },
    { id: randomUUID(), title: 'Review Goals', type: 'daily' },
    { id: randomUUID(), title: 'Evening Reflection', type: 'daily' },
    { id: randomUUID(), title: 'Call Mom', type: 'oneoff' },
    { id: randomUUID(), title: 'Schedule Dentist', type: 'oneoff' },
  ]

  const insertTask = db.prepare(`
    INSERT INTO tasks (id, title, type, is_active, created_at)
    VALUES (?, ?, ?, 1, ?)
  `)

  for (const task of tasks) {
    insertTask.run(task.id, task.title, task.type, Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
  }

  // Task completions for today (some completed)
  const insertCompletion = db.prepare(`
    INSERT INTO task_completions (id, task_id, completion_day, completed_at)
    VALUES (?, ?, ?, ?)
  `)

  // Complete first 3 daily tasks
  for (let i = 0; i < 3; i++) {
    const task = tasks[i]
    if (task) {
      insertCompletion.run(randomUUID(), task.id, today, Date.now() - (3 - i) * 60 * 60 * 1000)
    }
  }

  console.log(`Seeded ${tasks.length} tasks, 3 completions for today`)

  // ============================================
  // AI Suggestions
  // ============================================
  const suggestions = [
    { title: 'Go for a 5K run', reason: 'You ran 3K yesterday. Push a bit further today!' },
    { title: 'Call your brother', reason: "It's been 2 weeks since your last call." },
    { title: 'Review monthly budget', reason: "End of month is approaching." },
  ]

  const insertSuggestion = db.prepare(`
    INSERT INTO task_suggestions (id, logical_day, title, reason, source, status, created_at)
    VALUES (?, ?, ?, ?, 'ai', 'pending', ?)
  `)

  for (const suggestion of suggestions) {
    insertSuggestion.run(randomUUID(), today, suggestion.title, suggestion.reason, Date.now())
  }

  console.log(`Seeded ${suggestions.length} AI suggestions`)

  // ============================================
  // Strava Weekly Data
  // ============================================
  const insertStravaAgg = db.prepare(`
    INSERT OR REPLACE INTO strava_daily_agg (day, distance_m, run_count, moving_time_s)
    VALUES (?, ?, ?, ?)
  `)

  // Generate last 7 days of running data
  const weeklyDistances = [5200, 0, 7800, 6100, 0, 8500, 4200] // meters per day
  for (let i = 6; i >= 0; i--) {
    const day = addDays(today, -i)
    const distance = weeklyDistances[6 - i] ?? 0
    const runCount = distance > 0 ? 1 : 0
    const movingTime = distance > 0 ? Math.round(distance / 2.5) : 0 // ~9 min/km pace
    insertStravaAgg.run(day, distance, runCount, movingTime)
  }

  setSetting('strava_last_sync', Date.now())

  console.log('Seeded Strava weekly data')

  // ============================================
  // Health Snapshot
  // ============================================
  const insertHealth = db.prepare(`
    INSERT INTO health_snapshots (ts, steps, active_cals, sleep_minutes)
    VALUES (?, ?, ?, ?)
  `)

  // Today's health data
  insertHealth.run(
    Date.now(),
    7842, // steps
    342, // active calories
    412 // sleep minutes (~6.9 hours)
  )

  console.log('Seeded health snapshot')

  // ============================================
  // Bible Plan
  // ============================================
  const bibleReadings = [
    { dayIndex: 0, reference: 'Psalm 23:1-6', title: 'The Lord is My Shepherd' },
    { dayIndex: 1, reference: 'John 3:16-21', title: 'For God So Loved the World' },
    { dayIndex: 2, reference: 'Romans 8:28-39', title: 'More Than Conquerors' },
    { dayIndex: 3, reference: 'Philippians 4:4-9', title: 'Rejoice in the Lord' },
    { dayIndex: 4, reference: 'Matthew 5:1-12', title: 'The Beatitudes' },
    { dayIndex: 5, reference: 'Isaiah 40:28-31', title: 'They Shall Mount Up' },
    { dayIndex: 6, reference: 'Proverbs 3:5-6', title: 'Trust in the Lord' },
    { dayIndex: 7, reference: '1 Corinthians 13:1-13', title: 'The Greatest is Love' },
    { dayIndex: 8, reference: 'Ephesians 6:10-18', title: 'The Armor of God' },
    { dayIndex: 9, reference: 'James 1:2-8', title: 'Count It All Joy' },
  ]

  const insertBible = db.prepare(`
    INSERT INTO bible_plan (day_index, reference, source, title)
    VALUES (?, ?, 'NIV', ?)
  `)

  for (const reading of bibleReadings) {
    insertBible.run(reading.dayIndex, reading.reference, reading.title)
  }

  console.log(`Seeded ${bibleReadings.length} bible readings`)

  // ============================================
  // Spotify Now Playing
  // ============================================
  const insertSpotify = db.prepare(`
    INSERT INTO spotify_now_playing (ts, is_playing, track, artist, album, album_art_url, progress_ms, duration_ms)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  insertSpotify.run(
    Date.now(),
    1,
    'Good Grace',
    'Hillsong UNITED',
    'People',
    'https://i.scdn.co/image/ab67616d0000b273f854c4a5c2c0db5b0b3d3b3d',
    127000, // 2:07 progress
    243000 // 4:03 duration
  )

  console.log('Seeded Spotify now playing')

  // ============================================
  // Sync Status
  // ============================================
  const insertSync = db.prepare(`
    INSERT OR REPLACE INTO sync_status (key, last_sync, status)
    VALUES (?, ?, 'success')
  `)

  insertSync.run('strava', Date.now() - 30 * 60 * 1000) // 30 min ago
  insertSync.run('health', Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
  insertSync.run('spotify', Date.now() - 5 * 1000) // 5 sec ago
  insertSync.run('ai_suggestions', Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago

  console.log('Seeded sync status')

  console.log('✓ Database seeded successfully!')
}

// Run directly if executed as script
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
}
