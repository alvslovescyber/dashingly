import { getDatabase, getSetting, setSetting } from './database'
import { getTodayLogicalDay } from '../../shared/utils/logical-day'
import { randomUUID } from 'node:crypto'

// ============================================
// Task Actions
// ============================================

export function completeTask(taskId: string): void {
  const db = getDatabase()
  const today = getTodayLogicalDay()

  // Check if already completed today
  const existing = db
    .prepare('SELECT id FROM task_completions WHERE task_id = ? AND completion_day = ?')
    .get(taskId, today)

  if (existing) {
    // Already completed - toggle off (uncomplete)
    db.prepare('DELETE FROM task_completions WHERE task_id = ? AND completion_day = ?').run(
      taskId,
      today
    )
  } else {
    // Complete the task
    db.prepare(
      'INSERT INTO task_completions (id, task_id, completion_day, completed_at) VALUES (?, ?, ?, ?)'
    ).run(randomUUID(), taskId, today, Date.now())
  }
}

export function createTask(title: string, type: 'daily' | 'oneoff' = 'daily'): string {
  const db = getDatabase()
  const id = randomUUID()

  db.prepare('INSERT INTO tasks (id, title, type, is_active, created_at) VALUES (?, ?, ?, 1, ?)').run(
    id,
    title,
    type,
    Date.now()
  )

  return id
}

export function updateTask(
  id: string,
  updates: { title?: string; type?: string; isActive?: boolean }
): void {
  const db = getDatabase()

  if (updates.title !== undefined) {
    db.prepare('UPDATE tasks SET title = ? WHERE id = ?').run(updates.title, id)
  }

  if (updates.type !== undefined) {
    db.prepare('UPDATE tasks SET type = ? WHERE id = ?').run(updates.type, id)
  }

  if (updates.isActive !== undefined) {
    db.prepare('UPDATE tasks SET is_active = ? WHERE id = ?').run(updates.isActive ? 1 : 0, id)
  }
}

export function deleteTask(id: string): void {
  const db = getDatabase()
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id)
}

// ============================================
// AI Suggestion Actions
// ============================================

export function acceptSuggestion(id: string): void {
  const db = getDatabase()

  // Get the suggestion
  const suggestion = db.prepare('SELECT title FROM task_suggestions WHERE id = ?').get(id) as
    | { title: string }
    | undefined

  if (!suggestion) {
    throw new Error('Suggestion not found')
  }

  // Create a task from the suggestion
  createTask(suggestion.title, 'oneoff')

  // Mark suggestion as accepted
  db.prepare('UPDATE task_suggestions SET status = ? WHERE id = ?').run('accepted', id)
}

export function dismissSuggestion(id: string): void {
  const db = getDatabase()
  db.prepare('UPDATE task_suggestions SET status = ? WHERE id = ?').run('dismissed', id)
}

// ============================================
// Bible Actions
// ============================================

export function markBibleComplete(): void {
  const db = getDatabase()
  const today = getTodayLogicalDay()

  // Check if already completed
  const existing = db.prepare('SELECT date FROM bible_completions WHERE date = ?').get(today)

  if (existing) {
    // Already completed - toggle off
    db.prepare('DELETE FROM bible_completions WHERE date = ?').run(today)
  } else {
    // Mark as complete
    db.prepare('INSERT INTO bible_completions (date, completed_at) VALUES (?, ?)').run(
      today,
      Date.now()
    )
  }
}

// ============================================
// Settings Actions
// ============================================

export function getSettingValue<T>(key: string, defaultValue: T): T {
  return getSetting(key, defaultValue)
}

export function setSettingValue<T>(key: string, value: T): void {
  setSetting(key, value)
}
