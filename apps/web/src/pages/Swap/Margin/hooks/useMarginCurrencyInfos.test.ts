import { renderHook } from '@testing-library/react'
import { buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { marginMarketKey, MARGIN_CHAIN_ID, type MarginMarket, type MarginTokenInfo } from '~/constants/margin'
import { getMarginPairLogoProps, useMarginCurrencyInfos } from '~/pages/Swap/Margin/hooks/useMarginCurrencyInfos'

const { mockUseCurrencyInfos, mockMarkets } = vi.hoisted(() => ({
  mockUseCurrencyInfos: vi.fn(),
  mockMarkets: { current: [] as MarginMarket[] },
}))

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({
  useCurrencyInfos: mockUseCurrencyInfos,
}))

// The seeded token set is now derived from the markets registry, so the registry is what a test moves.
vi.mock('~/pages/Swap/Margin/hooks/useMarginMarkets', () => ({
  useMarginMarkets: () => ({ markets: mockMarkets.current }),
}))

const WETH_T: MarginTokenInfo = { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', decimals: 18 }
const USDC_T: MarginTokenInfo = { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', decimals: 6 }
const CBBTC_T: MarginTokenInfo = { address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf', symbol: 'cbBTC', decimals: 8 }

function marketFixture({ collateral, debt }: { collateral: MarginTokenInfo; debt: MarginTokenInfo }): MarginMarket {
  return {
    key: marginMarketKey({ collateralToken: collateral.address, debtToken: debt.address, venue: 'MORPHO' }),
    asset: collateral.symbol,
    name: collateral.symbol,
    displaySymbol: collateral.symbol,
    collateral,
    debt,
    venue: 'MORPHO',
    direction: 'LONG',
    lltvWad: '860000000000000000',
    maxLeverage: 5,
    shouldUseNativeEquity: false,
  }
}

function requestedIds(): string[] {
  return mockUseCurrencyInfos.mock.calls.at(-1)?.[0] as string[]
}

describe('getMarginPairLogoProps', () => {
  it('puts the base leg on the input slot and unwraps its symbol', () => {
    const props = getMarginPairLogoProps({ base: WETH_T, quote: USDC_T, currencyInfos: new Map() })
    expect(props.inputFallbackSymbol).toBe('ETH')
    expect(props.outputFallbackSymbol).toBe('USDC')
  })
})

describe('useMarginCurrencyInfos', () => {
  beforeEach(() => {
    mockUseCurrencyInfos.mockClear()
    mockUseCurrencyInfos.mockReturnValue([])
    mockMarkets.current = [marketFixture({ collateral: WETH_T, debt: USDC_T })]
  })

  it('seeds the native currencyId for a wrapped-native leg, never its raw ERC-20 id', () => {
    renderHook(() => useMarginCurrencyInfos())
    expect(requestedIds()).toContain(buildNativeCurrencyId(MARGIN_CHAIN_ID))
    expect(requestedIds()).not.toContain(buildCurrencyId(MARGIN_CHAIN_ID, WETH_T.address))
  })

  it('seeds a non-wrapped leg by its own address', () => {
    renderHook(() => useMarginCurrencyInfos())
    expect(requestedIds()).toContain(buildCurrencyId(MARGIN_CHAIN_ID, USDC_T.address))
  })

  // The curated address list is gone: art for a newly listed asset has to arrive with the market that
  // introduces it, and nothing may be seeded for an asset the registry never mentions.
  it('seeds exactly the legs the registry lists, and nothing at all before it resolves', () => {
    mockMarkets.current = []
    const { rerender } = renderHook(() => useMarginCurrencyInfos())
    expect(requestedIds()).toEqual([])

    mockMarkets.current = [marketFixture({ collateral: CBBTC_T, debt: USDC_T })]
    rerender()
    expect(requestedIds()).toEqual([
      buildCurrencyId(MARGIN_CHAIN_ID, CBBTC_T.address),
      buildCurrencyId(MARGIN_CHAIN_ID, USDC_T.address),
    ])
  })
})
