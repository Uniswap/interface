// @vitest-environment jsdom
// jsdom for the same reason as tokenPriceStaleAfterBackground.test.ts:
// query-core's `isServer` check skips timers and fetch scheduling under node.
import { QueryClient, QueryObserver } from '@tanstack/react-query'
import { priceKeys } from '@universe/prices/src/queries/priceKeys'
import { tokenPriceQueryOptions } from '@universe/prices/src/queries/tokenPriceQueryOptions'
import { MAX_DISPLAYABLE_PRICE_AGE_MS } from '@universe/prices/src/sources/rest/constants'
import type { RestPriceBatcher } from '@universe/prices/src/sources/rest/RestPriceBatcher'
import type { TokenPriceData } from '@universe/prices/src/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * A mounted observer switching ONTO a token whose cached entry is old (e.g.
 * rehydrated from disk) must fetch right away. `refetchOnMount` does not run
 * on a key change, so without an age-aware `staleTime` the withheld price sat
 * until the next poll tick — the Buy form switching from mainnet ETH to ETH on
 * Arbitrum showed "0 ETH" and a disabled Continue for ~30s.
 */
const ADDRESS = '0x0000000000000000000000000000000000000000'
const FROM_CHAIN = 1
const TO_CHAIN = 42161
const REST_PRICE = 4_000

function setup(): {
  queryClient: QueryClient
  fetchSpy: ReturnType<typeof vi.fn>
  observer: QueryObserver<TokenPriceData | null>
  restBatcher: RestPriceBatcher
  dispose: () => void
} {
  const fetchSpy = vi.fn(async () => ({
    price: REST_PRICE,
    timestamp: Date.now(),
    source: 'aurora_rest_fallback' as const,
  }))
  const restBatcher = { fetch: fetchSpy } as unknown as RestPriceBatcher
  const queryClient = new QueryClient()
  queryClient.mount()
  queryClient.setQueryData<TokenPriceData>(priceKeys.token(FROM_CHAIN, ADDRESS), {
    price: 3_999,
    timestamp: Date.now(),
    source: 'aurora_ws',
  })

  const observer = new QueryObserver<TokenPriceData | null>(
    queryClient,
    tokenPriceQueryOptions({ chainId: FROM_CHAIN, address: ADDRESS, restBatcher, queryClient }) as never,
  )
  const unsubscribe = observer.subscribe(() => undefined)

  return {
    queryClient,
    fetchSpy,
    observer,
    restBatcher,
    dispose: () => {
      unsubscribe()
      queryClient.unmount()
    },
  }
}

describe('tokenPriceQueryOptions on a key switch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('fetches immediately when switching onto an aged cached entry', async () => {
    const { queryClient, fetchSpy, observer, restBatcher, dispose } = setup()
    const toKey = priceKeys.token(TO_CHAIN, ADDRESS)
    queryClient.setQueryData<TokenPriceData>(toKey, {
      price: 1,
      timestamp: Date.now() - MAX_DISPLAYABLE_PRICE_AGE_MS - 60_000,
      source: 'aurora_ws',
    })

    observer.setOptions(
      tokenPriceQueryOptions({ chainId: TO_CHAIN, address: ADDRESS, restBatcher, queryClient }) as never,
    )
    await vi.advanceTimersByTimeAsync(0)

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(queryClient.getQueryData<TokenPriceData>(toKey)?.price).toBe(REST_PRICE)

    dispose()
  })

  it('does not fetch when switching onto a fresh cached entry', async () => {
    const { queryClient, fetchSpy, observer, restBatcher, dispose } = setup()
    queryClient.setQueryData<TokenPriceData>(priceKeys.token(TO_CHAIN, ADDRESS), {
      price: 4_001,
      timestamp: Date.now(),
      source: 'aurora_ws',
    })

    observer.setOptions(
      tokenPriceQueryOptions({ chainId: TO_CHAIN, address: ADDRESS, restBatcher, queryClient }) as never,
    )
    await vi.advanceTimersByTimeAsync(0)

    expect(fetchSpy).not.toHaveBeenCalled()

    dispose()
  })
})
