import { type Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { FeeAmount, Pool, Route } from '@uniswap/v3-sdk'
import { type ClassicQuoteResponse, TradingApi } from '@universe/api'
import { UNI, WBTC } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { BridgeTrade, ClassicTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { requireAcceptNewTrade } from 'uniswap/src/features/transactions/swap/utils/trade'

export const mockPool = new Pool(
  UNI[UniverseChainId.Mainnet],
  WBTC,
  FeeAmount.HIGH,
  '2437312313659959819381354528',
  '10272714736694327408',
  -69633,
)

const createClassicTrade = ({
  tradeType,
  inputAmount,
  outputAmount,
}: {
  tradeType: TradeType
  inputAmount: number
  outputAmount: number
}): ClassicTrade =>
  new ClassicTrade({
    quote: { quote: {} } as ClassicQuoteResponse,
    v4Routes: [],
    v3Routes: [
      {
        routev3: new Route<Currency, Currency>([mockPool], UNI[UniverseChainId.Mainnet], WBTC),
        inputAmount: CurrencyAmount.fromRawAmount(UNI[UniverseChainId.Mainnet], inputAmount),
        outputAmount: CurrencyAmount.fromRawAmount(WBTC, outputAmount),
      },
    ],
    v2Routes: [],
    mixedRoutes: [],
    tradeType,
    deadline: Date.now() + 60 * 30 * 1000,
  })

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
    const oldTrade = new BridgeTrade({
      quote: {
        quote: {
          input: {
            amount: '1000',
          },
          output: {
            amount: '990',
          },
        },
        requestId: '123',
        routing: TradingApi.Routing.BRIDGE,
        permitData: null,
      },
      currencyIn: UNI[UniverseChainId.Mainnet],
      currencyOut: WBTC,
      tradeType: TradeType.EXACT_INPUT,
    })

    it('returns false when output amount is within threshold', () => {
      const newTrade = new BridgeTrade({
        quote: {
          quote: {
            input: {
              amount: '1000',
            },
            output: {
              amount: '981',
            },
          },
          requestId: '123',
          routing: TradingApi.Routing.BRIDGE,
          permitData: null,
        },
        currencyIn: UNI[UniverseChainId.Mainnet],
        currencyOut: WBTC,
        tradeType: TradeType.EXACT_INPUT,
      })
      expect(requireAcceptNewTrade(oldTrade, newTrade)).toBe(false)
    })

    it('returns true when output amount is below threshold', () => {
      const newTrade = new BridgeTrade({
        quote: {
          quote: {
            input: {
              amount: '1000',
            },
            output: {
              amount: '979',
            },
          },
          requestId: '123',
          routing: TradingApi.Routing.BRIDGE,
          permitData: null,
        },
        currencyIn: UNI[UniverseChainId.Mainnet],
        currencyOut: WBTC,
        tradeType: TradeType.EXACT_INPUT,
      })
      expect(requireAcceptNewTrade(oldTrade, newTrade)).toBe(true)
    })

    it('returns false when new trade is better', () => {
      const newTrade = new BridgeTrade({
        quote: {
          quote: {
            input: {
              amount: '1000',
            },
            output: {
              amount: '1001',
            },
          },
          requestId: '123',
          routing: TradingApi.Routing.BRIDGE,
          permitData: null,
        },
        currencyIn: UNI[UniverseChainId.Mainnet],
        currencyOut: WBTC,
        tradeType: TradeType.EXACT_INPUT,
      })
      expect(requireAcceptNewTrade(oldTrade, newTrade)).toBe(false)
    })
  })
})
