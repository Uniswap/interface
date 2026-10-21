import { renderHook } from '@testing-library/react'
import type { MarginMarketRow, MarginMarketsResponse } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { marginPairKey } from 'uniswap/src/features/transactions/margin/marginPairKey'
import type { MarginDirection, MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import { shortenAddress } from 'utilities/src/addresses'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { marginMarketKey, type MarginMarket, type MarginPairGroup, type MarginTokenInfo } from '~/constants/margin'
import { groupMarketsIntoPairs, useMarginMarkets } from '~/pages/Swap/Margin/hooks/useMarginMarkets'
import { marginPairLabel } from '~/pages/Swap/Margin/marginTokenDisplay'

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

const WETH: MarginTokenInfo = {
  address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  symbol: 'WETH',
  decimals: 18,
}
const USDC: MarginTokenInfo = {
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  symbol: 'USDC',
  decimals: 6,
}
const CBBTC: MarginTokenInfo = {
  address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
  symbol: 'cbBTC',
  decimals: 8,
}
const USDT: MarginTokenInfo = {
  address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  symbol: 'USDT',
  decimals: 6,
}

function marketFixture({
  collateral,
  debt,
  direction,
  venue,
}: {
  collateral: MarginTokenInfo
  debt: MarginTokenInfo
  direction?: MarginDirection
  venue: MarginVenue
}): MarginMarket {
  return {
    key: marginMarketKey({ collateralToken: collateral.address, debtToken: debt.address, venue }),
    asset: collateral.symbol,
    name: collateral.symbol,
    displaySymbol: collateral.symbol,
    collateral,
    debt,
    venue,
    direction,
    lltvWad: '860000000000000000',
    maxLeverage: 5,
    shouldUseNativeEquity: false,
  }
}

const longWethUsdc = marketFixture({ collateral: WETH, debt: USDC, direction: 'LONG', venue: 'MORPHO' })
const shortWethUsdc = marketFixture({ collateral: USDC, debt: WETH, direction: 'SHORT', venue: 'MORPHO' })
const morphoWethUsdc = marketFixture({ collateral: WETH, debt: USDC, direction: 'LONG', venue: 'MORPHO' })
const aaveWethUsdc = marketFixture({ collateral: WETH, debt: USDC, direction: 'LONG', venue: 'AAVE_V3' })
const longCbbtcUsdc = marketFixture({ collateral: CBBTC, debt: USDC, direction: 'LONG', venue: 'MORPHO' })
// Same exposure leg as longWethUsdc, different counter leg — the D23 shape.
const longWethUsdt = marketFixture({ collateral: WETH, debt: USDT, direction: 'LONG', venue: 'MORPHO' })

describe('groupMarketsIntoPairs', () => {
  it('splits a long and a short of the same pair into two groups', () => {
    const groups = groupMarketsIntoPairs({ markets: [longWethUsdc, shortWethUsdc], liveByKey: new Map() })
    expect(groups).toHaveLength(2)
    expect(groups.map((g) => g.direction).sort()).toEqual(['LONG', 'SHORT'])
  })

  it('keeps two venues of one pair in a single group', () => {
    const groups = groupMarketsIntoPairs({ markets: [morphoWethUsdc, aaveWethUsdc], liveByKey: new Map() })
    expect(groups).toHaveLength(1)
    expect(groups[0]?.pairs).toHaveLength(2)
  })

  // The selector's headline max comes off the pair rows, so each one has to carry its venue's cap.
  it("carries each market's cap onto its pair row", () => {
    const groups = groupMarketsIntoPairs({
      markets: [morphoWethUsdc, { ...aaveWethUsdc, maxLeverage: 8 }],
      liveByKey: new Map(),
    })
    expect(groups[0]?.pairs.map((pair) => pair.maxLeverage).sort((a, b) => Number(a) - Number(b))).toEqual([5, 8])
  })

  // D23: an exposure token can be listed against more than one counter token. Grouping keys on the
  // whole (base, quote, direction) triple, so those stay two rows — collapsing them to one would hide
  // a market the server offers, and silently swap which debt the user borrows.
  it('keeps two counter tokens of one exposure token as separate groups', () => {
    const groups = groupMarketsIntoPairs({ markets: [longWethUsdc, longWethUsdt], liveByKey: new Map() })
    expect(groups).toHaveLength(2)
    expect(groups.map((group) => group.quote.symbol)).toEqual(['USDC', 'USDT'])
    expect(new Set(groups.map((group) => group.pairKey)).size).toBe(2)
  })

  // No curated address list survives — the payload's own order is the display order.
  it('orders groups by the order the markets list first mentions each base token', () => {
    expect(
      groupMarketsIntoPairs({ markets: [longCbbtcUsdc, longWethUsdc], liveByKey: new Map() }).map(
        (group) => group.base.symbol,
      ),
    ).toEqual(['cbBTC', 'WETH'])
    expect(
      groupMarketsIntoPairs({ markets: [longWethUsdc, longCbbtcUsdc], liveByKey: new Map() }).map(
        (group) => group.base.symbol,
      ),
    ).toEqual(['WETH', 'cbBTC'])
  })

  // Direction is the last comparator, so it is the one key a pair's two rows cannot tie on — and the
  // long is what `groups.at(0)` adopts no matter which way round the markets arrive.
  it("puts a pair's long ahead of its short from either input order", () => {
    for (const markets of [
      [longWethUsdc, shortWethUsdc],
      [shortWethUsdc, longWethUsdc],
    ]) {
      expect(groupMarketsIntoPairs({ markets, liveByKey: new Map() }).map((group) => group.direction)).toEqual([
        'LONG',
        'SHORT',
      ])
    }
  })
})

function rowFixture({
  collateral,
  debt,
  venue,
  direction,
  venues,
}: {
  collateral: MarginTokenInfo
  debt: MarginTokenInfo
  venue: MarginVenue
  direction: MarginDirection
  // One row now covers a whole pair; pass several to exercise the per-venue expansion.
  venues?: Array<{ venue: MarginVenue; maxLeverage: string }>
}): MarginMarketRow {
  const exposure = direction === 'SHORT' ? debt : collateral
  const counter = direction === 'SHORT' ? collateral : debt
  return {
    exposureToken: { address: exposure.address, chainId: 1, decimals: exposure.decimals },
    counterToken: { address: counter.address, chainId: 1, decimals: counter.decimals },
    direction,
    headlineVenue: venue,
    maxLeverage: '5',
    lltv: '860000000000000000',
    oraclePrice: '2000000000000000000000',
    venues: (venues ?? [{ venue, maxLeverage: '5' }]).map((entry) => ({
      venue: entry.venue,
      adapter: '0x0000000000000000000000000000000000000001',
      maxLeverage: entry.maxLeverage,
      lltv: '860000000000000000',
      availableBorrowLiquidity: '1000000000',
      feeBps: 5,
    })),
  }
}

const WETH_USDC_ROW = rowFixture({ collateral: WETH, debt: USDC, venue: 'MORPHO', direction: 'LONG' })

const LIVE_RESPONSE: MarginMarketsResponse = { requestId: 'req-1', markets: [WETH_USDC_ROW] }

const RAW_ADDRESS = /0x[0-9a-fA-F]{40}/

const SYMBOL_BY_ADDRESS = new Map([WETH, USDC, USDT, CBBTC].map((token) => [token.address, token.symbol]))

// Currency-info is unresolved throughout this suite, so a group's own symbols degrade to shortened
// addresses. Name a group off its addresses instead, which is what the ordering keys on anyway.
function groupShape(group: MarginPairGroup): [string, string, MarginDirection] {
  return [SYMBOL_BY_ADDRESS.get(group.base.address)!, SYMBOL_BY_ADDRESS.get(group.quote.address)!, group.direction]
}

function mockRows(rows: MarginMarketRow[]): void {
  mockUseMarginMarketsQuery.mockReturnValue({
    data: { requestId: 'req-1', markets: rows } satisfies MarginMarketsResponse,
    isLoading: false,
    isFetching: false,
    error: undefined,
    dataUpdatedAt: 0,
    refetch: () => {},
  })
}

describe('useMarginMarkets', () => {
  beforeEach(() => {
    mockUseMarginMarketsQuery.mockReturnValue({
      data: LIVE_RESPONSE,
      isLoading: false,
      isFetching: false,
      error: undefined,
      dataUpdatedAt: 0,
      refetch: () => {},
    })
    mockUseCurrencyInfos.mockReturnValue([])
  })

  it('returns undefined for a key absent from the live response', () => {
    const { result } = renderHook(() => useMarginMarkets())
    const absentKey = marginMarketKey({ collateralToken: CBBTC.address, debtToken: USDC.address, venue: 'MORPHO' })
    expect(result.current.getMarket(absentKey)).toBeUndefined()
  })

  // Currency-info can only be requested once this response names its tokens, so every market renders
  // at least once with no symbols resolved. A raw wire address must never stand in for a symbol.
  it('degrades symbols to shortened addresses while currency-info is unresolved', () => {
    mockRows([rowFixture({ collateral: CBBTC, debt: USDC, venue: 'MORPHO', direction: 'LONG' })])
    const { result } = renderHook(() => useMarginMarkets())
    const [market] = result.current.markets
    const shortCollateral = shortenAddress({ address: CBBTC.address })
    expect(shortCollateral).not.toBe(CBBTC.address)
    expect(market.collateral.symbol).toBe(shortCollateral)
    expect(market.debt.symbol).toBe(shortenAddress({ address: USDC.address }))
    expect(market.displaySymbol).toBe(shortCollateral)
    expect(market.asset).not.toMatch(RAW_ADDRESS)
    expect(market.name).not.toMatch(RAW_ADDRESS)
    expect(marginPairLabel({ market })).not.toMatch(RAW_ADDRESS)
  })

  it("orders a pair's long before its short regardless of wire order", () => {
    mockRows([
      rowFixture({ collateral: USDC, debt: WETH, venue: 'MORPHO', direction: 'SHORT' }),
      rowFixture({ collateral: WETH, debt: USDC, venue: 'MORPHO', direction: 'LONG' }),
    ])
    const { result } = renderHook(() => useMarginMarkets())
    expect(result.current.markets.map((m) => m.direction)).toEqual(['LONG', 'SHORT'])
  })

  // Which asset leads is the server's call now, not a client address list — the payload's row order
  // is the ranking, so listing a new asset first is enough to surface it first.
  it('ranks base tokens by where the payload first mentions them', () => {
    const cbbtcRow = rowFixture({ collateral: CBBTC, debt: USDC, venue: 'MORPHO', direction: 'LONG' })
    const wethRow = rowFixture({ collateral: WETH, debt: USDC, venue: 'MORPHO', direction: 'LONG' })
    mockRows([cbbtcRow, wethRow])
    const { result, rerender } = renderHook(() => useMarginMarkets())
    expect(result.current.groups.map((group) => group.base.address)).toEqual([CBBTC.address, WETH.address])

    mockRows([wethRow, cbbtcRow])
    rerender()
    expect(result.current.groups.map((group) => group.base.address)).toEqual([WETH.address, CBBTC.address])
  })

  // The form adopts groups.at(0) when nothing is selected, so this fixture is what pins the default a
  // cold load lands on. The short arrives FIRST on the wire and still loses to its long.
  it('pins the auto-adopted default to the leading pair group, long side', () => {
    mockRows([
      rowFixture({ collateral: USDC, debt: WETH, venue: 'MORPHO', direction: 'SHORT' }),
      rowFixture({ collateral: CBBTC, debt: USDC, venue: 'MORPHO', direction: 'LONG' }),
      rowFixture({ collateral: WETH, debt: USDC, venue: 'MORPHO', direction: 'LONG' }),
      rowFixture({ collateral: WETH, debt: USDT, venue: 'MORPHO', direction: 'LONG' }),
    ])
    const { result } = renderHook(() => useMarginMarkets())
    expect(result.current.groups.map(groupShape)).toEqual([
      ['WETH', 'USDC', 'LONG'],
      ['WETH', 'USDC', 'SHORT'],
      ['WETH', 'USDT', 'LONG'],
      ['cbBTC', 'USDC', 'LONG'],
    ])
    expect(result.current.groups.at(0)?.pairKey).toBe(
      marginPairKey({ collateralToken: WETH.address, debtToken: USDC.address }),
    )
    // The two lists lead with the same pair, so the form's adopted default and the selector's first
    // row cannot drift apart.
    const firstMarket = result.current.markets.at(0)
    expect(
      marginPairKey({ collateralToken: firstMarket!.collateral.address, debtToken: firstMarket!.debt.address }),
    ).toBe(result.current.groups.at(0)?.pairKey)
  })

  // D23 end-to-end: one exposure token listed against two counter tokens stays two rows all the way
  // through the hook, each with its own pairKey.
  it('keeps one exposure token listed against two counter tokens as two groups', () => {
    mockRows([
      rowFixture({ collateral: WETH, debt: USDC, venue: 'MORPHO', direction: 'LONG' }),
      rowFixture({ collateral: WETH, debt: USDT, venue: 'AAVE_V3', direction: 'LONG' }),
    ])
    const { result } = renderHook(() => useMarginMarkets())
    expect(result.current.groups).toHaveLength(2)
    expect(result.current.groups.map((group) => group.pairKey)).toEqual([
      marginPairKey({ collateralToken: WETH.address, debtToken: USDC.address }),
      marginPairKey({ collateralToken: WETH.address, debtToken: USDT.address }),
    ])
    expect(result.current.groups.every((group) => group.pairs.length === 1)).toBe(true)
  })

  it('orders two venues of one pair by venue', () => {
    mockRows([
      rowFixture({ collateral: WETH, debt: USDC, venue: 'MORPHO', direction: 'LONG' }),
      rowFixture({ collateral: WETH, debt: USDC, venue: 'AAVE_V3', direction: 'LONG' }),
    ])
    const { result } = renderHook(() => useMarginMarkets())
    expect(result.current.markets.map((m) => m.venue)).toEqual(['AAVE_V3', 'MORPHO'])
  })

  // The wire's cap is a decimal string and lands on the per-venue market unscaled — the WAD mirror
  // it used to be re-scaled into is gone, and the slider maxes over these values directly.
  it("carries each venue's own decimal maxLeverage onto its market", () => {
    mockRows([
      rowFixture({
        collateral: WETH,
        debt: USDC,
        venue: 'MORPHO',
        direction: 'LONG',
        venues: [
          { venue: 'MORPHO', maxLeverage: '3' },
          { venue: 'AAVE_V3', maxLeverage: '5.5' },
        ],
      }),
    ])
    const { result } = renderHook(() => useMarginMarkets())
    expect(result.current.markets.map((m) => [m.venue, m.maxLeverage])).toEqual([
      ['AAVE_V3', 5.5],
      ['MORPHO', 3],
    ])
  })

  it("exposes a pair's venues venue-free, in registry order", () => {
    mockRows([
      rowFixture({
        collateral: WETH,
        debt: USDC,
        venue: 'MORPHO',
        direction: 'LONG',
        venues: [
          { venue: 'MORPHO', maxLeverage: '3' },
          { venue: 'AAVE_V3', maxLeverage: '5' },
        ],
      }),
    ])
    const { result } = renderHook(() => useMarginMarkets())
    const pairKey = marginPairKey({ collateralToken: WETH.address, debtToken: USDC.address })
    expect(result.current.getPairMarkets(pairKey).map((m) => m.venue)).toEqual(['AAVE_V3', 'MORPHO'])
    expect(result.current.getPairMarket(pairKey)?.venue).toBe('AAVE_V3')
  })

  // Compound is enablement only: the BE composes its plans, so the FE has to do nothing but expand
  // and group it alongside the venues it already knew.
  it('expands a COMPOUND_V3 venue into its own market and groups it with its pair siblings', () => {
    mockRows([
      rowFixture({
        collateral: WETH,
        debt: USDC,
        venue: 'MORPHO',
        direction: 'LONG',
        venues: [
          { venue: 'MORPHO', maxLeverage: '3' },
          { venue: 'COMPOUND_V3', maxLeverage: '4' },
          { venue: 'AAVE_V3', maxLeverage: '5' },
        ],
      }),
    ])
    const { result } = renderHook(() => useMarginMarkets())
    expect(result.current.markets.map((m) => [m.venue, m.maxLeverage])).toEqual([
      ['AAVE_V3', 5],
      ['COMPOUND_V3', 4],
      ['MORPHO', 3],
    ])
    expect(result.current.groups).toHaveLength(1)
    expect(result.current.groups[0]?.pairs.map((p) => p.venue)).toContain('COMPOUND_V3')

    const pairKey = marginPairKey({ collateralToken: WETH.address, debtToken: USDC.address })
    expect(result.current.getPairMarkets(pairKey).map((m) => m.venue)).toContain('COMPOUND_V3')
    expect(
      result.current.getMarketByTokens({ collateralToken: WETH.address, debtToken: USDC.address, venue: 'COMPOUND_V3' })
        ?.maxLeverage,
    ).toBe(4)
  })

  // The derived venue allowlist is a React Query key: a fresh array per render would re-quote on
  // every render, so the per-pair list has to come back identical until the registry itself changes.
  it('returns a reference-stable list across renders, and one for an unknown pair', () => {
    const { result, rerender } = renderHook(() => useMarginMarkets())
    const pairKey = marginPairKey({ collateralToken: WETH.address, debtToken: USDC.address })
    const first = result.current.getPairMarkets(pairKey)
    const firstEmpty = result.current.getPairMarkets('nope')
    rerender()
    expect(result.current.getPairMarkets(pairKey)).toBe(first)
    expect(result.current.getPairMarkets('nope')).toBe(firstEmpty)
    expect(firstEmpty).toEqual([])
  })

  // Plan and position rows may name no venue; resolving to the pair's first market keeps their
  // display alive rather than blanking the row. A venue that IS named resolves exactly or not at all.
  it('resolves by tokens exactly when a venue is named, else by pair', () => {
    mockRows([
      rowFixture({
        collateral: WETH,
        debt: USDC,
        venue: 'MORPHO',
        direction: 'LONG',
        venues: [
          { venue: 'MORPHO', maxLeverage: '3' },
          { venue: 'AAVE_V3', maxLeverage: '5' },
        ],
      }),
    ])
    const { result } = renderHook(() => useMarginMarkets())
    const tokens = { collateralToken: WETH.address, debtToken: USDC.address }
    expect(result.current.getMarketByTokens({ ...tokens, venue: 'MORPHO' })?.venue).toBe('MORPHO')
    expect(result.current.getMarketByTokens(tokens)?.venue).toBe('AAVE_V3')
    expect(
      result.current.getMarketByTokens({ collateralToken: CBBTC.address, debtToken: USDC.address }),
    ).toBeUndefined()
  })

  // The payload drops a venue whose read failed, so a held position can name one that is not listed.
  // Answering with a sibling would hand back another venue's lltv and maxLeverage.
  it('does not substitute a sibling venue when the named one is absent', () => {
    mockRows([
      rowFixture({
        collateral: WETH,
        debt: USDC,
        venue: 'AAVE_V3',
        direction: 'LONG',
        venues: [{ venue: 'AAVE_V3', maxLeverage: '5' }],
      }),
    ])
    const { result } = renderHook(() => useMarginMarkets())
    expect(
      result.current.getMarketByTokens({ collateralToken: WETH.address, debtToken: USDC.address, venue: 'MORPHO' }),
    ).toBeUndefined()
  })
})
