import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { FeeAmount, Pool, Route } from '@uniswap/v3-sdk'
import { UNI, WBTC } from 'uniswap/src/constants/tokens'
import { ClassicTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { requireAcceptNewTrade } from 'uniswap/src/features/transactions/swap/utils/trade'
import { UniverseChainId } from 'uniswap/src/types/chains'

export const mockPool = new Pool(
  UNI[UniverseChainId.Mainnet],
  WBTC,
  FeeAmount.HIGH,
  '2437312313659959819381354528',
  '10272714736694327408',
  -69633,
)

describe(requireAcceptNewTrade, () => {
  const oldTrade = new ClassicTrade({
    v3Routes: [
      {
        routev3: new Route<Currency, Currency>([mockPool], UNI[UniverseChainId.Mainnet], WBTC),
        inputAmount: CurrencyAmount.fromRawAmount(UNI[UniverseChainId.Mainnet], 1000),
        outputAmount: CurrencyAmount.fromRawAmount(WBTC, 1000),
      },
    ],
    v2Routes: [],
    mixedRoutes: [],
    tradeType: TradeType.EXACT_INPUT,
    slippageTolerance: 0.5,
    deadline: Date.now() + 60 * 30 * 1000,
  })

  it('returns false when prices are within threshold', () => {
    const newTrade = new ClassicTrade({
      v3Routes: [
        {
          routev3: new Route<Currency, Currency>([mockPool], UNI[UniverseChainId.Mainnet], WBTC),
          inputAmount: CurrencyAmount.fromRawAmount(UNI[UniverseChainId.Mainnet], 1000),
          // Update this number if `ACCEPT_NEW_TRADE_THRESHOLD` changes
          outputAmount: CurrencyAmount.fromRawAmount(WBTC, 990),
        },
      ],
      v2Routes: [],
      mixedRoutes: [],
      tradeType: TradeType.EXACT_INPUT,
      slippageTolerance: 0.5,
      deadline: Date.now() + 60 * 30 * 1000,
    })
    expect(requireAcceptNewTrade(oldTrade, newTrade)).toBe(false)
  })

  it('returns true when prices move above threshold', () => {
    const newTrade = new ClassicTrade({
      v3Routes: [
        {
          routev3: new Route<Currency, Currency>([mockPool], UNI[UniverseChainId.Mainnet], WBTC),
          inputAmount: CurrencyAmount.fromRawAmount(UNI[UniverseChainId.Mainnet], 1000),
          // Update this number if `ACCEPT_NEW_TRADE_THRESHOLD` changes
          outputAmount: CurrencyAmount.fromRawAmount(WBTC, 979),
        },
      ],
      v2Routes: [],
      mixedRoutes: [],
      tradeType: TradeType.EXACT_INPUT,
      slippageTolerance: 0.5,
      deadline: Date.now() + 60 * 30 * 1000,
    })
    expect(requireAcceptNewTrade(oldTrade, newTrade)).toBe(true)
  })

  it('returns false when new price is better', () => {
    const newTrade = new ClassicTrade({
      v3Routes: [
        {
          routev3: new Route<Currency, Currency>([mockPool], UNI[UniverseChainId.Mainnet], WBTC),
          inputAmount: CurrencyAmount.fromRawAmount(UNI[UniverseChainId.Mainnet], 1000),
          outputAmount: CurrencyAmount.fromRawAmount(WBTC, 2000000),
        },
      ],
      v2Routes: [],
      mixedRoutes: [],
      tradeType: TradeType.EXACT_INPUT,
      slippageTolerance: 0.5,
      deadline: Date.now() + 60 * 30 * 1000,
    })
    expect(requireAcceptNewTrade(oldTrade, newTrade)).toBe(false)
  })
})
