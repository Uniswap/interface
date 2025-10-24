import { renderHook } from '@testing-library/react'
import { Currency, Price } from '@uniswap/sdk-core'
import { useGetRangeDisplay } from 'components/Liquidity/hooks/useGetRangeDisplay'
import useIsTickAtLimit from 'hooks/useIsTickAtLimit'
import { Bound } from 'state/mint/v3/actions'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('hooks/useIsTickAtLimit', () => ({
  default: vi.fn(),
}))
const useIsTickAtLimitMock = vi.mocked(useIsTickAtLimit)

function createCurrency(symbol: string): Currency {
  return {
    decimals: 18,
    symbol,
    name: symbol,
  } as unknown as Currency
}

function createPrice({
  baseCurrency,
  quoteCurrency,
  value,
}: {
  baseCurrency: Currency
  quoteCurrency: Currency
  value: string
}): Price<Currency, Currency> {
  return new Price(baseCurrency, quoteCurrency, '1', value)
}

describe('useGetRangeDisplay', () => {
  const base = createCurrency('BASE')
  const quote = createCurrency('QUOTE')
  const priceLower = createPrice({ baseCurrency: base, quoteCurrency: quote, value: '100' })
  const priceUpper = createPrice({ baseCurrency: base, quoteCurrency: quote, value: '200' })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns formatted prices and symbols for normal range', () => {
    useIsTickAtLimitMock.mockReturnValue({ [Bound.LOWER]: false, [Bound.UPPER]: false })
    const { result } = renderHook(() =>
      useGetRangeDisplay({
        priceOrdering: { priceLower, priceUpper, quote, base },
        pricesInverted: false,
        tickSpacing: 1,
        tickLower: 10,
        tickUpper: 20,
      }),
    )
    expect(result.current.minPrice).toBe('100')
    expect(result.current.maxPrice).toBe('200')
    expect(result.current.tokenASymbol).toBe('QUOTE')
    expect(result.current.tokenBSymbol).toBe('BASE')
    expect(result.current.isFullRange).toBe(false)
  })

  it('returns 0 and ∞ for full range', () => {
    useIsTickAtLimitMock.mockReturnValue({ [Bound.LOWER]: true, [Bound.UPPER]: true })
    const { result } = renderHook(() =>
      useGetRangeDisplay({
        priceOrdering: { priceLower, priceUpper, quote, base },
        pricesInverted: false,
        tickSpacing: 1,
        tickLower: 10,
        tickUpper: 20,
      }),
    )
    expect(result.current.minPrice).toBe('0')
    expect(result.current.maxPrice).toBe('∞')
    expect(result.current.tokenASymbol).toBe('QUOTE')
    expect(result.current.tokenBSymbol).toBe('BASE')
    expect(result.current.isFullRange).toBe(true)
  })

  it('returns - for missing price', () => {
    useIsTickAtLimitMock.mockReturnValue({ [Bound.LOWER]: false, [Bound.UPPER]: false })
    const { result } = renderHook(() =>
      useGetRangeDisplay({
        priceOrdering: { priceLower: undefined, priceUpper, quote, base },
        pricesInverted: false,
        tickSpacing: 1,
        tickLower: 10,
        tickUpper: 20,
      }),
    )
    expect(result.current.minPrice).toBe('-')
    expect(result.current.maxPrice).toBe('200')
    expect(result.current.tokenASymbol).toBe('QUOTE')
    expect(result.current.tokenBSymbol).toBe('BASE')
    expect(result.current.isFullRange).toBe(false)
  })

  it('handles inverted prices for normal range', () => {
    useIsTickAtLimitMock.mockReturnValue({ [Bound.LOWER]: false, [Bound.UPPER]: false })
    const { result } = renderHook(() =>
      useGetRangeDisplay({
        priceOrdering: { priceLower, priceUpper, quote, base },
        pricesInverted: true,
        tickSpacing: 1,
        tickLower: 10,
        tickUpper: 20,
      }),
    )
    expect(result.current.minPrice).toBe('0.005')
    expect(result.current.maxPrice).toBe('0.01')
    expect(result.current.tokenASymbol).toBe('BASE')
    expect(result.current.tokenBSymbol).toBe('QUOTE')
    expect(result.current.isFullRange).toBe(false)
  })

  it('handles inverted prices for full range', () => {
    useIsTickAtLimitMock.mockReturnValue({ [Bound.LOWER]: true, [Bound.UPPER]: true })
    const { result } = renderHook(() =>
      useGetRangeDisplay({
        priceOrdering: { priceLower, priceUpper, quote, base },
        pricesInverted: true,
        tickSpacing: 1,
        tickLower: 10,
        tickUpper: 20,
      }),
    )
    expect(result.current.minPrice).toBe('0')
    expect(result.current.maxPrice).toBe('∞')
    expect(result.current.tokenASymbol).toBe('BASE')
    expect(result.current.tokenBSymbol).toBe('QUOTE')
    expect(result.current.isFullRange).toBe(true)
  })

  it('handles missing tickSpacing, tickLower, tickUpper', () => {
    useIsTickAtLimitMock.mockReturnValue({ [Bound.LOWER]: false, [Bound.UPPER]: false })
    const { result } = renderHook(() =>
      useGetRangeDisplay({
        priceOrdering: { priceLower, priceUpper, quote, base },
        pricesInverted: false,
      }),
    )
    expect(result.current.minPrice).toBe('100')
    expect(result.current.maxPrice).toBe('200')
  })
})
