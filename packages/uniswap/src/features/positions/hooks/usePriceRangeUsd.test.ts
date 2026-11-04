import { renderHook, type RenderHookResult } from '@testing-library/react'
import { Currency, CurrencyAmount, Price, Token } from '@uniswap/sdk-core'
import { nearestUsableTick, TickMath } from '@uniswap/v3-sdk'
import { usePriceRangeUsd } from 'uniswap/src/features/positions/hooks/usePriceRangeUsd'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockUseUSDCValue } = vi.hoisted(() => ({
  mockUseUSDCValue: vi.fn(
    (amount: CurrencyAmount<Currency> | null | undefined): CurrencyAmount<Currency> | null => amount ?? null,
  ),
}))

vi.mock('uniswap/src/features/transactions/hooks/useUSDCPrice', () => ({
  useUSDCValue: (amount: CurrencyAmount<Currency> | null | undefined): CurrencyAmount<Currency> | null =>
    mockUseUSDCValue(amount),
}))

vi.mock('uniswap/src/features/language/LocalizationContext', () => ({
  useLocalizationContext: () => ({
    convertFiatAmountFormatted: (value: string | number | undefined) => (value !== undefined ? `$${value}` : '-'),
  }),
}))

const token0 = new Token(1, '0x0000000000000000000000000000000000000001', 18, 'ETH', 'Ether')
const token1 = new Token(1, '0x0000000000000000000000000000000000000002', 18, 'DAI', 'Dai')

const priceLower = new Price(token0, token1, 1, 1500)
const priceUpper = new Price(token0, token1, 1, 2500)
const token0Price = new Price(token0, token1, 1, 2000)
const token1Price = token0Price.invert()
type UsePriceRangeUsdParams = Parameters<typeof usePriceRangeUsd>[0]
type UsePriceRangeUsdResult = ReturnType<typeof usePriceRangeUsd>

function renderUsePriceRangeUsd(
  overrides: Partial<UsePriceRangeUsdParams> = {},
): RenderHookResult<UsePriceRangeUsdResult, undefined> {
  return renderHook(() =>
    usePriceRangeUsd({
      priceLower,
      priceUpper,
      token0Price,
      token1Price,
      priceInverted: false,
      ...overrides,
    }),
  )
}

describe('usePriceRangeUsd', () => {
  beforeEach(() => {
    mockUseUSDCValue.mockReset()
    mockUseUSDCValue.mockImplementation((amount) => amount ?? null)
  })

  it('formats min, max, and market prices as USD values in token0 orientation', () => {
    const { result } = renderUsePriceRangeUsd()

    expect(result.current).toEqual({
      minPrice: '$1500',
      maxPrice: '$2500',
      marketPrice: '$2000',
    })
  })

  it('uses inverted bounds and market price when priceInverted is true', () => {
    const { result } = renderUsePriceRangeUsd({ priceInverted: true })

    expect(result.current).toEqual({
      minPrice: '$0.0004',
      maxPrice: '$0.000666666666666666666',
      marketPrice: '$0.0005',
    })
  })

  it('renders full-range min and max sentinels instead of formatting tick-limit prices', () => {
    const tickSpacing = 60
    const { result } = renderUsePriceRangeUsd({
      tickSpacing,
      tickLower: nearestUsableTick(TickMath.MIN_TICK, tickSpacing),
      tickUpper: nearestUsableTick(TickMath.MAX_TICK, tickSpacing),
    })

    expect(result.current).toEqual({
      minPrice: '0',
      maxPrice: '∞',
      marketPrice: '$2000',
    })
  })

  it('keeps sub-$0.000001 prices instead of flooring them to the stablecoin decimals', () => {
    const usdc = new Token(1, '0x0000000000000000000000000000000000000003', 6, 'USDC', 'USD Coin')
    // 1 DAI = 1 USDC
    const daiUsdcPrice: Price<Currency, Currency> = new Price(token1, usdc, '1000000000000000000', '1000000')
    mockUseUSDCValue.mockImplementation((amount) => (amount ? daiUsdcPrice.quote(amount) : null))
    // 5e-10 DAI per token0
    const tinyPrice = new Price(token0, token1, 10_000_000_000, 5)

    const { result } = renderUsePriceRangeUsd({ priceLower: tinyPrice, token0Price: tinyPrice })

    expect(result.current.minPrice).toBe('$0.0000000005')
    expect(result.current.marketPrice).toBe('$0.0000000005')
  })

  it('falls back to dashes when prices are unavailable', () => {
    const { result } = renderUsePriceRangeUsd({
      priceLower: undefined,
      priceUpper: undefined,
      token0Price: undefined,
      token1Price: undefined,
    })

    expect(result.current).toEqual({
      minPrice: '-',
      maxPrice: '-',
      marketPrice: '-',
    })
  })
})
