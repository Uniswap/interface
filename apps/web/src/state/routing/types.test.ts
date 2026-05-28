import { CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { LIMIT_ORDER_TRADE } from 'test-utils/constants'
import { DAI, USDC_MAINNET } from 'uniswap/src/constants/tokens'

describe('LimitOrderTrade', () => {
  it('should have the correct values', () => {
    const trade = LIMIT_ORDER_TRADE
    expect(trade.executionPrice.toSignificant(6)).toEqual('1000000000000')
    expect(trade.inputAmount).toEqual(CurrencyAmount.fromRawAmount(DAI, 100))
    expect(trade.outputAmount).toEqual(CurrencyAmount.fromRawAmount(USDC_MAINNET, 100))
    expect(trade.tradeType).toEqual(TradeType.EXACT_INPUT)
    expect(trade.wrapInfo).toEqual({ needsWrap: false })
    expect(trade.approveInfo).toEqual({ needsApprove: false })
    expect(trade.deadlineBufferSecs).toEqual(604800)
    expect(trade.postTaxOutputAmount).toEqual(CurrencyAmount.fromRawAmount(USDC_MAINNET, 100))
    expect(trade.totalGasUseEstimateUSD).toEqual(0)
    expect(trade.classicGasUseEstimateUSD).toEqual(0)
    expect(trade.startTimeBufferSecs).toEqual(0)
    expect(trade.auctionPeriodSecs).toEqual(0)
  })
})
