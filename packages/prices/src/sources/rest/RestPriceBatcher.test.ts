import { BATCH_DELAY_MS, MAX_BATCH_SIZE } from '@universe/prices/src/sources/rest/constants'
import { RestPriceBatcher } from '@universe/prices/src/sources/rest/RestPriceBatcher'
import type { RestPriceClient } from '@universe/prices/src/sources/rest/types'
import type { TokenPriceData } from '@universe/prices/src/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

function createMockClient(
  handler: (tokens: { chainId: number; address: string }[]) => Promise<Map<string, TokenPriceData>>,
): RestPriceClient {
  return { getTokenPrices: vi.fn(handler) }
}

function priceData(price: number, timestamp = Date.now()): TokenPriceData {
  return { price, timestamp }
}

describe('RestPriceBatcher', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('batches multiple fetch calls within the batching window', async () => {
    const client = createMockClient(async (tokens) => {
      const result = new Map<string, TokenPriceData>()
      for (const t of tokens) {
        result.set(`${t.chainId}-${t.address}`, priceData(100 + t.chainId))
      }
      return result
    })

    const batcher = new RestPriceBatcher(client)

    // Fire multiple fetches synchronously (same batching window)
    const p1 = batcher.fetch({ chainId: 1, address: '0xaaa' })
    const p2 = batcher.fetch({ chainId: 42161, address: '0xbbb' })

    // Advance past the batch delay to trigger flush
    vi.advanceTimersByTime(BATCH_DELAY_MS)

    const [r1, r2] = await Promise.all([p1, p2])

    expect(r1).toEqual(priceData(101, r1!.timestamp))
    expect(r2).toEqual(priceData(42261, r2!.timestamp))
    expect(client.getTokenPrices).toHaveBeenCalledTimes(1)
    expect(client.getTokenPrices).toHaveBeenCalledWith([
      { chainId: 1, address: '0xaaa' },
      { chainId: 42161, address: '0xbbb' },
    ])
  })

  it('deduplicates tokens within the same batch', async () => {
    const client = createMockClient(async (tokens) => {
      const result = new Map<string, TokenPriceData>()
      for (const t of tokens) {
        result.set(`${t.chainId}-${t.address}`, priceData(50))
      }
      return result
    })

    const batcher = new RestPriceBatcher(client)

    const p1 = batcher.fetch({ chainId: 1, address: '0xAAA' })
    const p2 = batcher.fetch({ chainId: 1, address: '0xaaa' }) // Same after lowercase

    vi.advanceTimersByTime(BATCH_DELAY_MS)

    const [r1, r2] = await Promise.all([p1, p2])

    expect(r1).toEqual(priceData(50, r1!.timestamp))
    expect(r2).toEqual(priceData(50, r2!.timestamp))
    // Only 1 unique token sent to the client
    expect(client.getTokenPrices).toHaveBeenCalledWith([{ chainId: 1, address: '0xaaa' }])
  })

  it('chunks large batches to respect MAX_BATCH_SIZE', async () => {
    const client = createMockClient(async (tokens) => {
      const result = new Map<string, TokenPriceData>()
      for (const t of tokens) {
        result.set(`${t.chainId}-${t.address}`, priceData(1))
      }
      return result
    })

    const batcher = new RestPriceBatcher(client)

    // Create MAX_BATCH_SIZE + 10 unique tokens
    const count = MAX_BATCH_SIZE + 10
    const promises = Array.from({ length: count }, (_, i) =>
      batcher.fetch({ chainId: 1, address: `0x${i.toString(16).padStart(40, '0')}` }),
    )

    vi.advanceTimersByTime(BATCH_DELAY_MS)

    const results = await Promise.all(promises)

    expect(results).toHaveLength(count)
    expect(results.every((r) => r !== undefined)).toBe(true)
    // Should have been split into 2 REST calls
    expect(client.getTokenPrices).toHaveBeenCalledTimes(2)
  })

  it('propagates errors to all pending promises', async () => {
    const error = new Error('network failure')
    const client = createMockClient(async () => {
      throw error
    })

    const batcher = new RestPriceBatcher(client)

    const p1 = batcher.fetch({ chainId: 1, address: '0xaaa' })
    const p2 = batcher.fetch({ chainId: 42161, address: '0xbbb' })

    vi.advanceTimersByTime(BATCH_DELAY_MS)

    await expect(p1).rejects.toThrow('network failure')
    await expect(p2).rejects.toThrow('network failure')
  })

  it('returns undefined for tokens not in REST response', async () => {
    const client = createMockClient(async () => {
      // Return empty map (no prices available)
      return new Map<string, TokenPriceData>()
    })

    const batcher = new RestPriceBatcher(client)

    const promise = batcher.fetch({ chainId: 1, address: '0xaaa' })

    vi.advanceTimersByTime(BATCH_DELAY_MS)

    const result = await promise

    expect(result).toBeUndefined()
  })

  it('processes sequential batches independently', async () => {
    let callCount = 0
    const client = createMockClient(async (tokens) => {
      callCount++
      const result = new Map<string, TokenPriceData>()
      for (const t of tokens) {
        result.set(`${t.chainId}-${t.address}`, priceData(callCount * 100))
      }
      return result
    })

    const batcher = new RestPriceBatcher(client)

    // First batch
    const p1 = batcher.fetch({ chainId: 1, address: '0xaaa' })
    vi.advanceTimersByTime(BATCH_DELAY_MS)
    const r1 = await p1
    expect(r1?.price).toBe(100)

    // Second batch (new timer window)
    const p2 = batcher.fetch({ chainId: 1, address: '0xbbb' })
    vi.advanceTimersByTime(BATCH_DELAY_MS)
    const r2 = await p2
    expect(r2?.price).toBe(200)

    expect(client.getTokenPrices).toHaveBeenCalledTimes(2)
  })

  it('lowercases addresses for deduplication', async () => {
    const client = createMockClient(async (tokens) => {
      const result = new Map<string, TokenPriceData>()
      for (const t of tokens) {
        result.set(`${t.chainId}-${t.address}`, priceData(42))
      }
      return result
    })

    const batcher = new RestPriceBatcher(client)

    const promise = batcher.fetch({ chainId: 1, address: '0xAbCdEf' })

    vi.advanceTimersByTime(BATCH_DELAY_MS)

    const result = await promise

    expect(result?.price).toBe(42)
    expect(client.getTokenPrices).toHaveBeenCalledWith([{ chainId: 1, address: '0xabcdef' }])
  })

  it('batches requests arriving in separate macrotasks within the delay window', async () => {
    const client = createMockClient(async (tokens) => {
      const result = new Map<string, TokenPriceData>()
      for (const t of tokens) {
        result.set(`${t.chainId}-${t.address}`, priceData(99))
      }
      return result
    })

    const batcher = new RestPriceBatcher(client)

    // First request starts the timer
    const p1 = batcher.fetch({ chainId: 1, address: '0xaaa' })

    // Advance partway through the delay (simulating a second macrotask arriving)
    vi.advanceTimersByTime(BATCH_DELAY_MS / 2)

    // Second request arrives before the timer fires
    const p2 = batcher.fetch({ chainId: 10, address: '0xbbb' })

    // Now advance past the delay to flush
    vi.advanceTimersByTime(BATCH_DELAY_MS)

    const [r1, r2] = await Promise.all([p1, p2])

    expect(r1?.price).toBe(99)
    expect(r2?.price).toBe(99)
    // Both should be in a single batch
    expect(client.getTokenPrices).toHaveBeenCalledTimes(1)
    expect(client.getTokenPrices).toHaveBeenCalledWith([
      { chainId: 1, address: '0xaaa' },
      { chainId: 10, address: '0xbbb' },
    ])
  })
})
