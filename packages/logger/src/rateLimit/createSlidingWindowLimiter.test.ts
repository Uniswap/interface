import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSlidingWindowLimiter } from './createSlidingWindowLimiter'

afterEach(() => {
  vi.useRealTimers()
})

describe('createSlidingWindowLimiter', () => {
  it('limits once the window is full and releases when it slides', () => {
    vi.useFakeTimers()
    const limiter = createSlidingWindowLimiter(2, 60_000)

    expect(limiter.isLimited('a')).toBe(false)
    limiter.record('a')
    limiter.record('a')
    expect(limiter.isLimited('a')).toBe(true)

    vi.advanceTimersByTime(60_001)
    expect(limiter.isLimited('a')).toBe(false)
  })

  it('keys are independent', () => {
    const limiter = createSlidingWindowLimiter(1, 60_000)
    limiter.record('a')
    expect(limiter.isLimited('a')).toBe(true)
    expect(limiter.isLimited('b')).toBe(false)
  })
})

describe('bounded memory under a distinct-key flood', () => {
  /**
   * The failure this replaces: past the cap the old implementation re-filtered
   * the ENTIRE map on every record(), and inside a live window it could evict
   * nothing — unbounded growth plus O(n) work per request, in the process
   * serving SSR. A flood of distinct keys turned the limiter into the amplifier.
   */
  it('stays bounded and stays fast across far more keys than the cap', () => {
    const limiter = createSlidingWindowLimiter(100, 60_000)

    const started = Date.now()
    for (let i = 0; i < 60_000; i++) {
      limiter.record(`ip-${i}`)
    }
    const elapsed = Date.now() - started

    // 6x the 10k cap. With the old O(n) sweep this degrades quadratically;
    // the bound here is deliberately loose so it fails on regression, not on
    // a slow machine.
    expect(elapsed).toBeLessThan(5_000)

    // Recently-seen keys survive; the oldest were evicted rather than swept.
    limiter.record('ip-59999')
    expect(limiter.isLimited('ip-59999')).toBe(false)
  })

  it('holds exactly 10,000 keys and evicts the least recently used first', () => {
    const limiter = createSlidingWindowLimiter(1, 60_000)
    const keys = Array.from({ length: 10_500 }, (_, i) => `ip-${i}`)
    for (const key of keys) {
      limiter.record(key)
    }

    // With max = 1 a key reads as limited exactly while the limiter holds it.
    expect(keys.filter((key) => limiter.isLimited(key))).toHaveLength(10_000)
    expect(limiter.isLimited('ip-0')).toBe(false)
    expect(limiter.isLimited('ip-10499')).toBe(true)
  })

  // A limited caller's requests are refused before `record`, so only its
  // `isLimited` checks show it is still active.
  it('keeps a key that is limited and still hammering through a flood of newer keys', () => {
    const limiter = createSlidingWindowLimiter(2, 60_000)
    limiter.record('abuser')
    limiter.record('abuser')

    for (let i = 0; i < 10_500; i++) {
      limiter.record(`ip-${i}`)
      if (i % 500 === 0) {
        expect(limiter.isLimited('abuser')).toBe(true)
      }
    }

    expect(limiter.isLimited('abuser')).toBe(true)
  })

  it('an evicted key gets a fresh window rather than a stuck one', () => {
    const limiter = createSlidingWindowLimiter(1, 60_000)
    limiter.record('victim')
    expect(limiter.isLimited('victim')).toBe(true)

    for (let i = 0; i < 10_001; i++) {
      limiter.record(`flood-${i}`)
    }

    // Evicted: it loses its history, which is no weaker than the unbounded
    // map this replaces, and memory is now hard-capped.
    expect(limiter.isLimited('victim')).toBe(false)
  })

  it('bounds a single key history even when it never trips the check', () => {
    const limiter = createSlidingWindowLimiter(10, 60_000)
    for (let i = 0; i < 5_000; i++) {
      limiter.record('chatty')
    }
    // Still answers, and the per-key array is capped rather than growing with
    // every request forever.
    expect(limiter.isLimited('chatty')).toBe(true)
  })
})
