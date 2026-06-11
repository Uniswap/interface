import { TradeType } from '@uniswap/sdk-core'
import { type ClassicQuoteResponse, TradingApi } from '@universe/api'
import { UNI, WBTC } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  createBridgeTrade,
  createClassicTrade as createClassicTradeFromQuote,
  type BridgeTrade,
  type ClassicTrade,
} from 'uniswap/src/features/transactions/swap/types/trade'
import { requireAcceptNewTrade } from 'uniswap/src/features/transactions/swap/utils/trade'

const INPUT_TOKEN = UNI[UniverseChainId.Mainnet]

const createClassicTrade = ({
  tradeType,
  inputAmount,
  outputAmount,
}: {
  tradeType: TradeType
  inputAmount: number
  outputAmount: number
}): ClassicTrade => {
  const trade = createClassicTradeFromQuote({
    quote: {
      requestId: '123',
      routing: TradingApi.Routing.CLASSIC,
      permitData: null,
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
