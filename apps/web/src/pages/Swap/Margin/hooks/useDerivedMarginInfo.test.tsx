import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { MarginQuoteRequest } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import {
  createMarginFormStore,
  type MarginFormStore,
} from 'uniswap/src/features/transactions/margin/stores/marginFormStore/createMarginFormStore'
import { MarginFormStoreContext } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/MarginFormStoreContext'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MARGIN_DEBOUNCE_MS } from '~/constants/margin'
import { getDefaultMarginMarket } from '~/pages/Swap/Margin/__fixtures__/marginCatalog'
import { useDerivedMarginInfo } from '~/pages/Swap/Margin/hooks/useDerivedMarginInfo'

const MARKET = getDefaultMarginMarket()

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
  useMarginVenueAllowlist: () => ({ allowedMarkets: [MARKET], allowedVenues: [MARKET.venue], excludedCount: 0 }),
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
  })
})
