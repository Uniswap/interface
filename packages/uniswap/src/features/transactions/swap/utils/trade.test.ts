import { Protocol } from '@uniswap/router-sdk'
import { CurrencyAmount, Price, TradeType } from '@uniswap/sdk-core'
import { type ClassicQuoteResponse, TradingApi } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { UNI, WBTC } from 'uniswap/src/constants/tokens'
import { Locale } from 'uniswap/src/features/language/constants'
import {
  createBridgeTrade,
  createClassicTrade as createClassicTradeFromQuote,
  type BridgeTrade,
  type ClassicTrade,
  type Trade,
} from 'uniswap/src/features/transactions/swap/types/trade'
import {
  getProtocolVersionFromTrade,
  getRateToDisplay,
  requireAcceptNewTrade,
  tradeToTransactionInfo,
} from 'uniswap/src/features/transactions/swap/utils/trade'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { mockLocalizedFormatter } from 'uniswap/src/test/mocks/locale'

const INPUT_TOKEN = UNI[UniverseChainId.Mainnet]

const createClassicTrade = ({
  tradeType,
  inputAmount,
  outputAmount,
  sponsorshipInfo,
}: {
  tradeType: TradeType
  inputAmount: number
  outputAmount: number
  sponsorshipInfo?: TradingApi.SponsorshipInfo
}): ClassicTrade => {
  const trade = createClassicTradeFromQuote({
    quote: {
      requestId: '123',
      routing: TradingApi.Routing.CLASSIC,
      permitData: null,
      ...(sponsorshipInfo ? { sponsorshipInfo } : {}),
      quote: {
        input: {
          amount: inputAmount.toString(),
          maximumAmount: inputAmount.toString(),
          token: INPUT_TOKEN.address,
        },
        output: {
          amount: outputAmount.toString(),
          minimumAmount: outputAmount.toString(),
          token: WBTC.address,
          recipient: '0xrecipient',
        },
        swapper: '0xswapper',
        route: [],
      },
    } as ClassicQuoteResponse,
    currencyIn: INPUT_TOKEN,
    currencyOut: WBTC,
    tradeType,
    deadline: Date.now() + 60 * 30 * 1000,
  })

  if (!trade) {
    throw new Error('Expected test classic trade to be created')
  }

  return trade
}

function createBridgeTestTrade(inputAmount: string, outputAmount: string): BridgeTrade {
  const trade = createBridgeTrade({
    quote: {
      quote: {
        input: {
          amount: inputAmount,
          maximumAmount: inputAmount,
        },
        output: {
          amount: outputAmount,
          minimumAmount: outputAmount,
        },
      },
      requestId: '123',
      routing: TradingApi.Routing.BRIDGE,
      permitData: null,
    },
    currencyIn: INPUT_TOKEN,
    currencyOut: WBTC,
    tradeType: TradeType.EXACT_INPUT,
  })

  if (!trade) {
    throw new Error('Expected test bridge trade to be created')
  }

  return trade
}

describe(requireAcceptNewTrade, () => {
  describe('ClassicTrade', () => {
    it('returns false when prices are within threshold, exact input', () => {
      const oldTrade = createClassicTrade({ tradeType: TradeType.EXACT_INPUT, inputAmount: 100, outputAmount: 100 })
      const newTrade = createClassicTrade({ tradeType: TradeType.EXACT_INPUT, inputAmount: 100, outputAmount: 99 })
      expect(requireAcceptNewTrade(oldTrade, newTrade)).toBe(false)
    })

    it('returns false when prices are within threshold, exact output', () => {
      const oldTrade = createClassicTrade({ tradeType: TradeType.EXACT_OUTPUT, inputAmount: 100, outputAmount: 100 })
      const newTrade = createClassicTrade({ tradeType: TradeType.EXACT_OUTPUT, inputAmount: 101, outputAmount: 100 })
      expect(requireAcceptNewTrade(oldTrade, newTrade)).toBe(false)
    })

    it('returns true when prices move above threshold, exact input', () => {
      const oldTrade = createClassicTrade({ tradeType: TradeType.EXACT_INPUT, inputAmount: 100, outputAmount: 100 })
      const newTrade = createClassicTrade({ tradeType: TradeType.EXACT_INPUT, inputAmount: 100, outputAmount: 98 })
      expect(requireAcceptNewTrade(oldTrade, newTrade)).toBe(true)
    })

    it('returns true when prices move above threshold, exact output', () => {
      const oldTrade = createClassicTrade({ tradeType: TradeType.EXACT_OUTPUT, inputAmount: 100, outputAmount: 100 })
      const newTrade = createClassicTrade({ tradeType: TradeType.EXACT_OUTPUT, inputAmount: 102, outputAmount: 100 })
      expect(requireAcceptNewTrade(oldTrade, newTrade)).toBe(true)
    })

    it('returns false when new price is better, exact input', () => {
      const oldTrade = createClassicTrade({ tradeType: TradeType.EXACT_INPUT, inputAmount: 100, outputAmount: 100 })
      const newTrade = createClassicTrade({ tradeType: TradeType.EXACT_INPUT, inputAmount: 100, outputAmount: 101 })
      expect(requireAcceptNewTrade(oldTrade, newTrade)).toBe(false)
    })

    it('returns false when new price is better, exact output', () => {
      const oldTrade = createClassicTrade({ tradeType: TradeType.EXACT_OUTPUT, inputAmount: 100, outputAmount: 100 })
      const newTrade = createClassicTrade({ tradeType: TradeType.EXACT_OUTPUT, inputAmount: 99, outputAmount: 100 })
      expect(requireAcceptNewTrade(oldTrade, newTrade)).toBe(false)
    })
  })

  describe('BridgeTrade', () => {
    const oldTrade = createBridgeTestTrade('1000', '990')

    it('returns false when output amount is within threshold', () => {
      const newTrade = createBridgeTestTrade('1000', '981')
      expect(requireAcceptNewTrade(oldTrade, newTrade)).toBe(false)
    })

    it('returns true when output amount is below threshold', () => {
      const newTrade = createBridgeTestTrade('1000', '979')
      expect(requireAcceptNewTrade(oldTrade, newTrade)).toBe(true)
    })

    it('returns false when new trade is better', () => {
      const newTrade = createBridgeTestTrade('1000', '1001')
      expect(requireAcceptNewTrade(oldTrade, newTrade)).toBe(false)
    })
  })
})

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'

