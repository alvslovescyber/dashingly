import Database from 'better-sqlite3'
import { readFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { app } from 'electron'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Database singleton
let db: Database.Database | null = null

/**
 * Get the database file path
 * In production: userData directory
 * In development: project root
 */
function getDbPath(): string {
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged
  
  if (isDev) {
    return join(process.env.APP_ROOT || __dirname, 'data', 'glasspi.db')
  }
  
  return join(app.getPath('userData'), 'glasspi.db')
}

/**
 * Initialize the database
 */
export function initDatabase(): Database.Database {
  if (db) return db
  
  const dbPath = getDbPath()
  
  // Ensure directory exists
  const dbDir = dirname(dbPath)
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true })
  }
  
  console.log('Initializing database at:', dbPath)
  
  // Create database connection
  db = new Database(dbPath, {
    // Enable WAL mode for better concurrency
    fileMustExist: false,
  })
  
  // Enable WAL mode
  db.pragma('journal_mode = WAL')
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON')
  
  // Run schema
  runSchema(db)
  
  // Run migrations
  runMigrations(db)
  
  return db
}

/**
 * Get the database instance
 */
export function getDatabase(): Database.Database {
  if (!db) {
    return initDatabase()
  }
  return db
}

/**
 * Close the database
 */
export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}

/**
 * Run the schema SQL
 */
function runSchema(database: Database.Database): void {
  try {
    // Look for schema file
    const schemaPath = join(__dirname, 'schema.sql')
    
    if (existsSync(schemaPath)) {
      const schema = readFileSync(schemaPath, 'utf8')
      database.exec(schema)
    } else {
      console.warn('Schema file not found, using inline schema')
      // Fallback inline schema (minimal)
      database.exec(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS migrations (
          version INTEGER PRIMARY KEY,
          applied_at INTEGER NOT NULL,
          description TEXT
        );
      `)
    }
  } catch (error) {
    console.error('Error running schema:', error)
    throw error
  }
}

/**
 * Run database migrations
 */
function runMigrations(database: Database.Database): void {
  // Get current version
  const currentVersion = database
    .prepare('SELECT MAX(version) as version FROM migrations')
    .get() as { version: number | null }
  
  const version = currentVersion?.version || 0
  
  console.log('Current database version:', version)
  
  // Define migrations
  const migrations: Array<{ version: number; description: string; sql: string }> = [
    // Future migrations go here
    // {
    //   version: 2,
    //   description: 'Add some new column',
    //   sql: 'ALTER TABLE tasks ADD COLUMN new_column TEXT;',
    // },
  ]
  
  // Run pending migrations
  for (const migration of migrations) {
    if (migration.version > version) {
      console.log(`Running migration ${migration.version}: ${migration.description}`)
      
      const runMigration = database.transaction(() => {
        database.exec(migration.sql)
        database
          .prepare('INSERT INTO migrations (version, applied_at, description) VALUES (?, ?, ?)')
          .run(migration.version, Date.now(), migration.description)
      })
      
      runMigration()
    }
  }
}

// ============================================
// Generic CRUD helpers
// ============================================

export function getSetting<T>(key: string, defaultValue: T): T {
  const database = getDatabase()
  const row = database
    .prepare('SELECT value FROM settings WHERE key = ?')
    .get(key) as { value: string } | undefined
  
  if (!row) return defaultValue
  
  try {
    return JSON.parse(row.value) as T
  } catch {
    return defaultValue
  }
}

export function setSetting<T>(key: string, value: T): void {
  const database = getDatabase()
  database
    .prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
    .run(key, JSON.stringify(value))
}

export function deleteSetting(key: string): void {
  const database = getDatabase()
  database.prepare('DELETE FROM settings WHERE key = ?').run(key)
}

// ============================================
// Sync status helpers
// ============================================

export function getLastSync(key: string): number | null {
  const database = getDatabase()
  const row = database
    .prepare('SELECT last_sync FROM sync_status WHERE key = ?')
    .get(key) as { last_sync: number } | undefined
  
  return row?.last_sync ?? null
}

export function setLastSync(key: string, timestamp: number = Date.now(), status?: string, error?: string): void {
  const database = getDatabase()
  database
    .prepare(`
      INSERT OR REPLACE INTO sync_status (key, last_sync, status, error)
      VALUES (?, ?, ?, ?)
    `)
    .run(key, timestamp, status || 'success', error || null)
}
