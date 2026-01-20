import OpenAI from 'openai'
import { getDatabase, getSetting, setLastSync } from '../db/database'
import { validateAIResponse } from '../../shared/schemas'
import { getTodayLogicalDay } from '../../shared/utils/logical-day'
import type { AITaskSuggestion } from '../../shared/types'

// AI throttle state
let aiRunsToday = 0
let failedAttempts = 0

/**
 * Generate AI task suggestions based on user activity data
 */
export async function generateTaskSuggestions(): Promise<AITaskSuggestion[]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.warn('OpenAI API key not configured - skipping AI suggestions')
    return []
  }

  // Throttle check
  const maxRunsPerDay = getSetting<number>('ai_max_runs_per_day', 2)
  if (aiRunsToday >= maxRunsPerDay) {
    console.log(`AI throttle: ${aiRunsToday}/${maxRunsPerDay} runs today`)
    return []
  }

  const db = getDatabase()
  const today = getTodayLogicalDay()
  const model = process.env.OPENAI_MODEL || 'gpt-4o'

  // Check if we already have suggestions for today
  const existingSuggestions = db
    .prepare('SELECT COUNT(*) as count FROM task_suggestions WHERE logical_day = ?')
    .get(today) as { count: number }

  if (existingSuggestions.count >= 5) {
    console.log('Already have max suggestions for today')
    return []
  }

  // Gather context
  const context = gatherActivityContext()

  try {
    const openai = new OpenAI({ apiKey })

    // Reduce max suggestions if we've had failures
    const maxSuggestions = failedAttempts >= 2 ? 3 : 5

    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `You are a helpful wellness assistant for a personal dashboard. Generate actionable daily task suggestions based on the user's recent activity data.

Rules:
- Each task must be specific, actionable, and time-bounded
- Tasks should help fill gaps in activity (e.g., if no recent runs, suggest a run)
- Keep tasks realistic and achievable in one day
- Maximum ${maxSuggestions} suggestions
- Return ONLY valid JSON, no markdown or explanations

Output format:
{
  "suggestions": [
    {
      "title": "Go for a 3km run before noon",
      "reason": "No runs logged this week, light activity suggested"
    }
  ]
}`,
        },
        {
          role: 'user',
          content: `Here's my recent activity data:
${JSON.stringify(context, null, 2)}

Generate ${maxSuggestions} personalized task suggestions for today.`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 500,
      temperature: 0.7,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('Empty AI response')
    }

    // Parse and validate
    let parsed: unknown
    try {
      parsed = JSON.parse(content)
    } catch {
      throw new Error('Invalid JSON from AI')
    }

    const result = validateAIResponse(parsed)
    if (!result.success) {
      failedAttempts++
      console.error('AI response validation failed:', result.error)

      // Show warning in debug mode after 2 failures
      if (failedAttempts >= 2) {
        console.warn('AI suggestions degraded - reducing to 3 suggestions')
      }

      throw new Error('AI response validation failed')
    }

    // Reset failure count on success
    failedAttempts = 0
    aiRunsToday++

    // Store suggestions
    const suggestions = result.data.suggestions
    const insertStmt = db.prepare(`
      INSERT INTO task_suggestions (id, logical_day, title, reason, source, status, created_at)
      VALUES (?, ?, ?, ?, 'ai', 'pending', ?)
    `)

    for (const suggestion of suggestions) {
      const id = crypto.randomUUID()
      insertStmt.run(id, today, suggestion.title, suggestion.reason, Date.now())
    }

    setLastSync('ai_suggestions', Date.now())

    return suggestions
  } catch (err) {
    console.error('AI task generation error:', err)
    return []
  }
}

/**
 * Gather context from activity data for AI
 */
function gatherActivityContext(): object {
  const db = getDatabase()
  const today = getTodayLogicalDay()

  // Recent Strava activities (last 7 days)
  const stravaActivities = db
    .prepare(
      `
      SELECT type, distance_m, moving_time_s, start_date
      FROM strava_activities
      WHERE start_date > ?
      ORDER BY start_date DESC
      LIMIT 10
    `
    )
    .all(Date.now() - 7 * 24 * 60 * 60 * 1000) as Array<{
    type: string
    distance_m: number
    moving_time_s: number
    start_date: number
  }>

  // Recent health data
  const latestHealth = db
    .prepare(
      `
      SELECT steps, active_cals, sleep_minutes, ts
      FROM health_snapshots
      ORDER BY ts DESC
      LIMIT 1
    `
    )
    .get() as
    | {
        steps: number
        active_cals: number
        sleep_minutes: number
        ts: number
      }
    | undefined

  // Today's completed tasks
  const completedToday = db
    .prepare(
      `
      SELECT t.title
      FROM task_completions c
      JOIN tasks t ON c.task_id = t.id
      WHERE c.completion_day = ?
    `
    )
    .all(today) as Array<{ title: string }>

  // Weekly Strava distance
  const weeklyDistance = stravaActivities
    .filter(a => a.type === 'Run')
    .reduce((sum, a) => sum + a.distance_m / 1000, 0)

  return {
    weeklyRunDistance: Math.round(weeklyDistance * 10) / 10,
    runCount: stravaActivities.filter(a => a.type === 'Run').length,
    lastActivity: stravaActivities[0]
      ? {
          type: stravaActivities[0].type,
          distanceKm: Math.round(stravaActivities[0].distance_m / 100) / 10,
          daysAgo: Math.floor(
            (Date.now() - stravaActivities[0].start_date) / (24 * 60 * 60 * 1000)
          ),
        }
      : null,
    latestHealth: latestHealth
      ? {
          steps: latestHealth.steps,
          calories: latestHealth.active_cals,
          sleepHours: Math.round((latestHealth.sleep_minutes / 60) * 10) / 10,
          daysAgo: Math.floor((Date.now() - latestHealth.ts) / (24 * 60 * 60 * 1000)),
        }
      : null,
    completedToday: completedToday.map(t => t.title),
  }
}

/**
 * Reset daily AI counters (call at day boundary)
 */
export function resetDailyAICounters(): void {
  aiRunsToday = 0
}

/**
 * Check if AI can run (for manual triggers)
 */
export function canRunAI(): { allowed: boolean; reason?: string } {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return { allowed: false, reason: 'OpenAI API key not configured' }
  }

  const maxRunsPerDay = getSetting<number>('ai_max_runs_per_day', 2)
  if (aiRunsToday >= maxRunsPerDay) {
    return { allowed: false, reason: `Daily limit reached (${aiRunsToday}/${maxRunsPerDay})` }
  }

  return { allowed: true }
}
