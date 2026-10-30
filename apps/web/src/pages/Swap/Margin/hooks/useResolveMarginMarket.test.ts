import { renderHook } from '@testing-library/react'
import { Token } from '@uniswap/sdk-core'
import type {
  MarginActivePosition,
  MarginMarketRow,
  MarginMarketsResponse,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { MarginDirection, type MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import { buildCurrencyId, normalizeCurrencyIdForMapLookup } from 'uniswap/src/utils/currencyId'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MARGIN_CHAIN_ID } from '~/constants/margin'
import { buildFallbackMarginMarket, useResolveMarginMarket } from '~/pages/Swap/Margin/hooks/useResolveMarginMarket'
import { marginPositionTokens, marginPositionVenue } from '~/pages/Swap/Margin/marginPositionRow'

const { mockUseMarginMarketsQuery, mockUseCurrencyInfos } = vi.hoisted(() => ({
  mockUseMarginMarketsQuery: vi.fn(),
  mockUseCurrencyInfos: vi.fn(),
}))

vi.mock('uniswap/src/data/apiClients/tradingApi/useMarginMarketsQuery', () => ({
  useMarginMarketsQuery: mockUseMarginMarketsQuery,
}))

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({
  useCurrencyInfos: mockUseCurrencyInfos,
}))

const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const CBBTC_ADDRESS = '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf'

function currencyInfoFixture({
  address,
  symbol,
  name,
  decimals,
}: {
  address: string
  symbol: string
  name: string
  decimals: number
}): CurrencyInfo {
  const currency = new Token(MARGIN_CHAIN_ID, address, decimals, symbol, name)
  return buildCurrencyInfo({ currency, currencyId: buildCurrencyId(MARGIN_CHAIN_ID, address), logoUrl: null })
}

function currencyInfoMap(infos: CurrencyInfo[]): Map<string, CurrencyInfo> {
  const map = new Map<string, CurrencyInfo>()
  for (const info of infos) {
    map.set(normalizeCurrencyIdForMapLookup(info.currencyId), info)
  }
  return map
}

describe('buildFallbackMarginMarket', () => {
  // Every Aave-venue position takes this path (the static catalog only covers MORPHO markets), so a
  // WETH position here must still show native ETH equity, matching the static ETH market.
  it('derives native ETH equity + display for WETH collateral', () => {
    const currencyInfoById = currencyInfoMap([
      currencyInfoFixture({ address: WETH_ADDRESS, symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 }),
      currencyInfoFixture({ address: USDC_ADDRESS, symbol: 'USDC', name: 'USD Coin', decimals: 6 }),
    ])

    const market = buildFallbackMarginMarket({
      tokens: { collateralToken: WETH_ADDRESS, debtToken: USDC_ADDRESS, venue: 'AAVE_V3' },
      currencyInfoById,
    })

    expect(market?.shouldUseNativeEquity).toBe(true)
    expect(market?.displaySymbol).toBe('ETH')
    expect(market?.name).toBe('Ethereum')
  })

  it('leaves non-WETH collateral (cbBTC) on ERC20 equity', () => {
    const currencyInfoById = currencyInfoMap([
      currencyInfoFixture({ address: CBBTC_ADDRESS, symbol: 'cbBTC', name: 'Coinbase Wrapped BTC', decimals: 8 }),
      currencyInfoFixture({ address: USDC_ADDRESS, symbol: 'USDC', name: 'USD Coin', decimals: 6 }),
    ])

    const market = buildFallbackMarginMarket({
      tokens: { collateralToken: CBBTC_ADDRESS, debtToken: USDC_ADDRESS, venue: 'AAVE_V3' },
      currencyInfoById,
    })

    expect(market?.shouldUseNativeEquity).toBe(false)
    expect(market?.displaySymbol).toBe('cbBTC')
  })
})

