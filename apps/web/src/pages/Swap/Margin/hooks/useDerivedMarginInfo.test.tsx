import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { MarginQuoteRequest } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { MARGIN_QUOTE_QUERY_KEY } from 'uniswap/src/data/apiClients/tradingApi/useMarginQuoteQuery'
import {
  createMarginFormStore,
  type MarginFormStore,
} from 'uniswap/src/features/transactions/margin/stores/marginFormStore/createMarginFormStore'
import { MarginFormStoreContext } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/MarginFormStoreContext'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MARGIN_DEBOUNCE_MS } from '~/constants/margin'
import { getDefaultMarginMarket } from '~/pages/Swap/Margin/__fixtures__/marginCatalog'
import { useDerivedMarginInfo } from '~/pages/Swap/Margin/hooks/useDerivedMarginInfo'

const MARKET_ID = '0x1cc83f2e3e44cd44fadedc9ee43109ffafc5609a46097183de1f53abcfc91733'
const MARKET = { ...getDefaultMarginMarket(), marketId: MARKET_ID, maxLeverage: 5 }
// The same pair at a second venue, listed second: the server's headline market.
const AAVE_MARKET_ID = '0x7d25d9a4127437970c901ef507e7593c79e5c3d329b5504fbe4f1d6c293855b2'
const AAVE_MARKET = {
  ...MARKET,
  key: `${MARKET.key}-aave`,
  venue: 'AAVE_V3' as const,
  marketId: AAVE_MARKET_ID,
  maxLeverage: 10,
  isHeadline: true,
}
// A third venue with a higher cap than MARKET and no headline flag.
const COMPOUND_MARKET_ID = '0x4f3a8e0c2b6d9a1e7c5f3b8d2a6e4c1f9b7d5a3e8c2f6b4d1a9e7c5b3f8d2a6e'
const COMPOUND_MARKET = {
  ...MARKET,
  key: `${MARKET.key}-compound`,
  venue: 'COMPOUND_V3' as const,
  marketId: COMPOUND_MARKET_ID,
  maxLeverage: 8,
}
const allowedMarketsRef = { current: [MARKET] as (typeof MARKET)[] }

const { mockUseMarginQuoteQuery } = vi.hoisted(() => ({ mockUseMarginQuoteQuery: vi.fn() }))

vi.mock('uniswap/src/data/apiClients/tradingApi/useMarginQuoteQuery', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/data/apiClients/tradingApi/useMarginQuoteQuery')>()),
  useMarginQuoteQuery: mockUseMarginQuoteQuery,
}))
vi.mock('~/connection/hooks/useAccount', () => ({
  useAccount: () => ({ address: '0x00000000000000000000000000000000000000A1' }),
}))
vi.mock('uniswap/src/features/portfolio/balances/hooks', () => ({
  usePortfolioBalances: () => ({ data: undefined, loading: false }),
}))
vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({ useCurrencyInfo: () => undefined }))
vi.mock('uniswap/src/features/transactions/hooks/useUSDCPrice', () => ({ useUSDCValue: () => undefined }))
vi.mock('~/pages/Swap/Margin/hooks/useMarginVenueAllowlist', () => ({
  useMarginVenueAllowlist: () => ({
    allowedMarkets: allowedMarketsRef.current,
    allowedVenues: allowedMarketsRef.current.map((m) => m.venue),
    excludedCount: 0,
  }),
}))
vi.mock('~/pages/Swap/Margin/hooks/useMarginVenueRoutedAnalytics', () => ({
  useMarginVenueRoutedAnalytics: () => undefined,
}))

// The leverage every render asked the quote for: react-query fetches once per distinct key, so the
// distinct values are the requests a drag would send.
function requestedLeverages(): string[] {
  const targets = mockUseMarginQuoteQuery.mock.calls
    .map((call: unknown[]) => JSON.stringify((call[0] as { params?: MarginQuoteRequest } | undefined)?.params ?? {}))
    .map((json) => /"leverageTarget":"([^"]+)"/.exec(json)?.[1])
    .filter((target): target is string => target !== undefined)
  return [...new Set(targets)]
}

function renderDerived(store: MarginFormStore): { current: ReturnType<typeof useDerivedMarginInfo> } {
  const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
    <MarginFormStoreContext.Provider value={store}>{children}</MarginFormStoreContext.Provider>
  )
  return renderHook(() => useDerivedMarginInfo({ market: MARKET }), { wrapper }).result
}

