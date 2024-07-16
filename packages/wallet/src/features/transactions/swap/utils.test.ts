import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { Route } from '@uniswap/v3-sdk'
import { UNI, WBTC } from 'uniswap/src/constants/tokens'
import { NativeCurrency } from 'uniswap/src/features/tokens/NativeCurrency'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { wrappedNativeCurrency } from 'uniswap/src/utils/currency'
import { ClassicTrade } from 'wallet/src/features/transactions/swap/trade/types'
import { getWrapType, requireAcceptNewTrade, serializeQueryParams } from 'wallet/src/features/transactions/swap/utils'
import { WrapType } from 'wallet/src/features/transactions/types'
import { mockPool } from 'wallet/src/test/mocks'

describe(serializeQueryParams, () => {
  it('handles the correct types', () => {
    expect(serializeQueryParams({ a: '0x6B175474E89094C44Da98b954EedeAC495271d0F', b: 2, c: false })).toBe(
      'a=0x6B175474E89094C44Da98b954EedeAC495271d0F&b=2&c=false',
    )
  })

  it('escapes characters', () => {
    expect(serializeQueryParams({ space: ' ', bang: '!' })).toEqual('space=%20&bang=!')
  })
})

describe(getWrapType, () => {
  const eth = NativeCurrency.onChain(UniverseChainId.Mainnet)
  const weth = wrappedNativeCurrency(UniverseChainId.Mainnet)

  const arbEth = NativeCurrency.onChain(UniverseChainId.ArbitrumOne)
  const arbWeth = wrappedNativeCurrency(UniverseChainId.ArbitrumOne)

  it('handles undefined args', () => {
    expect(getWrapType(undefined, weth)).toEqual(WrapType.NotApplicable)
    expect(getWrapType(weth, undefined)).toEqual(WrapType.NotApplicable)
    expect(getWrapType(undefined, undefined)).toEqual(WrapType.NotApplicable)
  })

  it('handles wrap', () => {
    expect(getWrapType(eth, weth)).toEqual(WrapType.Wrap)

    // different chains
    expect(getWrapType(arbEth, weth)).toEqual(WrapType.NotApplicable)
    expect(getWrapType(eth, arbWeth)).toEqual(WrapType.NotApplicable)
  })

  it('handles unwrap', () => {
    expect(getWrapType(weth, eth)).toEqual(WrapType.Unwrap)

    // different chains
    expect(getWrapType(weth, arbEth)).toEqual(WrapType.NotApplicable)
    expect(getWrapType(arbWeth, eth)).toEqual(WrapType.NotApplicable)
  })
})

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