function v2SwapStep(): TradingApi.SwapStep {
  return {
    type: 'V2_SWAP_EXACT_IN' as TradingApi.V2SwapExactInStep['type'],
    recipient: ADDRESS_ZERO,
    amountIn: '0',
    amountOutMin: '0',
    path: [ADDRESS_ZERO, ADDRESS_ZERO],
  } as TradingApi.SwapStep
}

function v3SwapStep(): TradingApi.SwapStep {
  return {
    type: 'V3_SWAP_EXACT_IN' as TradingApi.V3SwapExactInStep['type'],
    recipient: ADDRESS_ZERO,
    amountIn: '0',
    amountOutMin: '0',
    path: '0x',
  } as TradingApi.SwapStep
}

function v4SwapStep(): TradingApi.SwapStep {
  return {
    type: 'V4_SWAP' as TradingApi.V4SwapStep['type'],
    v4Actions: [
      {
        action: 'SWAP_EXACT_IN_SINGLE' as TradingApi.V4SwapExactInSingle['action'],
        poolKey: {} as TradingApi.SwapPoolKey,
        zeroForOne: true,
        amountIn: '0',
        amountOutMinimum: '0',
        hookData: '0x',
      } as TradingApi.V4Action,
    ],
  } as TradingApi.SwapStep
}

const wrapEthStep = {
  type: 'WRAP_ETH' as TradingApi.WrapEthStep['type'],
  recipient: ADDRESS_ZERO,
  amount: '0',
} as TradingApi.SwapStep

// Builds a classic trade carrying the given `swapSteps`, with a single V3 quote-route hop so the
// route-based fallback resolves to V3 whenever `swapSteps` are absent or contribute no version.
const createClassicTradeWithSwapSteps = (swapSteps?: TradingApi.SwapStep[]): ClassicTrade => {
  const trade = createClassicTradeFromQuote({
    quote: {
      requestId: '123',
      routing: TradingApi.Routing.CLASSIC,
      permitData: null,
      quote: {
        input: { amount: '100', maximumAmount: '100', token: INPUT_TOKEN.address },
        output: { amount: '100', minimumAmount: '100', token: WBTC.address, recipient: '0xrecipient' },
        swapper: '0xswapper',
        route: [[{ type: 'v3-pool' }]],
        swapSteps,
      },
    } as ClassicQuoteResponse,
    currencyIn: INPUT_TOKEN,
    currencyOut: WBTC,
    tradeType: TradeType.EXACT_INPUT,
    deadline: Date.now() + 60 * 30 * 1000,
  })

  if (!trade) {
    throw new Error('Expected test classic trade to be created')
  }

  return trade
}

describe(getProtocolVersionFromTrade, () => {
  it('returns undefined for non-classic trades', () => {
    expect(getProtocolVersionFromTrade(createBridgeTestTrade('1000', '990'))).toBeUndefined()
  })

  describe('with swapSteps (new routing field)', () => {
    it('returns V2 when swapSteps contain only V2 swaps', () => {
      expect(getProtocolVersionFromTrade(createClassicTradeWithSwapSteps([v2SwapStep()]))).toBe(Protocol.V2)
    })

    it('returns V3 when swapSteps contain only V3 swaps', () => {
      expect(getProtocolVersionFromTrade(createClassicTradeWithSwapSteps([v3SwapStep()]))).toBe(Protocol.V3)
    })

    it('returns V4 when swapSteps contain only V4 swaps', () => {
      expect(getProtocolVersionFromTrade(createClassicTradeWithSwapSteps([v4SwapStep()]))).toBe(Protocol.V4)
    })

    it('returns MIXED when swapSteps span multiple protocol versions', () => {
      expect(getProtocolVersionFromTrade(createClassicTradeWithSwapSteps([v2SwapStep(), v3SwapStep()]))).toBe(
        Protocol.MIXED,
      )
    })

    it('falls back to route inference when swapSteps contribute no versions (wrap/unwrap only)', () => {
      // wrap/unwrap steps yield no protocol versions, so the V3 SDK route resolves the protocol.
      expect(getProtocolVersionFromTrade(createClassicTradeWithSwapSteps([wrapEthStep]))).toBe(Protocol.V3)
    })
  })

  describe('without swapSteps (route fallback)', () => {
    it('infers the protocol from the SDK routes', () => {
      expect(getProtocolVersionFromTrade(createClassicTradeWithSwapSteps(undefined))).toBe(Protocol.V3)
    })
  })
})