// Venue terms in (collateral, debt) — converted to trader terms (exposure/counter) via direction,
// matching the wire's row shape.
function positionFixture({
  collateralToken,
  debtToken,
  venue = 'MORPHO',
  direction = MarginDirection.LONG,
}: {
  collateralToken: string
  debtToken: string
  venue?: MarginVenue
  direction?: MarginDirection
}): MarginActivePosition {
  const exposureToken = direction === MarginDirection.SHORT ? debtToken : collateralToken
  const counterToken = direction === MarginDirection.SHORT ? collateralToken : debtToken
  return {
    status: 'ACTIVE',
    positionId: '7',
    direction,
    exposureToken: { address: exposureToken, chainId: MARGIN_CHAIN_ID, decimals: 18 },
    counterToken: { address: counterToken, chainId: MARGIN_CHAIN_ID, decimals: 18 },
    size: '2000000000000000000',
    entryPrice: '2000000000000000000000',
    openedAt: '1700000000',
    legs: [{ venue, subId: '7', account: '0x000000000000000000000000000000000000000A', debt: '2000000000' }],
    isTradable: true,
    equity: '2000000000000000000',
    oraclePrice: '2000000000000000000000',
    liquidationPrice: '1162790697674418604651',
    buffer: '400000000000000000',
    healthFactor: '1720000000000000000',
    maxWithdrawable: '500000000000000000',
  }
}

// resolveMarket takes MarginMarketTokens (venue terms), not a position row — every call site converts
// via the shared helpers, matching MarginPositionsTable's own resolveMarketForPosition.
function tokensFor(position: MarginActivePosition): {
  collateralToken: string
  debtToken: string
  venue?: MarginVenue
  direction?: MarginDirection
} {
  return { ...marginPositionTokens(position), venue: marginPositionVenue(position), direction: position.direction }
}

describe('useResolveMarginMarket', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // CBBTC/WETH isn't in the static catalog (which only pairs cbBTC with USDC/USDT) — under the old
  // catalog-first order this pair would miss the catalog and land on the '0' fallback lltvWad.
  it('prefers the live registry over the currency-info fallback', () => {
    // Neither leg is a stable "quote" token, so marginMarketDirection derives SHORT for any collateral/
    // debt split of this pair — direction must agree, or buildDynamicMarket's dev-only consistency
    // check logs a warning the test env treats as a failure. SHORT ⇒ exposure=debt, counter=collateral.
    const row: MarginMarketRow = {
      exposureToken: { address: WETH_ADDRESS, chainId: MARGIN_CHAIN_ID, decimals: 18 },
      counterToken: { address: CBBTC_ADDRESS, chainId: MARGIN_CHAIN_ID, decimals: 8 },
      direction: MarginDirection.SHORT,
      headlineVenue: 'MORPHO',
      maxLeverage: '5',
      lltv: '860000000000000000',
      oraclePrice: '2000000000000000000000',
      venues: [
        {
          venue: 'MORPHO',
          adapter: '0x0000000000000000000000000000000000000001',
          maxLeverage: '5',
          lltv: '860000000000000000',
          availableBorrowLiquidity: '1000000000',
          feeBps: 5,
        },
      ],
    }
    const response: MarginMarketsResponse = { requestId: 'req-1', markets: [row] }
    mockUseMarginMarketsQuery.mockReturnValue({
      data: response,
      isLoading: false,
      isFetching: false,
      error: undefined,
      dataUpdatedAt: 0,
      refetch: () => {},
    })
    mockUseCurrencyInfos.mockReturnValue([
      currencyInfoFixture({ address: CBBTC_ADDRESS, symbol: 'cbBTC', name: 'Coinbase Wrapped BTC', decimals: 8 }),
      currencyInfoFixture({ address: WETH_ADDRESS, symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 }),
    ])

    const position = positionFixture({
      collateralToken: CBBTC_ADDRESS,
      debtToken: WETH_ADDRESS,
      venue: 'MORPHO',
      direction: MarginDirection.SHORT,
    })
    const { result } = renderHook(() => useResolveMarginMarket({ positions: [position] }))

    expect(result.current(tokensFor(position))?.lltvWad).toBe('860000000000000000')
  })

  it('carries direction from the row onto the synthetic market', () => {
    const response: MarginMarketsResponse = { requestId: 'req-1', markets: [] }
    mockUseMarginMarketsQuery.mockReturnValue({
      data: response,
      isLoading: false,
      isFetching: false,
      error: undefined,
      dataUpdatedAt: 0,
      refetch: () => {},
    })
    mockUseCurrencyInfos.mockReturnValue([
      currencyInfoFixture({ address: USDC_ADDRESS, symbol: 'USDC', name: 'USD Coin', decimals: 6 }),
      currencyInfoFixture({ address: WETH_ADDRESS, symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 }),
    ])

    const position = positionFixture({
      collateralToken: USDC_ADDRESS,
      debtToken: WETH_ADDRESS,
      direction: MarginDirection.SHORT,
    })
    const { result } = renderHook(() => useResolveMarginMarket({ positions: [position] }))

    expect(result.current(tokensFor(position))?.direction).toBe(MarginDirection.SHORT)
  })
})
