import type { LogicalDay } from '../types'

/**
 * Logical Day Utility
 * 
 * The "logical day" starts at 12:00 PM (noon) local time, not midnight.
 * This means:
 * - 11:59 AM on Jan 2nd is still considered Jan 1st (logical day)
 * - 12:00 PM on Jan 2nd starts the Jan 2nd logical day
 * 
 * This is useful for daily habits where the "day" extends into late night.
 */

const LOGICAL_DAY_START_HOUR = 12 // Noon

/**
 * Get the logical day as YYYYMMDD integer for a given timestamp
 */
export function getLogicalDay(timestamp: number = Date.now(), timezone?: string): LogicalDay {
  const date = new Date(timestamp)
  
  // If timezone is provided, we need to convert
  // For now, we work with local time
  const hours = date.getHours()
  
  // If before noon, we're still in "yesterday's" logical day
  if (hours < LOGICAL_DAY_START_HOUR) {
    date.setDate(date.getDate() - 1)
  }
  
  const year = date.getFullYear()
  const month = date.getMonth() + 1 // 0-indexed
  const day = date.getDate()
  
  return year * 10000 + month * 100 + day
}

/**
 * Get the logical day for today
 */
export function getTodayLogicalDay(timezone?: string): LogicalDay {
  return getLogicalDay(Date.now(), timezone)
}

/**
 * Convert a LogicalDay to a Date object (at noon)
 */
export function logicalDayToDate(logicalDay: LogicalDay): Date {
  const year = Math.floor(logicalDay / 10000)
  const month = Math.floor((logicalDay % 10000) / 100) - 1 // 0-indexed for Date
  const day = logicalDay % 100
  
  return new Date(year, month, day, LOGICAL_DAY_START_HOUR, 0, 0, 0)
}

/**
 * Format a LogicalDay as a human-readable string
 */
export function formatLogicalDay(logicalDay: LogicalDay, format: 'short' | 'long' = 'short'): string {
  const date = logicalDayToDate(logicalDay)
  
  if (format === 'short') {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }
  
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Check if a timestamp falls within a specific logical day
 */
export function isInLogicalDay(timestamp: number, logicalDay: LogicalDay): boolean {
  return getLogicalDay(timestamp) === logicalDay
}

/**
 * Get the start timestamp for a logical day (noon)
 */
export function getLogicalDayStart(logicalDay: LogicalDay): number {
  return logicalDayToDate(logicalDay).getTime()
}

/**
 * Get the end timestamp for a logical day (11:59:59 AM next day)
 */
export function getLogicalDayEnd(logicalDay: LogicalDay): number {
  const start = logicalDayToDate(logicalDay)
  start.setDate(start.getDate() + 1)
  start.setMilliseconds(-1)
  return start.getTime()
}

/**
 * Get the week's logical days (Monday to Sunday)
 * Returns array of 7 LogicalDay values
 */
export function getWeekLogicalDays(referenceDay?: LogicalDay): LogicalDay[] {
  const refDate = referenceDay ? logicalDayToDate(referenceDay) : new Date()
  
  // Find Monday of this week
  const dayOfWeek = refDate.getDay()
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Monday is 1, Sunday is 0
  
  const monday = new Date(refDate)
  monday.setDate(refDate.getDate() + diff)
  monday.setHours(LOGICAL_DAY_START_HOUR, 0, 0, 0)
  
  const days: LogicalDay[] = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    days.push(getLogicalDay(date.getTime()))
  }
  
  return days
}

/**
 * Calculate days between two logical days
 */
export function daysBetween(day1: LogicalDay, day2: LogicalDay): number {
  const date1 = logicalDayToDate(day1)
  const date2 = logicalDayToDate(day2)
  const diffMs = Math.abs(date2.getTime() - date1.getTime())
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Add days to a logical day
 */
export function addDays(logicalDay: LogicalDay, days: number): LogicalDay {
  const date = logicalDayToDate(logicalDay)
  date.setDate(date.getDate() + days)
  return getLogicalDay(date.getTime())
}
