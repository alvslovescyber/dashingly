import { z } from 'zod'

// ============================================
// User & Settings Schemas
// ============================================

export const userConfigSchema = z.object({
  displayName: z.string().min(1).max(50),
  timezone: z.string(),
})

export const settingsSchema = z.object({
  mockMode: z.boolean().default(false),
  debugMode: z.boolean().default(false),
  brightness: z.object({
    enabled: z.boolean().default(true),
    current: z.number().min(0).max(100).default(100),
    nightMode: z.boolean().default(false),
    nightStart: z.string().regex(/^\d{2}:\d{2}$/).default('22:00'),
    nightEnd: z.string().regex(/^\d{2}:\d{2}$/).default('07:00'),
    nightBrightness: z.number().min(0).max(100).default(20),
  }),
  notifications: z.object({
    enabled: z.boolean().default(true),
    soundEnabled: z.boolean().default(true),
    quietHoursEnabled: z.boolean().default(true),
  }),
})

// ============================================
// Task Schemas
// ============================================

export const taskTypeSchema = z.enum(['daily', 'oneoff'])

export const taskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  type: taskTypeSchema,
  scheduleJson: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.number(),
})

export const taskCompletionSchema = z.object({
  id: z.string().uuid(),
  taskId: z.string().uuid(),
  completionDay: z.number().int().min(20000101).max(29991231),
  completedAt: z.number(),
})

export const suggestionStatusSchema = z.enum(['pending', 'accepted', 'dismissed'])

export const taskSuggestionSchema = z.object({
  id: z.string().uuid(),
  logicalDay: z.number().int().min(20000101).max(29991231),
  title: z.string().min(1).max(200),
  reason: z.string().max(500),
  source: z.string(),
  status: suggestionStatusSchema,
  createdAt: z.number(),
})

// ============================================
// Health Schemas
// ============================================

export const healthPayloadSchema = z.object({
  steps: z.number().int().min(0),
  activeCalories: z.number().int().min(0),
  sleepMinutes: z.number().int().min(0),
  timestamp: z.number().int(),
})

export const healthSnapshotSchema = z.object({
  ts: z.number(),
  steps: z.number().int().min(0),
  activeCals: z.number().int().min(0),
  sleepMinutes: z.number().int().min(0),
  rawJson: z.string(),
})

// ============================================
// Strava Schemas
// ============================================

export const stravaActivitySchema = z.object({
  id: z.string(),
  startDate: z.number(),
  type: z.string(),
  distanceM: z.number().min(0),
  movingTimeS: z.number().int().min(0),
  elapsedTimeS: z.number().int().min(0),
  averageSpeed: z.number().min(0),
  averageHeartrate: z.number().min(0).optional(),
  rawJson: z.string(),
})

// ============================================
// Bible Schemas
// ============================================

export const biblePlanDaySchema = z.object({
  dayIndex: z.number().int().min(0),
  date: z.number(),
  reference: z.string().min(1),
  source: z.string().default('NIV'),
  title: z.string().optional(),
})

export const biblePlanSchema = z.array(biblePlanDaySchema)

// ============================================
// Spotify Schemas
// ============================================

export const spotifyNowPlayingSchema = z.object({
  ts: z.number(),
  isPlaying: z.boolean(),
  track: z.string(),
  artist: z.string(),
  album: z.string(),
  albumArtUrl: z.string().optional(),
  progressMs: z.number().int().min(0),
  durationMs: z.number().int().min(0),
  rawJson: z.string(),
})

// ============================================
// AI Schemas
// ============================================

export const aiTaskSuggestionSchema = z.object({
  title: z.string().min(1).max(200),
  reason: z.string().max(500),
})

export const aiTaskResponseSchema = z.object({
  suggestions: z.array(aiTaskSuggestionSchema).max(5),
})

// ============================================
// Brightness Schemas
// ============================================

export const brightnessScheduleEntrySchema = z.object({
  time: z.string().regex(/^\d{2}:\d{2}$/),
  brightness: z.number().min(0).max(100),
})

export const brightnessScheduleSchema = z.object({
  enabled: z.boolean(),
  entries: z.array(brightnessScheduleEntrySchema),
})

// ============================================
// Validation helpers
// ============================================

export function validateHealthPayload(data: unknown) {
  return healthPayloadSchema.safeParse(data)
}

export function validateAIResponse(data: unknown) {
  return aiTaskResponseSchema.safeParse(data)
}

export function validateBiblePlan(data: unknown) {
  return biblePlanSchema.safeParse(data)
}

export function validateUserConfig(data: unknown) {
  return userConfigSchema.safeParse(data)
}
