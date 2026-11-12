// @vitest-environment jsdom
// jsdom, not the package default: query-core's `isServer` (`typeof window ===
// 'undefined'`) short-circuits `#updateRefetchInterval`, so a node-environment
// test can never observe whether a poll timer is armed and would pass for the
// wrong reason.
import { focusManager, onlineManager, QueryClient, QueryObserver } from '@tanstack/react-query'
import { priceKeys } from '@universe/prices/src/queries/priceKeys'
import { tokenPriceQueryOptions } from '@universe/prices/src/queries/tokenPriceQueryOptions'
import { REST_POLL_INTERVAL_MS } from '@universe/prices/src/sources/rest/constants'
import type { RestPriceBatcher } from '@universe/prices/src/sources/rest/RestPriceBatcher'
import type { TokenPriceData } from '@universe/prices/src/types'
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

/**
 * The freshness contract this query owes its consumers when the WS stream
 * stops delivering — whether the tab was backgrounded or the stream died
 * silently in a focused tab (a dropped per-token subscription on a healthy
 * socket, CONS-3207).
 *
 * The failure these pin: a CONDITIONAL `refetchInterval` that returns `false`
 * while the stream looks healthy is CLEARED by query-core and re-evaluated
 * only on a cache write for this key or an observer `setOptions` — and a
 * silently dead stream produces neither, freezing the price for as long as
 * the page lives. The interval must therefore be unconditional; the queryFn's
 * skip-if-fresh guard is what keeps healthy tokens off the wire.
 */
const CHAIN_ID = 1
const ADDRESS = '0xabc'
const KEY = priceKeys.token(CHAIN_ID, ADDRESS)

const REST_PRICE = 999

/** A client with the app-wide defaults these options have to survive
 * (lib/queryClient's CLIENT_CONFIG): focus and reconnect refetch are OFF by
 * default, so an opt-in here is the only thing that can fire. */
function createClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { refetchOnWindowFocus: false, refetchOnReconnect: false, staleTime: 30_000 } },
  })
}

interface Harness {
  queryClient: QueryClient
  fetchSpy: Mock
  writeTick: () => void
  /** Advance fake time in steps while a WS tick lands every `tickEveryMs`. */
  advanceWithTicks: (totalMs: number, tickEveryMs: number) => Promise<void>
  dispose: () => void
}

/** Mounts an observer on a cache already holding a fresh WS tick — the state
 * a row is in while its stream is healthy. */
function mountLiveStream(): Harness {
  const fetchSpy = vi.fn(async () => ({
    price: REST_PRICE,
    timestamp: Date.now(),
    source: 'aurora_rest_fallback' as const,
  }))
  const restBatcher = { fetch: fetchSpy } as unknown as RestPriceBatcher
  const queryClient = createClient()
  queryClient.mount()
  const writeTick = (): void => {
    queryClient.setQueryData<TokenPriceData>(KEY, { price: 100, timestamp: Date.now(), source: 'aurora_ws' })
  }
  writeTick()

  const observer = new QueryObserver(
    queryClient,
    tokenPriceQueryOptions({ chainId: CHAIN_ID, address: ADDRESS, restBatcher, queryClient }) as never,
  )
  const unsubscribe = observer.subscribe(() => undefined)

  return {
    queryClient,
    fetchSpy,
    writeTick,
    advanceWithTicks: async (totalMs, tickEveryMs) => {
      for (let elapsed = 0; elapsed < totalMs; elapsed += tickEveryMs) {
        await vi.advanceTimersByTimeAsync(tickEveryMs)
        writeTick()
      }
    },
    dispose: () => {
      unsubscribe()
      queryClient.unmount()
    },
  }
}

describe('tokenPriceQueryOptions freshness when the WS stream stops', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    focusManager.setFocused(true)
    onlineManager.setOnline(true)
  })
  afterEach(() => {
    vi.useRealTimers()
    focusManager.setFocused(undefined)
    onlineManager.setOnline(true)
  })

  it('costs no REST call while the stream is healthy', async () => {
    const harness = mountLiveStream()
    // Ticks land well inside the skip-if-fresh window: every poll tick returns
    // the cached entry without touching the wire.
    await harness.advanceWithTicks(REST_POLL_INTERVAL_MS * 4, REST_POLL_INTERVAL_MS / 2)
    expect(harness.fetchSpy).not.toHaveBeenCalled()

    harness.dispose()
  })

  it('polls REST when the stream dies silently in a focused tab (CONS-3207)', async () => {
    const harness = mountLiveStream()
    await harness.advanceWithTicks(REST_POLL_INTERVAL_MS * 2, REST_POLL_INTERVAL_MS / 2)
    expect(harness.fetchSpy).not.toHaveBeenCalled()

    // The stream dies: no more ticks, no focus/reconnect events, no
    // re-renders. The unconditional poll is the only rescue path.
    await vi.advanceTimersByTimeAsync(REST_POLL_INTERVAL_MS * 2 + 1_000)
    expect(harness.fetchSpy).toHaveBeenCalled()
    expect(harness.queryClient.getQueryData<TokenPriceData>(KEY)?.price).toBe(REST_PRICE)

    harness.dispose()
  })

  it('keeps polling after the first rescue, not one-shot', async () => {
    const harness = mountLiveStream()
    await vi.advanceTimersByTimeAsync(REST_POLL_INTERVAL_MS * 2 + 1_000)
    const afterFirstRescue = harness.fetchSpy.mock.calls.length
    expect(afterFirstRescue).toBeGreaterThan(0)

    await vi.advanceTimersByTimeAsync(REST_POLL_INTERVAL_MS * 3)
    expect(harness.fetchSpy.mock.calls.length).toBeGreaterThan(afterFirstRescue)

    harness.dispose()
  })

  it('refetches on the focus that ends a long hidden stretch', async () => {
    const harness = mountLiveStream()
    // Hidden for half an hour; the socket dies and stops writing the cache,
    // and interval fetches are paused while unfocused.
    focusManager.setFocused(false)
    await vi.advanceTimersByTimeAsync(30 * 60_000)
    expect(harness.fetchSpy).not.toHaveBeenCalled()

    // Back in the foreground: the price must refresh immediately off the
    // focus refetch, not wait out a full poll interval.
    focusManager.setFocused(true)
    await vi.advanceTimersByTimeAsync(0)
    expect(harness.fetchSpy).toHaveBeenCalled()
    expect(harness.queryClient.getQueryData<TokenPriceData>(KEY)?.price).toBe(REST_PRICE)

    harness.dispose()
  })

  it('refetches when the browser comes back online', async () => {
    const harness = mountLiveStream()
    onlineManager.setOnline(false)
    await vi.advanceTimersByTimeAsync(10 * 60_000)

    onlineManager.setOnline(true)
    await vi.advanceTimersByTimeAsync(0)
    expect(harness.fetchSpy).toHaveBeenCalled()

    harness.dispose()
  })

  it('costs no network call on a focus while the stream is healthy', async () => {
    const harness = mountLiveStream()
    // Focus refetch is 'always', so the queryFn runs — but its skip-if-fresh
    // guard has to keep a plain app switch off the wire.
    focusManager.setFocused(false)
    await vi.advanceTimersByTimeAsync(1_000)
    focusManager.setFocused(true)
    await vi.advanceTimersByTimeAsync(0)
    expect(harness.fetchSpy).not.toHaveBeenCalled()

    harness.dispose()
  })
})
