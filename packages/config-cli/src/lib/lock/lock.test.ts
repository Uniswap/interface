import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type FileStorage } from '../storage/fileStorage'
import { createFileStorageMock } from '../storage/fileStorage.mock'
import { createLock } from './lock'

const KEY = 'refresh.lock'

let storage: FileStorage

beforeEach(() => {
  storage = createFileStorageMock()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('createLock.withLock — basics', () => {
  it('runs the function and returns Ok(value)', async () => {
    const lock = createLock({ storage, key: KEY, timeoutMs: 1_000 })

    const result = await lock.withLock(async () => 42)

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toBe(42)
    }
  })

  it('releases the lock after the function completes', async () => {
    const lock = createLock({ storage, key: KEY, timeoutMs: 1_000 })

    await lock.withLock(async () => undefined)

    expect((await storage.get(KEY)).isErr()).toBe(true)
  })

  it('releases the lock even when the function throws', async () => {
    const lock = createLock({ storage, key: KEY, timeoutMs: 1_000 })

    await expect(
      lock.withLock(async () => {
        throw new Error('boom')
      }),
    ).rejects.toThrow('boom')

    expect((await storage.get(KEY)).isErr()).toBe(true)
  })

  it('serializes overlapping withLock calls — the second waits for the first to release', async () => {
    vi.useFakeTimers()
    const lock = createLock({ storage, key: KEY, timeoutMs: 5_000 })
    const log: string[] = []

    const first = lock.withLock(async () => {
      log.push('a-start')
      await new Promise((resolve) => setTimeout(resolve, 200))
      log.push('a-end')
    })

    // Wait until `first` has acquired the lock and entered its critical section before
    // `second` enters the race. Polling on an observable signal is robust to changes in
    // the await chain length, unlike a fixed microtask-flush count.
    await waitFor(() => log.includes('a-start'))

    const second = lock.withLock(async () => {
      log.push('b-start')
      log.push('b-end')
    })

    // Drive fake time past first's 200ms inner timer plus second's retry-sleep cycles.
    await vi.advanceTimersByTimeAsync(500)
    await Promise.all([first, second])

    expect(log).toEqual(['a-start', 'a-end', 'b-start', 'b-end'])
  })
})

describe('createLock.withLock — timeout and staleness', () => {
  it('returns LockError when the lock cannot be acquired within the timeout', async () => {
    vi.useFakeTimers()
    await storage.set(KEY, JSON.stringify({ pid: process.pid, createdAt: Date.now() }))

    const lock = createLock({ storage, key: KEY, timeoutMs: 200 })
    const promise = lock.withLock(async () => 'never')

    // Cover the timeout window (200ms) plus a retry cycle (100ms) so the loop has time
    // to give up rather than just stop mid-poll.
    await vi.advanceTimersByTimeAsync(500)
    const result = await promise

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error._tag).toBe('LockError')
      expect(result.error.message).toContain('Timed out')
    }
  })

  it('breaks a stale lock (createdAt far in the past) and acquires it', async () => {
    const longAgo = Date.now() - 5 * 60 * 1000
    await storage.set(KEY, JSON.stringify({ pid: 999_999, createdAt: longAgo }))

    const lock = createLock({ storage, key: KEY, timeoutMs: 1_000 })
    const result = await lock.withLock(async () => 'ok')

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toBe('ok')
    }
  })

  it('treats unparseable lock metadata as stale and proceeds', async () => {
    await storage.set(KEY, 'not-json-at-all')

    const lock = createLock({ storage, key: KEY, timeoutMs: 1_000 })
    const result = await lock.withLock(async () => 'ok')

    expect(result.isOk()).toBe(true)
  })
})

// Yields microtasks until `predicate` becomes true. Used to wait for observable state
// changes under fake timers without baking in a fragile microtask count. Throws if the
// predicate doesn't become true within `maxTicks` so a bug fails the test loudly instead
// of hanging.
const waitFor = async (predicate: () => boolean, maxTicks = 100): Promise<void> => {
  for (let i = 0; i < maxTicks; i++) {
    if (predicate()) {
      return
    }
    await Promise.resolve()
  }
  throw new Error(`waitFor: predicate never became true after ${maxTicks} microtask ticks`)
}
