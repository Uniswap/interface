import { getPricePairLabel, shouldShowSinglePrice } from '~/features/Liquidity/charts/ActiveLiquidityChart/TickTooltip'

describe('shouldShowSinglePrice', () => {
  it('collapses ranges whose formatted prices are identical', () => {
    expect(
      shouldShowSinglePrice({
        showSingleTick: false,
        formattedPriceLow: '0.00091',
        formattedPriceHigh: '0.00091',
      }),
    ).toBe(true)
  })

  it('keeps ranges when formatted prices differ', () => {
    expect(
      shouldShowSinglePrice({
        showSingleTick: false,
        formattedPriceLow: '0.00091',
        formattedPriceHigh: '0.00092',
      }),
    ).toBe(false)
  })
})

describe('getPricePairLabel', () => {
  it('labels prices as quote per base', () => {
    expect(getPricePairLabel({ quoteSymbol: 'WETH', baseSymbol: 'USDC' })).toBe('WETH/USDC')
  })

  it('falls back to the quote symbol when the base symbol is missing', () => {
    expect(getPricePairLabel({ quoteSymbol: 'WETH', baseSymbol: undefined })).toBe('WETH')
  })
})
