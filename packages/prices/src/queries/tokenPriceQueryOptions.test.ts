import { QueryClient } from '@tanstack/react-query'
import { priceKeys } from '@universe/prices/src/queries/priceKeys'
import { tokenPriceQueryOptions } from '@universe/prices/src/queries/tokenPriceQueryOptions'
import { REST_POLL_INTERVAL_MS, STALE_PRICE_THRESHOLD_MS } from '@universe/prices/src/sources/rest/constants'
import type { RestPriceBatcher } from '@universe/prices/src/sources/rest/RestPriceBatcher'
import type { TokenPriceData } from '@universe/prices/src/types'
import { describe, expect, it, vi } from 'vitest'

function createMockBatcher(result?: TokenPriceData): RestPriceBatcher {
  return { fetch: vi.fn().mockResolvedValue(result) } as unknown as RestPriceBatcher
}

describe('tokenPriceQueryOptions', () => {
  const chainId = 1
  const address = '0xabc'

  describe('refetchInterval', () => {
    it('returns REST_POLL_INTERVAL_MS when WS is disconnected', () => {
      const batcher = createMockBatcher()
      const options = tokenPriceQueryOptions({
        chainId,
        address,
        restBatcher: batcher,
        getIsWsConnected: () => false,
      })

      const interval =
        typeof options.refetchInterval === 'function'
          ? options.refetchInterval({} as never, {} as never)
          : options.refetchInterval
      expect(interval).toBe(REST_POLL_INTERVAL_MS)
    })

    it('returns false when WS is connected and data is fresh', () => {
      const batcher = createMockBatcher()
      const options = tokenPriceQueryOptions({
        chainId,
        address,
        restBatcher: batcher,
        getIsWsConnected: () => true,
      })

      const mockQuery = { state: { data: { price: 2000, timestamp: Date.now(), source: 'aurora_ws' } } }
      const interval =
        typeof options.refetchInterval === 'function'
          ? options.refetchInterval(mockQuery as never, {} as never)
          : options.refetchInterval
      expect(interval).toBe(false)
    })

    it('returns REST_POLL_INTERVAL_MS when WS is connected but data is stale', () => {
      const batcher = createMockBatcher()
      const options = tokenPriceQueryOptions({
        chainId,
        address,
        restBatcher: batcher,
        getIsWsConnected: () => true,
      })

      const mockQuery = {
        state: {
          data: { price: 2000, timestamp: Date.now() - STALE_PRICE_THRESHOLD_MS - 1_000, source: 'aurora_ws' },
        },
      }
      const interval =
        typeof options.refetchInterval === 'function'
          ? options.refetchInterval(mockQuery as never, {} as never)
          : options.refetchInterval
      expect(interval).toBe(REST_POLL_INTERVAL_MS)
    })

    it('returns REST_POLL_INTERVAL_MS when WS is connected but cache is empty', () => {
      const batcher = createMockBatcher()
      const options = tokenPriceQueryOptions({
        chainId,
        address,
        restBatcher: batcher,
        getIsWsConnected: () => true,
      })

      const mockQuery = { state: { data: null } }
      const interval =
        typeof options.refetchInterval === 'function'
          ? options.refetchInterval(mockQuery as never, {} as never)
          : options.refetchInterval
      expect(interval).toBe(REST_POLL_INTERVAL_MS)
    })

    it('returns false when WS is connected and data age is within threshold', () => {
      const batcher = createMockBatcher()
      const options = tokenPriceQueryOptions({
        chainId,
        address,
        restBatcher: batcher,
        getIsWsConnected: () => true,
      })

      // Use a small buffer (1s) inside the threshold so the test isn't
      // sensitive to wall-clock drift between setup and assertion.
      const mockQuery = {
        state: {
          data: { price: 2000, timestamp: Date.now() - STALE_PRICE_THRESHOLD_MS + 1_000, source: 'aurora_ws' },
        },
      }
      const interval =
        typeof options.refetchInterval === 'function'
          ? options.refetchInterval(mockQuery as never, {} as never)
          : options.refetchInterval
      expect(interval).toBe(false)
    })

    it('returns REST_POLL_INTERVAL_MS when getIsWsConnected is not provided', () => {
      const batcher = createMockBatcher()
      const options = tokenPriceQueryOptions({
        chainId,
        address,
        restBatcher: batcher,
      })

      const interval =
        typeof options.refetchInterval === 'function'
          ? options.refetchInterval({} as never, {} as never)
          : options.refetchInterval
      expect(interval).toBe(REST_POLL_INTERVAL_MS)
    })

    it('returns false when no restBatcher is provided', () => {
      const options = tokenPriceQueryOptions({ chainId, address })
      expect(options.refetchInterval).toBe(false)
    })
  })

  describe('queryFn cache shortcircuit', () => {
    it('skips REST fetch when cache has a recent WS update', async () => {
      const batcher = createMockBatcher({ price: 999, timestamp: Date.now(), source: 'aurora_rest_fallback' })
      const queryClient = new QueryClient()
      const recentTimestamp = Date.now() - 5_000 // 5 seconds ago

      const cached: TokenPriceData = { price: 2000, timestamp: recentTimestamp, source: 'aurora_ws' }
      queryClient.setQueryData(priceKeys.token(chainId, address), cached)

      const options = tokenPriceQueryOptions({ chainId, address, restBatcher: batcher, queryClient })
      const queryFn = options.queryFn as () => Promise<TokenPriceData | null>
      const result = await queryFn()

      expect(result).toEqual(cached)
      expect(batcher.fetch).not.toHaveBeenCalled()
    })

    it('calls REST when cache data is stale', async () => {
      const freshPrice: TokenPriceData = { price: 2100, timestamp: Date.now(), source: 'aurora_rest_fallback' }
      const batcher = createMockBatcher(freshPrice)
      const queryClient = new QueryClient()
      const staleTimestamp = Date.now() - REST_POLL_INTERVAL_MS - 1_000

      const stale: TokenPriceData = { price: 2000, timestamp: staleTimestamp, source: 'aurora_ws' }
      queryClient.setQueryData(priceKeys.token(chainId, address), stale)

      const options = tokenPriceQueryOptions({ chainId, address, restBatcher: batcher, queryClient })
      const queryFn = options.queryFn as () => Promise<TokenPriceData | null>
      const result = await queryFn()

      expect(batcher.fetch).toHaveBeenCalled()
      expect(result).toEqual(freshPrice)
    })

    it('calls REST when cache is empty', async () => {
      const freshPrice: TokenPriceData = { price: 2100, timestamp: Date.now(), source: 'aurora_rest_fallback' }
      const batcher = createMockBatcher(freshPrice)
      const queryClient = new QueryClient()

      const options = tokenPriceQueryOptions({ chainId, address, restBatcher: batcher, queryClient })
      const queryFn = options.queryFn as () => Promise<TokenPriceData | null>
      const result = await queryFn()

      expect(batcher.fetch).toHaveBeenCalled()
      expect(result).toEqual(freshPrice)
    })

    it('keeps existing data when REST returns older timestamp', async () => {
      const batcher = createMockBatcher({
        price: 1900,
        timestamp: Date.now() - 60_000,
        source: 'aurora_rest_fallback',
      })
      const queryClient = new QueryClient()
      const existingTimestamp = Date.now() - REST_POLL_INTERVAL_MS - 1_000

      const existing: TokenPriceData = { price: 2000, timestamp: existingTimestamp, source: 'aurora_ws' }
      queryClient.setQueryData(priceKeys.token(chainId, address), existing)

      const options = tokenPriceQueryOptions({ chainId, address, restBatcher: batcher, queryClient })
      const queryFn = options.queryFn as () => Promise<TokenPriceData | null>
      const result = await queryFn()

      expect(batcher.fetch).toHaveBeenCalled()
      expect(result).toEqual(existing)
    })

    it('uses WS update that arrived during REST fetch (race condition)', async () => {
      const queryClient = new QueryClient()
      const staleTimestamp = Date.now() - REST_POLL_INTERVAL_MS - 1_000
      const restTimestamp = Date.now() - 5_000
      const wsTimestamp = Date.now()

      // Cache starts stale so the short-circuit is bypassed
      const stale: TokenPriceData = { price: 2000, timestamp: staleTimestamp, source: 'aurora_ws' }
      queryClient.setQueryData(priceKeys.token(chainId, address), stale)

      const wsUpdate: TokenPriceData = { price: 2200, timestamp: wsTimestamp, source: 'aurora_ws' }

      // Simulate WS writing to cache while REST fetch is in flight
      const batcher = {
        fetch: vi.fn().mockImplementation(async () => {
          // WS update arrives during the fetch
          queryClient.setQueryData(priceKeys.token(chainId, address), wsUpdate)
          return { price: 2100, timestamp: restTimestamp, source: 'aurora_rest_fallback' } satisfies TokenPriceData
        }),
      } as unknown as RestPriceBatcher

      const options = tokenPriceQueryOptions({ chainId, address, restBatcher: batcher, queryClient })
      const queryFn = options.queryFn as () => Promise<TokenPriceData | null>
      const result = await queryFn()

      // Should return the WS update (2200), not the REST response (2100)
      expect(result).toEqual(wsUpdate)
    })
  })
})
