-- GlassPi Dashboard - SQLite Schema
-- Version: 1.0.0

-- ============================================
-- Settings Table
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL -- JSON encoded value
);

-- ============================================
-- Tasks
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('daily', 'oneoff')),
    schedule_json TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_active ON tasks(is_active);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type);

-- ============================================
-- Task Completions
-- ============================================
CREATE TABLE IF NOT EXISTS task_completions (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    completion_day INTEGER NOT NULL, -- YYYYMMDD logical day
    completed_at INTEGER NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_completions_task ON task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_completions_day ON task_completions(completion_day);
CREATE UNIQUE INDEX IF NOT EXISTS idx_completions_task_day ON task_completions(task_id, completion_day);

-- ============================================
-- Task Suggestions (AI-generated)
-- ============================================
CREATE TABLE IF NOT EXISTS task_suggestions (
    id TEXT PRIMARY KEY,
    logical_day INTEGER NOT NULL, -- YYYYMMDD
    title TEXT NOT NULL,
    reason TEXT,
    source TEXT NOT NULL DEFAULT 'ai',
    status TEXT NOT NULL CHECK(status IN ('pending', 'accepted', 'dismissed')) DEFAULT 'pending',
    created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_suggestions_day ON task_suggestions(logical_day);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON task_suggestions(status);

-- ============================================
-- Strava Activities
-- ============================================
CREATE TABLE IF NOT EXISTS strava_activities (
    id TEXT PRIMARY KEY,
    start_date INTEGER NOT NULL, -- Unix timestamp
    type TEXT NOT NULL,
    distance_m REAL NOT NULL DEFAULT 0,
    moving_time_s INTEGER NOT NULL DEFAULT 0,
    elapsed_time_s INTEGER NOT NULL DEFAULT 0,
    average_speed REAL,
    average_heartrate REAL,
    raw_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_strava_date ON strava_activities(start_date);
CREATE INDEX IF NOT EXISTS idx_strava_type ON strava_activities(type);

-- ============================================
-- Strava Daily Aggregates
-- ============================================
CREATE TABLE IF NOT EXISTS strava_daily_agg (
    day INTEGER PRIMARY KEY, -- YYYYMMDD
    distance_m REAL NOT NULL DEFAULT 0,
    run_count INTEGER NOT NULL DEFAULT 0,
    moving_time_s INTEGER NOT NULL DEFAULT 0
);

-- ============================================
-- Health Snapshots
-- ============================================
CREATE TABLE IF NOT EXISTS health_snapshots (
    ts INTEGER PRIMARY KEY, -- Unix timestamp
    steps INTEGER NOT NULL DEFAULT 0,
    active_cals INTEGER NOT NULL DEFAULT 0,
    sleep_minutes INTEGER NOT NULL DEFAULT 0,
    raw_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_health_ts ON health_snapshots(ts);

-- ============================================
-- Bible Plan
-- ============================================
CREATE TABLE IF NOT EXISTS bible_plan (
    day_index INTEGER PRIMARY KEY,
    date INTEGER, -- YYYYMMDD
    reference TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'NIV',
    title TEXT
);

-- ============================================
-- Bible Completions
-- ============================================
CREATE TABLE IF NOT EXISTS bible_completions (
    date INTEGER PRIMARY KEY, -- YYYYMMDD
    completed_at INTEGER NOT NULL
);

-- ============================================
-- Spotify Now Playing
-- ============================================
CREATE TABLE IF NOT EXISTS spotify_now_playing (
    ts INTEGER PRIMARY KEY, -- Unix timestamp
    is_playing INTEGER NOT NULL DEFAULT 0,
    track TEXT,
    artist TEXT,
    album TEXT,
    album_art_url TEXT,
    progress_ms INTEGER NOT NULL DEFAULT 0,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    raw_json TEXT
);

-- ============================================
-- Sync Status (for last sync times)
-- ============================================
CREATE TABLE IF NOT EXISTS sync_status (
    key TEXT PRIMARY KEY,
    last_sync INTEGER NOT NULL,
    status TEXT,
    error TEXT
);

-- ============================================
-- Schema Migrations
-- ============================================
CREATE TABLE IF NOT EXISTS migrations (
    version INTEGER PRIMARY KEY,
    applied_at INTEGER NOT NULL,
    description TEXT
);

-- Insert initial migration record
INSERT OR IGNORE INTO migrations (version, applied_at, description)
VALUES (1, strftime('%s', 'now'), 'Initial schema');
