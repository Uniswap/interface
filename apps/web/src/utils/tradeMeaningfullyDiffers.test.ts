import { Percent, TradeType } from '@uniswap/sdk-core'
import { Route } from '@uniswap/v3-sdk'
import { ClassicTrade, QuoteMethod } from 'state/routing/types'
import {
  TEST_POOL_13,
  TEST_TOKEN_1,
  TEST_TOKEN_3,
  TEST_TRADE_EXACT_INPUT,
  TEST_TRADE_EXACT_OUTPUT,
  toCurrencyAmount,
} from 'test-utils/constants'
import { tradeMeaningfullyDiffers } from 'utils/tradeMeaningFullyDiffer'

describe('tradeMeaningfullyDiffers', () => {
  const slippage = new Percent('1', '100') // Assuming 1% slippage for simplicity

  it('should return true if trade types differ', () => {
    expect(
      tradeMeaningfullyDiffers({
        currentTrade: TEST_TRADE_EXACT_INPUT,
        newTrade: TEST_TRADE_EXACT_OUTPUT,
        slippage,
      }),
    ).toBe(true)
  })

  it('should return true if input currencies differ', () => {
    const newTrade = new ClassicTrade({
      v3Routes: [
        {
          routev3: new Route([TEST_POOL_13], TEST_TOKEN_3, TEST_TOKEN_1),
          inputAmount: toCurrencyAmount(TEST_TOKEN_3, 1000),
          outputAmount: toCurrencyAmount(TEST_TOKEN_1, 1000),
        },
      ],
      v2Routes: [],
      tradeType: TradeType.EXACT_INPUT,
      gasUseEstimateUSD: 1.0,
      approveInfo: { needsApprove: false },
      quoteMethod: QuoteMethod.CLIENT_SIDE_FALLBACK,
    })
    expect(
      tradeMeaningfullyDiffers({
        currentTrade: TEST_TRADE_EXACT_INPUT,
        newTrade,
        slippage,
      }),
    ).toBe(true)
  })

  it('should return true if output currencies differ', () => {
    const newTrade = new ClassicTrade({
      v3Routes: [
        {
          routev3: new Route([TEST_POOL_13], TEST_TOKEN_1, TEST_TOKEN_3),
          inputAmount: toCurrencyAmount(TEST_TOKEN_1, 1000),
          outputAmount: toCurrencyAmount(TEST_TOKEN_3, 1000),
        },
      ],
      v2Routes: [],
      tradeType: TradeType.EXACT_INPUT,
      gasUseEstimateUSD: 1.0,
      approveInfo: { needsApprove: false },
      quoteMethod: QuoteMethod.CLIENT_SIDE_FALLBACK,
    })
    expect(
      tradeMeaningfullyDiffers({
        currentTrade: TEST_TRADE_EXACT_INPUT,
        newTrade,
        slippage,
      }),
    ).toBe(true)
  })

  it('should return true if new trade execution price is less than worst execution price with slippage', () => {
    // Mock price comparison
    const newTrade = TEST_TRADE_EXACT_INPUT
    newTrade.executionPrice.lessThan = vi.fn().mockReturnValue(true)
    expect(
      tradeMeaningfullyDiffers({
        currentTrade: TEST_TRADE_EXACT_INPUT,
        newTrade,
        slippage,
      }),
    ).toBe(true)
  })

  it('should return false if none of the conditions are met', () => {
    const newTrade = TEST_TRADE_EXACT_INPUT
    newTrade.executionPrice.lessThan = vi.fn().mockReturnValue(false)

    expect(
      tradeMeaningfullyDiffers({
        currentTrade: TEST_TRADE_EXACT_INPUT,
        newTrade,
        slippage,
      }),
    ).toBe(false)
  })
})
