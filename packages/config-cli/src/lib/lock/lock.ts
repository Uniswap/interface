import { Result } from 'better-result'
import { sleep } from 'utilities/src/time/timing'
import { LockError } from '../../errors'
import type { FileStorage } from '../storage/fileStorage'
import type { Storage } from '../storage/types'

const ACQUIRE_RETRY_INTERVAL_MS = 100

// Older than this → orphaned (crashed holder) → break it.
const STALE_AFTER_MS = 60_000

export type Lock = ReturnType<typeof createLock>

export type LockDeps<S extends Storage<unknown> = FileStorage> = {
  // Backing storage. `set` MUST fail when the key already exists.
  storage: S
  key: string
  timeoutMs: number
}

type LockMetadata = { pid: number; createdAt: number }

/**
 * Mutex backed by atomic-create-only Storage. `withLock(fn)` releases even on throw,
 * and auto-breaks holders older than `STALE_AFTER_MS` so a crashed process can't deadlock.
 */
export function createLock<S extends Storage<unknown> = FileStorage>({ storage, key, timeoutMs }: LockDeps<S>) {
  const isHolderStale = async (): Promise<boolean> => {
    const existing = await storage.get(key)
    // Unreadable or unparseable → treat as stale rather than deadlock on it.
    if (existing.isErr()) {
      return true
    }
    try {
      const { createdAt } = JSON.parse(existing.value) as Partial<LockMetadata>
      return typeof createdAt !== 'number' || Date.now() - createdAt > STALE_AFTER_MS
    } catch {
      return true
    }
  }

  const acquire = async (): Promise<Result<void, LockError>> => {
    const deadlineMs = Date.now() + timeoutMs

    while (Date.now() < deadlineMs) {
      const metadata: LockMetadata = { pid: process.pid, createdAt: Date.now() }
      const claim = await storage.set(key, JSON.stringify(metadata))
      if (claim.isOk()) {
        return Result.ok(undefined)
      }
      if (await isHolderStale()) {
        await storage.delete(key)
        continue
      }
      await sleep(ACQUIRE_RETRY_INTERVAL_MS)
    }

    return Result.err(new LockError({ message: `Timed out after ${timeoutMs}ms waiting for lock "${key}"` }))
  }

  return {
    /**
     * Acquires the lock and calls the provided function.
     * Note, allows errors to propagate out of the function.
     */
    async withLock<T>(fn: () => Promise<T>): Promise<Result<T, LockError>> {
      const acquired = await acquire()
      if (acquired.isErr()) {
        return Result.err(acquired.error)
      }
      try {
        return Result.ok(await fn())
      } finally {
        // Best-effort release; ignore failures (lock may already be gone if broken as stale).
        await storage.delete(key)
      }
    },
  }
}
