import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { Route } from '@uniswap/v3-sdk'
import { getWrapType, requireAcceptNewTrade } from 'src/features/transactions/swap/utils'
import { ChainId } from 'wallet/src/constants/chains'
import { UNI, WBTC, wrappedNativeCurrency } from 'wallet/src/constants/tokens'
import { NativeCurrency } from 'wallet/src/features/tokens/NativeCurrency'
import { Trade } from 'wallet/src/features/transactions/swap/useTrade'
import { WrapType } from 'wallet/src/features/transactions/types'
import { mockPool } from 'wallet/src/test/fixtures'

describe(getWrapType, () => {
  const eth = NativeCurrency.onChain(ChainId.Mainnet)
  const weth = wrappedNativeCurrency(ChainId.Mainnet)

  const goerliEth = NativeCurrency.onChain(ChainId.Goerli)
  const goerliWeth = wrappedNativeCurrency(ChainId.Goerli)

  it('handles undefined args', () => {
    expect(getWrapType(undefined, weth)).toEqual(WrapType.NotApplicable)
    expect(getWrapType(weth, undefined)).toEqual(WrapType.NotApplicable)
    expect(getWrapType(undefined, undefined)).toEqual(WrapType.NotApplicable)
  })

  it('handles wrap', () => {
    expect(getWrapType(eth, weth)).toEqual(WrapType.Wrap)

    // different chains
    expect(getWrapType(goerliEth, weth)).toEqual(WrapType.NotApplicable)
    expect(getWrapType(eth, goerliWeth)).toEqual(WrapType.NotApplicable)
  })

  it('handles unwrap', () => {
    expect(getWrapType(weth, eth)).toEqual(WrapType.Unwrap)

    // different chains
    expect(getWrapType(weth, goerliEth)).toEqual(WrapType.NotApplicable)
    expect(getWrapType(goerliWeth, eth)).toEqual(WrapType.NotApplicable)
  })
})

describe(requireAcceptNewTrade, () => {
  const oldTrade = new Trade({
    v3Routes: [
      {
        routev3: new Route<Currency, Currency>([mockPool], UNI[ChainId.Mainnet], WBTC),
        inputAmount: CurrencyAmount.fromRawAmount(UNI[ChainId.Mainnet], 1000),
        outputAmount: CurrencyAmount.fromRawAmount(WBTC, 1000),
      },
    ],
    v2Routes: [],
    mixedRoutes: [],
    tradeType: TradeType.EXACT_INPUT,
    slippageTolerance: 0.5,
  })

  it('returns false when prices are within threshold', () => {
    const newTrade = new Trade({
      v3Routes: [
        {
          routev3: new Route<Currency, Currency>([mockPool], UNI[ChainId.Mainnet], WBTC),
          inputAmount: CurrencyAmount.fromRawAmount(UNI[ChainId.Mainnet], 1000),
          // Update this number if `ACCEPT_NEW_TRADE_THRESHOLD` changes
          outputAmount: CurrencyAmount.fromRawAmount(WBTC, 990),
        },
      ],
      v2Routes: [],
      mixedRoutes: [],
      tradeType: TradeType.EXACT_INPUT,
      slippageTolerance: 0.5,
    })
    expect(requireAcceptNewTrade(oldTrade, newTrade)).toBe(false)
  })

  it('returns true when prices move above threshold', () => {
    const newTrade = new Trade({
      v3Routes: [
        {
          routev3: new Route<Currency, Currency>([mockPool], UNI[ChainId.Mainnet], WBTC),
          inputAmount: CurrencyAmount.fromRawAmount(UNI[ChainId.Mainnet], 1000),
          // Update this number if `ACCEPT_NEW_TRADE_THRESHOLD` changes
          outputAmount: CurrencyAmount.fromRawAmount(WBTC, 979),
        },
      ],
      v2Routes: [],
      mixedRoutes: [],
      tradeType: TradeType.EXACT_INPUT,
      slippageTolerance: 0.5,
    })
    expect(requireAcceptNewTrade(oldTrade, newTrade)).toBe(true)
  })

  it('returns false when new price is better', () => {
    const newTrade = new Trade({
      v3Routes: [
        {
          routev3: new Route<Currency, Currency>([mockPool], UNI[ChainId.Mainnet], WBTC),
          inputAmount: CurrencyAmount.fromRawAmount(UNI[ChainId.Mainnet], 1000),
          outputAmount: CurrencyAmount.fromRawAmount(WBTC, 2000000),
        },
      ],
      v2Routes: [],
      mixedRoutes: [],
      tradeType: TradeType.EXACT_INPUT,
      slippageTolerance: 0.5,
    })
    expect(requireAcceptNewTrade(oldTrade, newTrade)).toBe(false)
  })
})
