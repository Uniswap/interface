import { CurrencyAmount, Percent } from '@uniswap/sdk-core'
import { DAI, USDC } from 'uniswap/src/constants/tokens'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__'
import { usePriceImpact } from 'uniswap/src/features/transactions/swap/review/hooks/usePriceImpact'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { Trade, TradeWithStatus } from 'uniswap/src/features/transactions/swap/types/trade'
import { renderHook } from 'uniswap/src/test/test-utils'

const mockUniswapXTrade = {
  quote: {
    quote: {
      classicGasUseEstimateUSD: '5.32',
    },
  },
  routing: Routing.DUTCH_V2,
  swapFee: {
    amount: '100000000',
  },
  outputAmount: CurrencyAmount.fromRawAmount(USDC, '95000000'),
} as unknown as Trade

const mockClassicTrade = {
  priceImpact: new Percent(5, 100),
  routing: Routing.CLASSIC,
} as unknown as Trade

const baseSwapInfo: DerivedSwapInfo = {
  trade: {
    trade: null,
  },
  currencyAmounts: {
    input: CurrencyAmount.fromRawAmount(USDC, '100000000'),
    output: CurrencyAmount.fromRawAmount(DAI, '9500000000000000000000'),
  },
  currencyAmountsUSDValue: {
    input: CurrencyAmount.fromRawAmount(USDC, '100000000'),
    output: CurrencyAmount.fromRawAmount(USDC, '95000000'),
  },
} as unknown as DerivedSwapInfo

describe('usePriceImpact', () => {
  it('should return undefined values when no trade exists', () => {
    const { result } = renderHook(() => usePriceImpact({ derivedSwapInfo: baseSwapInfo }))

    expect(result.current).toEqual({
      priceImpact: undefined,
      formattedPriceImpact: undefined,
    })
  })

  it('should calculate UniswapX price impact correctly', () => {
    const swapInfo: DerivedSwapInfo = {
      ...baseSwapInfo,
      trade: { trade: mockUniswapXTrade } as TradeWithStatus,
    }

    const { result } = renderHook(() => usePriceImpact({ derivedSwapInfo: swapInfo }))

    expect(result.current.formattedPriceImpact).toEqual('+1.32%')
  })

  it('should return classic trade price impact directly', () => {
    const swapInfo: DerivedSwapInfo = {
      ...baseSwapInfo,
      trade: { trade: mockClassicTrade } as TradeWithStatus,
    }

    const { result } = renderHook(() => usePriceImpact({ derivedSwapInfo: swapInfo }))

    expect(result.current.formattedPriceImpact).toEqual('-5.00%')
  })

  it('should handle negative price impact formatting', () => {
    const negativeImpactTrade = {
      ...mockUniswapXTrade,
      quote: {
        quote: {
          classicGasUseEstimateUSD: '2.01',
        },
      },
    }
    const swapInfo: DerivedSwapInfo = {
      ...baseSwapInfo,
      trade: { trade: negativeImpactTrade } as unknown as TradeWithStatus,
    }

    const { result } = renderHook(() => usePriceImpact({ derivedSwapInfo: swapInfo }))

    expect(result.current.formattedPriceImpact).toEqual('-1.99%')
  })
})
