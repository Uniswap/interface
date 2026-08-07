import { Percent } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { usePriceDifference } from 'uniswap/src/features/transactions/swap/components/PriceDifferenceRow/usePriceDifference'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { Trade, TradeWithStatus } from 'uniswap/src/features/transactions/swap/types/trade'
import { renderHook } from 'uniswap/src/test/test-utils'

const mockUniswapXTrade = {
  priceDifference: new Percent(32, 10000),
  routing: TradingApi.Routing.DUTCH_V2,
} as unknown as Trade

const mockClassicTrade = {
  priceDifference: new Percent(5, 100),
  routing: TradingApi.Routing.CLASSIC,
} as unknown as Trade

const mockPriceImprovementTrade = {
  priceDifference: new Percent(-299, 10000),
  routing: TradingApi.Routing.DUTCH_V2,
} as unknown as Trade

const baseSwapInfo: DerivedSwapInfo = {
  trade: {
    trade: null,
  },
} as unknown as DerivedSwapInfo

describe('usePriceDifference', () => {
  it('should return undefined values when no trade exists', () => {
    const { result } = renderHook(() => usePriceDifference({ derivedSwapInfo: baseSwapInfo }))

    expect(result.current).toEqual({
      priceDifference: undefined,
      formattedPriceDifference: undefined,
    })
  })

  it('formats the price difference carried on a UniswapX trade', () => {
    const swapInfo: DerivedSwapInfo = {
      ...baseSwapInfo,
      trade: { trade: mockUniswapXTrade } as TradeWithStatus,
    }

    const { result } = renderHook(() => usePriceDifference({ derivedSwapInfo: swapInfo }))

    expect(result.current.formattedPriceDifference).toEqual('0.32%')
  })

  it('returns classic trade price difference directly', () => {
    const swapInfo: DerivedSwapInfo = {
      ...baseSwapInfo,
      trade: { trade: mockClassicTrade } as TradeWithStatus,
    }

    const { result } = renderHook(() => usePriceDifference({ derivedSwapInfo: swapInfo }))

    expect(result.current.formattedPriceDifference).toEqual('5%')
  })

  it('formats a price improvement as its magnitude', () => {
    const swapInfo: DerivedSwapInfo = {
      ...baseSwapInfo,
      trade: { trade: mockPriceImprovementTrade } as TradeWithStatus,
    }

    const { result } = renderHook(() => usePriceDifference({ derivedSwapInfo: swapInfo }))

    expect(result.current.formattedPriceDifference).toEqual('2.99%')
  })
})