describe(tradeToTransactionInfo, () => {
  const sponsoredTrade = createClassicTrade({
    tradeType: TradeType.EXACT_INPUT,
    inputAmount: 100,
    outputAmount: 200,
    sponsorshipInfo: { sponsored: true, campaign: { name: 'test-campaign' } },
  })

  function toSwapTypeInfo(isSponsored?: boolean): ReturnType<typeof tradeToTransactionInfo> & {
    type: TransactionType.Swap
  } {
    const typeInfo = tradeToTransactionInfo({ trade: sponsoredTrade, isSponsored })
    if (typeInfo.type !== TransactionType.Swap) {
      throw new Error('expected swap typeInfo')
    }
    return typeInfo
  }

  it('reports sponsorship and campaign when a paymaster actually paid', () => {
    const typeInfo = toSwapTypeInfo(true)

    expect(typeInfo.isSponsored).toBe(true)
    expect(typeInfo.sponsorshipCampaignId).toBe('test-campaign')
  })

  it('does not attribute the campaign when execution was not paymaster-paid', () => {
    const typeInfo = toSwapTypeInfo(false)

    expect(typeInfo.isSponsored).toBe(false)
    expect(typeInfo.sponsorshipCampaignId).toBeUndefined()
  })

  it('leaves sponsorship undefined when execution sponsorship is unknown', () => {
    const typeInfo = toSwapTypeInfo()

    expect(typeInfo.isSponsored).toBeUndefined()
    expect(typeInfo.sponsorshipCampaignId).toBeUndefined()
  })
})

describe(getRateToDisplay, () => {
  const formatter = mockLocalizedFormatter(Locale.EnglishUnitedStates)

  // Builds a bare-minimum "trade" carrying only the `executionPrice` field `getRateToDisplay`
  // actually reads, rather than a full quote-derived trade -- lets the test amounts be chosen
  // directly instead of reverse-engineered from a quote response.
  function tradeWithPrice(baseRawAmount: bigint, quoteRawAmount: bigint): Trade {
    const executionPrice = new Price({
      baseAmount: CurrencyAmount.fromRawAmount(INPUT_TOKEN, baseRawAmount.toString()),
      quoteAmount: CurrencyAmount.fromRawAmount(WBTC, quoteRawAmount.toString()),
    })
    return { executionPrice } as unknown as Trade
  }

  it('abbreviates a large rate and returns the exact value for a tooltip', () => {
    const trade = tradeWithPrice(10n ** 18n, 1241790000n * 10n ** 8n) // 1 UNI = 1,241,790,000 WBTC
    const result = getRateToDisplay({ formatter, trade, showInverseRate: false })

    expect(result.rate).toBe('1 UNI = 1.24B WBTC')
    expect(result.fullPrecisionRate).toBe('1 UNI = 1,241,790,000 WBTC')
  })

  it('does not abbreviate, and omits the tooltip value, for a common-magnitude rate', () => {
    const trade = tradeWithPrice(10n ** 18n, 3500n * 10n ** 8n) // 1 UNI = 3500 WBTC
    const result = getRateToDisplay({ formatter, trade, showInverseRate: false })

    expect(result.rate).toBe('1 UNI = 3500 WBTC')
    expect(result.fullPrecisionRate).toBeUndefined()
  })

  it('abbreviates the inverted rate the same way when toggled', () => {
    // Inverting 1 UNI = 1/1,241,790,000 WBTC gives 1 WBTC = 1,241,790,000 UNI.
    const trade = tradeWithPrice(1241790000n * 10n ** 18n, 1n * 10n ** 8n)
    const result = getRateToDisplay({ formatter, trade, showInverseRate: true })

    expect(result.rate).toBe('1 WBTC = 1.24B UNI')
    expect(result.fullPrecisionRate).toBe('1 WBTC = 1,241,790,000 UNI')
  })

  it('shows 0 instead of throwing when the inverted price divides by zero', () => {
    const trade = tradeWithPrice(10n ** 18n, 0n)
    const result = getRateToDisplay({ formatter, trade, showInverseRate: true })

    expect(result.rate).toBe('1 WBTC = 0 UNI')
    expect(result.fullPrecisionRate).toBeUndefined()
  })
})
