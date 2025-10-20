/* eslint-disable no-new */
import { TradeType } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { UnwrapTrade, WrapTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { ETH, WETH } from 'uniswap/src/test/fixtures/lib/sdk'

const mockBaseQuote = {
  chainId: 1,
  input: {
    amount: '1000000000000000000',
    token: ETH.address,
  },
  output: {
    amount: '1000000000000000000',
    token: WETH.address,
    recipient: '0xAAAA44272dc658575Ba38f43C438447dDED45358',
  },
  swapper: '0xAAAA44272dc658575Ba38f43C438447dDED45358',
  tradeType: TradingApi.TradeType.EXACT_INPUT,
  quoteId: 'test-quote-id',
  gasFeeUSD: '0.00499',
  gasFeeQuote: '1508616120023',
  gasUseEstimate: '133000',
  txFailureReasons: [],
  gasPrice: '5629546',
  gasFee: '2609240163336',
  gasEstimates: [],
}

const mockWrapQuote = {
  requestId: 'test-request-id',
  routing: TradingApi.Routing.WRAP,
  quote: mockBaseQuote,
  permitData: null,
} as const

const mockUnwrapQuote = {
  requestId: 'test-request-id',
  routing: TradingApi.Routing.UNWRAP,
  quote: mockBaseQuote,
  permitData: null,
} as const

const mockBaseArgs = {
  currencyIn: ETH,
  currencyOut: WETH,
  tradeType: TradeType.EXACT_INPUT,
}

describe('WrapTrade', () => {
  it('should accept WrapQuoteResponse for WrapTrade constructor', () => {
    const trade = new WrapTrade({
      ...mockBaseArgs,
      quote: mockWrapQuote,
    })

    expect(trade).toBeInstanceOf(WrapTrade)
    expect(trade.routing).toBe(TradingApi.Routing.WRAP)
    expect(trade.quote).toBe(mockWrapQuote)
  })

  it('should raise a ts error for invalid routing types', () => {
    new WrapTrade({
      ...mockBaseArgs,
      // @ts-expect-error - Invalid quote should not be accepted
      quote: { ...mockWrapQuote, routing: TradingApi.Routing.UNWRAP },
    })

    new WrapTrade({
      ...mockBaseArgs,
      // @ts-expect-error - Invalid quote should not be accepted
      quote: { ...mockWrapQuote, routing: TradingApi.Routing.BRIDGE },
    })
  })
})

describe('UnwrapTrade', () => {
  it('should accept UnwrapQuoteResponse for UnwrapTrade constructor', () => {
    const trade = new UnwrapTrade({
      ...mockBaseArgs,
      quote: mockUnwrapQuote,
    })

    expect(trade).toBeInstanceOf(UnwrapTrade)
    expect(trade.routing).toBe(TradingApi.Routing.UNWRAP)
    expect(trade.quote).toBe(mockUnwrapQuote)
  })

  it('should raise a ts error for invalid routing types', () => {
    new UnwrapTrade({
      ...mockBaseArgs,
      // @ts-expect-error - Invalid quote should not be accepted
      quote: { ...mockUnwrapQuote, routing: TradingApi.Routing.WRAP },
    })

    new UnwrapTrade({
      ...mockBaseArgs,
      // @ts-expect-error - Invalid quote should not be accepted
      quote: { ...mockUnwrapQuote, routing: TradingApi.Routing.BRIDGE },
    })
  })
})
