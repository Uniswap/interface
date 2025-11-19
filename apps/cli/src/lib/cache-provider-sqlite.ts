import { Database } from 'bun:sqlite'
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { type CacheProvider } from '@universe/cli/src/lib/cache-provider'

/**
 * SQLite implementation of CacheProvider using Bun's built-in SQLite
 */
export class SqliteCacheProvider implements CacheProvider {
  private db: Database
  private readonly dbPath: string

  constructor(dbPath?: string) {
    // Default to ~/.gh-agent/cache.db
    this.dbPath = dbPath || join(process.env.HOME || process.env.USERPROFILE || '.', '.gh-agent', 'cache.db')
    this.ensureCacheDirectorySync()
    this.db = new Database(this.dbPath)
    this.initializeSchema()
    this.cleanupExpired()
  }

  private ensureCacheDirectorySync(): void {
    const dir = join(this.dbPath, '..')
    if (!existsSync(dir)) {
      try {
        // Use sync version for constructor - Bun will create parent directories
        mkdir(dir, { recursive: true }).catch((error) => {
          // eslint-disable-next-line no-console
          console.error(`[WARN] Failed to create cache directory: ${error}`)
        })
      } catch {
        // Ignore - will fail gracefully on database creation
      }
    }
  }

  private initializeSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cache_entries (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        expires_at INTEGER,
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_expires_at ON cache_entries(expires_at);
    `)
  }

  /**
   * Remove expired entries (called on initialization and periodically)
   */
  private cleanupExpired(): void {
    const now = Date.now()
    this.db.exec(`DELETE FROM cache_entries WHERE expires_at IS NOT NULL AND expires_at < ${now}`)
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const now = Date.now()
      const stmt = this.db.prepare(`
        SELECT value, expires_at
        FROM cache_entries
        WHERE key = ? AND (expires_at IS NULL OR expires_at >= ?)
      `)

      const result = stmt.get(key, now) as { value: string; expires_at: number | null } | undefined

      if (!result) {
        return null
      }

      // Clean up expired entries periodically (every 100 reads)
      if (Math.random() < 0.01) {
        this.cleanupExpired()
      }

      return JSON.parse(result.value) as T
    } catch (_error) {
      return null
    }
  }

  // eslint-disable-next-line max-params -- Required to match CacheProvider interface
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value)
      const now = Date.now()
      const expiresAt = ttlSeconds ? now + ttlSeconds * 1000 : null

      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO cache_entries (key, value, expires_at, created_at)
        VALUES (?, ?, ?, ?)
      `)

      stmt.run(key, serialized, expiresAt, now)
    } catch (_error) {
      // Don't throw - graceful degradation
    }
  }

  async invalidate(key: string): Promise<void> {
    try {
      const stmt = this.db.prepare('DELETE FROM cache_entries WHERE key = ?')
      stmt.run(key)
    } catch (_error) {}
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      // SQLite uses LIKE for pattern matching
      const stmt = this.db.prepare('DELETE FROM cache_entries WHERE key LIKE ?')
      stmt.run(pattern)
    } catch (_error) {}
  }

  async clear(): Promise<void> {
    try {
      this.db.exec('DELETE FROM cache_entries')
    } catch (_error) {}
  }

  /**
   * Close the database connection (call when done)
   */
  close(): void {
    this.db.close()
  }
}