beforeEach(() => {
  allowedMarketsRef.current = [MARKET]
  vi.useFakeTimers()
  mockUseMarginQuoteQuery.mockReset()
  mockUseMarginQuoteQuery.mockReturnValue({
    data: undefined,
    isLoading: false,
    isFetching: false,
    isPlaceholderData: false,
    error: null,
  })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useDerivedMarginInfo — quote debounce', () => {
  // The slider writes `leverage` on every move, so the debounce is the only thing between a drag and a
  // request per frame.
  it('asks for one quote after a slider drag settles, not one per move', () => {
    const store = createMarginFormStore({ initialState: { marginAmount: '1', leverage: 2 } })
    const result = renderDerived(store)
    act(() => {
      vi.advanceTimersByTime(MARGIN_DEBOUNCE_MS)
    })
    expect(requestedLeverages()).toEqual(['2.00'])

    for (const leverage of [2.2, 2.6, 3.1, 3.4]) {
      act(() => store.getState().actions.setMarginFormState({ leverage }))
      act(() => {
        vi.advanceTimersByTime(16)
      })
    }
    // The readout follows the thumb while the quote is still asked at the settled value.
    expect(result.current.leverage).toBe(3.4)
    expect(result.current.isDebouncing).toBe(true)
    expect(requestedLeverages()).toEqual(['2.00'])

    act(() => {
      vi.advanceTimersByTime(MARGIN_DEBOUNCE_MS)
    })
    expect(result.current.isDebouncing).toBe(false)
    expect(requestedLeverages()).toEqual(['2.00', '3.40'])
  })

  // One shared timer: an amount edit and a leverage move inside one window land in the same request,
  // never a new amount paired with the old leverage.
  it('debounces the amount and leverage together', () => {
    const store = createMarginFormStore({ initialState: { marginAmount: '1', leverage: 2 } })
    renderDerived(store)
    act(() => {
      vi.advanceTimersByTime(MARGIN_DEBOUNCE_MS)
    })
    act(() => store.getState().actions.setMarginFormState({ marginAmount: '2' }))
    act(() => {
      vi.advanceTimersByTime(MARGIN_DEBOUNCE_MS - 100)
    })
    act(() => store.getState().actions.setMarginFormState({ leverage: 3 }))
    act(() => {
      vi.advanceTimersByTime(MARGIN_DEBOUNCE_MS - 100)
    })
    expect(requestedLeverages()).toEqual(['2.00'])
    act(() => {
      vi.advanceTimersByTime(100)
    })
    const last = mockUseMarginQuoteQuery.mock.calls.at(-1)?.[0] as { params?: MarginQuoteRequest }
    expect(JSON.stringify(last.params)).toMatch(/"leverageTarget":"3.00"/)
    expect(JSON.stringify(last.params)).toMatch(/"amount":"2000000000000000000"/)
    expect(JSON.stringify(last.params)).toContain(`"marketId":"${MARKET_ID}"`)
  })

  // Auto opens on the headline market whatever the leverage. A pin narrowing the allowlist moves the
  // open off it, and the previous quote stays bridged so the receipt does not unmount mid-pick.
  it('opens on the headline market, and keeps the quote bridged when a pin moves it', () => {
    allowedMarketsRef.current = [MARKET, AAVE_MARKET]
    const store = createMarginFormStore({ initialState: { marginAmount: '1', leverage: 2 } })
    renderDerived(store)
    act(() => {
      vi.advanceTimersByTime(MARGIN_DEBOUNCE_MS)
    })
    act(() => store.getState().actions.setMarginFormState({ leverage: 6 }))
    act(() => {
      vi.advanceTimersByTime(MARGIN_DEBOUNCE_MS)
    })
    const before = mockUseMarginQuoteQuery.mock.calls.at(-1)?.[0] as { params?: MarginQuoteRequest }
    expect(JSON.stringify(before.params)).toContain(`"marketId":"${AAVE_MARKET_ID}"`)

    allowedMarketsRef.current = [MARKET]
    act(() => store.getState().actions.setMarginFormState({ leverage: 3 }))
    act(() => {
      vi.advanceTimersByTime(MARGIN_DEBOUNCE_MS)
    })
    const after = mockUseMarginQuoteQuery.mock.calls.at(-1)?.[0] as {
      params?: MarginQuoteRequest
      placeholderData: (previousData: unknown, previousQuery: { queryKey: unknown[] }) => unknown
    }
    expect(JSON.stringify(after.params)).toContain(`"marketId":"${MARKET_ID}"`)
    const previousQuote = { requestId: 'previous' }
    expect(after.placeholderData(previousQuote, { queryKey: [...MARGIN_QUOTE_QUERY_KEY, before.params] })).toBe(
      previousQuote,
    )
  })

  // The slider cap is the max over every allowed market, so without the headline the open must go to a
  // market that carries the leverage, not the first one listed: /margin/quote refuses above its cap.
  it('opens on a market that carries the leverage when the headline is excluded', () => {
    allowedMarketsRef.current = [MARKET, COMPOUND_MARKET]
    const store = createMarginFormStore({ initialState: { marginAmount: '1', leverage: 7 } })
    const result = renderDerived(store)
    act(() => {
      vi.advanceTimersByTime(MARGIN_DEBOUNCE_MS)
    })
    expect(result.current.maxLeverage).toBe(8)
    const last = mockUseMarginQuoteQuery.mock.calls.at(-1)?.[0] as { params?: MarginQuoteRequest }
    expect(JSON.stringify(last.params)).toContain(`"marketId":"${COMPOUND_MARKET_ID}"`)
  })
})
