import { CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import {
  createUnwrapTrade,
  createWrapTrade,
  getWorstExecutionPrice,
} from 'uniswap/src/features/transactions/swap/types/trade'
import { ETH, WETH } from 'uniswap/src/test/fixtures/lib/sdk'

const mockBaseQuote = {
  chainId: 1,
  input: {
    amount: '1000000000000000000',
    maximumAmount: '1000000000000000000',
    token: ETH.address,
  },
  output: {
    amount: '1000000000000000000',
    minimumAmount: '1000000000000000000',
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
  it('should accept WrapQuoteResponse for WrapTrade factory', () => {
    const trade = createWrapTrade({
      ...mockBaseArgs,
      quote: mockWrapQuote,
    })

    expect(trade?.routing).toBe(TradingApi.Routing.WRAP)
    expect(trade?.quote).toBe(mockWrapQuote)
  })

  // oxlint-disable-next-line jest/expect-expect -- suppressed
  it('should raise a ts error for invalid routing types', () => {
    createWrapTrade({
      ...mockBaseArgs,
      // @ts-expect-error - Invalid quote should not be accepted
      quote: { ...mockWrapQuote, routing: TradingApi.Routing.UNWRAP },
    })

    createWrapTrade({
      ...mockBaseArgs,
      // @ts-expect-error - Invalid quote should not be accepted
      quote: { ...mockWrapQuote, routing: TradingApi.Routing.BRIDGE },
    })
  })
})

describe('UnwrapTrade', () => {
  it('should accept UnwrapQuoteResponse for UnwrapTrade factory', () => {
    const trade = createUnwrapTrade({
      ...mockBaseArgs,
      quote: mockUnwrapQuote,
    })

    expect(trade?.routing).toBe(TradingApi.Routing.UNWRAP)
    expect(trade?.quote).toBe(mockUnwrapQuote)
  })

  // oxlint-disable-next-line jest/expect-expect -- suppressed
  it('should raise a ts error for invalid routing types', () => {
    createUnwrapTrade({
      ...mockBaseArgs,
      // @ts-expect-error - Invalid quote should not be accepted
      quote: { ...mockUnwrapQuote, routing: TradingApi.Routing.WRAP },
    })

    createUnwrapTrade({
      ...mockBaseArgs,
      // @ts-expect-error - Invalid quote should not be accepted
      quote: { ...mockUnwrapQuote, routing: TradingApi.Routing.BRIDGE },
    })
  })
})

describe(getWorstExecutionPrice, () => {
  it('derives price from max input and min output amounts', () => {
    const trade = {
      inputAmount: CurrencyAmount.fromRawAmount(ETH, '100'),
      outputAmount: CurrencyAmount.fromRawAmount(WETH, '200'),
      maxAmountIn: CurrencyAmount.fromRawAmount(ETH, '110'),
      minAmountOut: CurrencyAmount.fromRawAmount(WETH, '190'),
    }

    const price = getWorstExecutionPrice(trade)

    expect(price.baseCurrency).toBe(ETH)
    expect(price.quoteCurrency).toBe(WETH)
    expect(price.scalar.numerator.toString()).toBe('1000000000000000000')
    expect(price.numerator.toString()).toBe('190')
    expect(price.denominator.toString()).toBe('110')
  })
})
