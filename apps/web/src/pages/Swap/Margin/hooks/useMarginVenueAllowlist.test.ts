import { renderHook } from '@testing-library/react'
import { FetchError } from '@universe/api'
import { marginPairKey } from 'uniswap/src/features/transactions/margin/marginPairKey'
import { MarginDirection, type MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { marginMarketKey, type MarginMarket, type MarginTokenInfo } from '~/constants/margin'
import {
  useClearMarginVenuePinOnQuoteError,
  useMarginVenueAllowlist,
} from '~/pages/Swap/Margin/hooks/useMarginVenueAllowlist'

const { mockGetPairMarkets, excludedRef, pinRef, mockSetMarginFormState } = vi.hoisted(() => ({
  mockGetPairMarkets: vi.fn(),
  excludedRef: { current: [] as MarginVenue[] },
  pinRef: { current: undefined as { pairKey: string; venue: MarginVenue } | undefined },
  mockSetMarginFormState: vi.fn(),
}))

vi.mock('~/features/margin/hooks/useMarginMarkets', () => ({
  useMarginMarkets: () => ({ getPairMarkets: mockGetPairMarkets }),
}))

vi.mock('uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore', () => ({
  useMarginFormStore: (
    selector: (s: {
      excludedVenues: MarginVenue[]
      pinnedVenue: { pairKey: string; venue: MarginVenue } | undefined
    }) => unknown,
  ) => selector({ excludedVenues: excludedRef.current, pinnedVenue: pinRef.current }),
  useMarginFormStoreActions: () => ({ setMarginFormState: mockSetMarginFormState }),
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

describe('useClearMarginVenuePinOnQuoteError', () => {
  const PIN = {
    pairKey: marginPairKey({ collateralToken: WETH.address, debtToken: USDC.address }),
    venue: 'MORPHO' as const,
  }
  // The trading API's wire shape for a margin refusal: coarse ErrorType in `errorCode`, margin code in `detail`.
  const refusal = ({ status, detail }: { status: number; detail: string }): FetchError =>
    new FetchError({
      response: new Response(null, { status }),
      data: { errorCode: status === 400 ? 'BadRequest' : 'UnprocessableEntity', detail },
    })
  const NO_ELIGIBLE_VENUE = refusal({ status: 422, detail: 'MARGIN_NO_ELIGIBLE_VENUE' })

  beforeEach(() => {
    pinRef.current = undefined
    mockSetMarginFormState.mockReset()
  })

  // The picker lives in the receipt, which a failed quote unmounts: a kept pin would strand the form.
  it.each([
    ['no eligible venue', NO_ELIGIBLE_VENUE],
    ['no venue able to lend enough', refusal({ status: 422, detail: 'MARGIN_INSUFFICIENT_BORROW_LIQUIDITY' })],
    ['no named venue configured', refusal({ status: 400, detail: 'MARGIN_MARKET_NOT_SUPPORTED' })],
    ['a code followed by a hint', refusal({ status: 422, detail: 'MARGIN_NO_ELIGIBLE_VENUE: none of MORPHO' })],
    [
      'a per-reason errorCode with prose detail',
      new FetchError({
        response: new Response(null, { status: 422 }),
        data: { errorCode: 'MARGIN_INSUFFICIENT_BORROW_LIQUIDITY', detail: 'Insufficient borrow liquidity' },
      }),
    ],
  ])('clears the pin when the pinned venue cannot fill (%s) and no quote is left', (_, quoteError) => {
    pinRef.current = PIN
    renderHook(() => useClearMarginVenuePinOnQuoteError({ market: MORPHO, quoteError, hasQuote: false }))
    expect(mockSetMarginFormState).toHaveBeenCalledWith({ pinnedVenue: undefined })
  })

  // react-query keeps `error` set after a failed background refetch while the last quote still shows.
  it('keeps the pin while a quote is still on screen, even on a venue refusal', () => {
    pinRef.current = PIN
    renderHook(() =>
      useClearMarginVenuePinOnQuoteError({ market: MORPHO, quoteError: NO_ELIGIBLE_VENUE, hasQuote: true }),
    )
    expect(mockSetMarginFormState).not.toHaveBeenCalled()
  })

  it.each([
    [
      'a 5xx',
      new FetchError({
        response: new Response(null, { status: 503 }),
        data: { detail: 'MARGIN_MARKET_READ_UNAVAILABLE' },
      }),
    ],
    ['a network error', new TypeError('Failed to fetch')],
    ['a swap-leg refusal', refusal({ status: 422, detail: 'MARGIN_SWAP_INSUFFICIENT_LIQUIDITY' })],
  ])('keeps the pin on %s, which says nothing about the venue', (_, quoteError) => {
    pinRef.current = PIN
    renderHook(() => useClearMarginVenuePinOnQuoteError({ market: MORPHO, quoteError, hasQuote: false }))
    expect(mockSetMarginFormState).not.toHaveBeenCalled()
  })

  it('keeps the pin while the quote succeeds', () => {
    pinRef.current = PIN
    renderHook(() => useClearMarginVenuePinOnQuoteError({ market: MORPHO, quoteError: null, hasQuote: true }))
    expect(mockSetMarginFormState).not.toHaveBeenCalled()
  })

  // A pin on another pair isn't routing this quote, so this quote's failure says nothing about it.
  it('keeps a pin picked on another pair when this pair errors', () => {
    pinRef.current = {
      pairKey: marginPairKey({ collateralToken: USDC.address, debtToken: WETH.address }),
      venue: 'MORPHO',
    }
    renderHook(() =>
      useClearMarginVenuePinOnQuoteError({ market: MORPHO, quoteError: NO_ELIGIBLE_VENUE, hasQuote: false }),
    )
    expect(mockSetMarginFormState).not.toHaveBeenCalled()
  })
})
