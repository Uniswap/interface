import { createTtlCache } from 'utilities/src/cache/ttlCache'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('createTtlCache', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the cached value within the TTL and dedupes concurrent callers', async () => {
    const cache = createTtlCache({ ttlMs: 1000 })
    const compute = vi.fn().mockResolvedValue(42)

    const [a, b] = await Promise.all([cache.get('k', compute), cache.get('k', compute)])
    expect(a).toBe(42)
    expect(b).toBe(42)
    expect(compute).toHaveBeenCalledTimes(1)

    await expect(cache.get('k', compute)).resolves.toBe(42)
    expect(compute).toHaveBeenCalledTimes(1)
  })

  it('recomputes after the TTL expires', async () => {
    const cache = createTtlCache({ ttlMs: 1000 })
    const compute = vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2)

    await expect(cache.get('k', compute)).resolves.toBe(1)
    vi.advanceTimersByTime(1001)
    await expect(cache.get('k', compute)).resolves.toBe(2)
    expect(compute).toHaveBeenCalledTimes(2)
  })

  it('does not cache rejections', async () => {
    const cache = createTtlCache({ ttlMs: 1000 })
    const compute = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce(7)

    await expect(cache.get('k', compute)).rejects.toThrow('boom')
    await expect(cache.get('k', compute)).resolves.toBe(7)
    expect(compute).toHaveBeenCalledTimes(2)
  })

  it('touch shortens an entry deadline without evicting it', async () => {
    const cache = createTtlCache({ ttlMs: 60_000 })
    const compute = vi.fn().mockResolvedValue('v')
    await cache.get('key', compute)
    cache.touch('key', 1_000)
    await cache.get('key', compute)
    expect(compute).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(1_001)
    await cache.get('key', compute)
    expect(compute).toHaveBeenCalledTimes(2)
  })

  it('drop evicts the key so the next call recomputes', async () => {
    const cache = createTtlCache({ ttlMs: 60_000 })
    const compute = vi.fn().mockResolvedValue('value')
    await cache.get('key', compute)
    cache.drop('key')
    await cache.get('key', compute)
    expect(compute).toHaveBeenCalledTimes(2)
  })

  it('bounds tracked keys by evicting the oldest entries past the cap', async () => {
    const cache = createTtlCache({ ttlMs: 60_000 })
    // Fill to one past the cap, then miss once more to trigger the sweep.
    for (let i = 0; i <= 1_000; i += 1) {
      await cache.get(`k${i}`, async () => i)
    }
    await cache.get('overflow', async () => -1)
    // The oldest key was evicted, so it recomputes; a recent key still serves
    // from the cache.
    const recompute = vi.fn().mockResolvedValue('fresh')
    await expect(cache.get('k0', recompute)).resolves.toBe('fresh')
    expect(recompute).toHaveBeenCalledTimes(1)
    const untouched = vi.fn()
    await expect(cache.get('k900', untouched)).resolves.toBe(900)
    expect(untouched).not.toHaveBeenCalled()
  })
})
