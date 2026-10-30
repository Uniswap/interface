import { renderHook } from '@testing-library/react'
import { MarginDirection, type MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { marginMarketKey, type MarginMarket, type MarginTokenInfo } from '~/constants/margin'
import { useMarginVenueAllowlist } from '~/pages/Swap/Margin/hooks/useMarginVenueAllowlist'

const { mockGetPairMarkets, excludedRef } = vi.hoisted(() => ({
  mockGetPairMarkets: vi.fn(),
  excludedRef: { current: [] as MarginVenue[] },
}))

vi.mock('~/pages/Swap/Margin/hooks/useMarginMarkets', () => ({
  useMarginMarkets: () => ({ getPairMarkets: mockGetPairMarkets }),
}))

vi.mock('uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore', () => ({
  useMarginFormStore: (selector: (s: { excludedVenues: MarginVenue[] }) => unknown) =>
    selector({ excludedVenues: excludedRef.current }),
}))

const WETH: MarginTokenInfo = { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', decimals: 18 }
const USDC: MarginTokenInfo = { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', decimals: 6 }

function marketFixture({ venue, maxLeverage }: { venue: MarginVenue; maxLeverage: number }): MarginMarket {
  return {
    key: marginMarketKey({ collateralToken: WETH.address, debtToken: USDC.address, venue }),
    asset: 'ETH',
    name: 'Ethereum',
    displaySymbol: 'ETH',
    collateral: WETH,
    debt: USDC,
    venue,
    direction: MarginDirection.LONG,
    lltvWad: '860000000000000000',
    maxLeverage,
    shouldUseNativeEquity: true,
  }
}

const MORPHO = marketFixture({ venue: 'MORPHO', maxLeverage: 3 })
const AAVE_V3 = marketFixture({ venue: 'AAVE_V3', maxLeverage: 5 })
// One array instance, as useMarginMarkets' memo hands out — a fresh one per call would defeat the
// memoization this hook exists to provide.
const PAIR_MARKETS = [AAVE_V3, MORPHO]

function renderAllowlist(): ReturnType<typeof renderHook<ReturnType<typeof useMarginVenueAllowlist>, unknown>> {
  return renderHook(() => useMarginVenueAllowlist({ market: MORPHO })) as ReturnType<
    typeof renderHook<ReturnType<typeof useMarginVenueAllowlist>, unknown>
  >
}

describe('useMarginVenueAllowlist', () => {
  beforeEach(() => {
    excludedRef.current = []
    mockGetPairMarkets.mockReset()
    mockGetPairMarkets.mockReturnValue(PAIR_MARKETS)
  })

  it('defaults to the whole pair: nothing excluded', () => {
    const { result } = renderAllowlist()
    expect(result.current.allowedVenues).toEqual(['AAVE_V3', 'MORPHO'])
    expect(result.current.allowedMarkets.map((market) => market.venue)).toEqual(['AAVE_V3', 'MORPHO'])
    expect(result.current.excludedCount).toBe(0)
  })

  it('drops an excluded venue from both the wire list and the ceiling set', () => {
    excludedRef.current = ['AAVE_V3']
    const { result } = renderAllowlist()
    expect(result.current.allowedVenues).toEqual(['MORPHO'])
    expect(result.current.allowedMarkets.map((market) => market.venue)).toEqual(['MORPHO'])
    expect(result.current.excludedCount).toBe(1)
  })

  // The empty allowlist is what disables the quote query — it must never reach the wire.
  it('goes empty when every venue is excluded', () => {
    excludedRef.current = ['AAVE_V3', 'MORPHO']
    const { result } = renderAllowlist()
    expect(result.current.allowedVenues).toEqual([])
    expect(result.current.excludedCount).toBe(2)
  })

  // The preference is global, so it names venues a given pair may not offer; counting those would
  // overstate what the user turned off here.
  it('counts only the exclusions the pair actually offers', () => {
    excludedRef.current = ['AAVE_V4']
    const { result } = renderAllowlist()
    expect(result.current.allowedVenues).toEqual(['AAVE_V3', 'MORPHO'])
    expect(result.current.excludedCount).toBe(0)
  })

  // The derived list is the quote's query key: an identity that churned per render would re-quote on
  // every keystroke.
  it('keeps a stable identity across renders and re-derives on a real change', () => {
    const { result, rerender } = renderAllowlist()
    const first = result.current.allowedVenues
    rerender()
    expect(result.current.allowedVenues).toBe(first)

    excludedRef.current = ['MORPHO']
    rerender()
    expect(result.current.allowedVenues).not.toBe(first)
    expect(result.current.allowedVenues).toEqual(['AAVE_V3'])
  })
})
