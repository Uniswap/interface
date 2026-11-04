import { UniverseChainId } from '@universe/chains'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { describe, expect, it } from 'vitest'
import { MARGIN_CHAIN_ID, type MarginPairGroup, USDC, USDT, WETH } from '~/constants/margin'
import {
  buildMarginPairRows,
  filterMarginPairRows,
  marginAssetFilterOptions,
  marginDebtFilterOptions,
  marginPairCategoryIds,
  marginPairMaxLeverage,
} from '~/pages/Swap/Margin/marginPairVenueList'

const CBBTC = { address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf', symbol: 'cbBTC', decimals: 8 } as const
const WSTETH = { address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0', symbol: 'wstETH', decimals: 18 } as const

// pairs[] arrives cheapest-borrow first (groupMarketsIntoPairs).
const ETH_USDC_LONG: MarginPairGroup = {
  key: 'eth-usdc-long',
  pairKey: 'weth-usdc',
  base: WETH,
  quote: USDC,
  direction: MarginDirection.LONG,
  pairs: [
    {
      key: 'weth-usdc-MORPHO',
      debt: USDC,
      venue: 'MORPHO',
      lltvWad: '860000000000000000',
      borrowRateBps: 420,
      maxLeverage: 4,
    },
    { key: 'weth-usdc-AAVE_V3', debt: USDC, venue: 'AAVE_V3', lltvWad: '0', borrowRateBps: 510, maxLeverage: 5 },
    {
      key: 'weth-usdc-COMPOUND_V3',
      debt: USDC,
      venue: 'COMPOUND_V3',
      lltvWad: '0',
      borrowRateBps: 600,
      maxLeverage: 7,
    },
  ],
}
const ETH_USDT_LONG: MarginPairGroup = {
  key: 'eth-usdt-long',
  pairKey: 'weth-usdt',
  base: WETH,
  quote: USDT,
  direction: MarginDirection.LONG,
  pairs: [{ key: 'weth-usdt-MORPHO', debt: USDT, venue: 'MORPHO', lltvWad: '860000000000000000' }],
}
const CBBTC_USDC_LONG: MarginPairGroup = {
  key: 'cbbtc-usdc-long',
  pairKey: 'cbbtc-usdc',
  base: CBBTC,
  quote: USDC,
  direction: MarginDirection.LONG,
  pairs: [{ key: 'cbbtc-usdc-AAVE_V3', debt: USDC, venue: 'AAVE_V3', lltvWad: '0' }],
}
const WSTETH_USDC_LONG: MarginPairGroup = {
  key: 'wsteth-usdc-long',
  pairKey: 'wsteth-usdc',
  base: WSTETH,
  quote: USDC,
  direction: MarginDirection.LONG,
  pairs: [{ key: 'wsteth-usdc-MORPHO', debt: USDC, venue: 'MORPHO', lltvWad: '860000000000000000' }],
}
// A short borrows the traded token, so its debt leg is WETH, not the stable.
const ETH_USDC_SHORT: MarginPairGroup = {
  key: 'eth-usdc-short',
  pairKey: 'usdc-weth',
  base: WETH,
  quote: USDC,
  direction: MarginDirection.SHORT,
  pairs: [{ key: 'usdc-weth-AAVE_V3', debt: WETH, venue: 'AAVE_V3', lltvWad: '0' }],
}

const ALL_GROUPS = [ETH_USDC_LONG, ETH_USDT_LONG, CBBTC_USDC_LONG, WSTETH_USDC_LONG, ETH_USDC_SHORT]

const tokenName = (token: { symbol: string }): string => (token.symbol === 'WETH' ? 'Wrapped Ether' : token.symbol)

describe('buildMarginPairRows', () => {
  it('lists one row per pair with every venue counted, in registry order', () => {
    const rows = buildMarginPairRows({ groups: [ETH_USDC_LONG, CBBTC_USDC_LONG], excludedVenues: [] })
    expect(rows.map((row) => [row.group.key, row.venues.map((pair) => pair.venue)])).toEqual([
      ['eth-usdc-long', ['MORPHO', 'AAVE_V3', 'COMPOUND_V3']],
      ['cbbtc-usdc-long', ['AAVE_V3']],
    ])
  })

  it('counts only the venues the user has not opted out of, keeping the rest in order', () => {
    const [row] = buildMarginPairRows({ groups: [ETH_USDC_LONG], excludedVenues: ['COMPOUND_V3'] })
    expect(row.venues.map((pair) => pair.venue)).toEqual(['MORPHO', 'AAVE_V3'])
  })

  it('drops a pair whose every venue is opted out', () => {
    const rows = buildMarginPairRows({ groups: [ETH_USDC_LONG, CBBTC_USDC_LONG], excludedVenues: ['AAVE_V3'] })
    expect(rows.map((row) => row.group.key)).toEqual(['eth-usdc-long'])
  })

  it('returns nothing for an empty registry', () => {
    expect(buildMarginPairRows({ groups: [], excludedVenues: [] })).toEqual([])
  })

  it('lists every row on the chain the markets were fetched for', () => {
    const rows = buildMarginPairRows({ groups: ALL_GROUPS, excludedVenues: [] })
    expect(new Set(rows.map((row) => row.chainId))).toEqual(new Set([MARGIN_CHAIN_ID]))
  })
})

describe('marginPairMaxLeverage', () => {
  it('is the highest max leverage among the venues the user has not opted out of', () => {
    const [all] = buildMarginPairRows({ groups: [ETH_USDC_LONG], excludedVenues: [] })
    expect(marginPairMaxLeverage(all)).toBe(7)
    const [withoutCompound] = buildMarginPairRows({ groups: [ETH_USDC_LONG], excludedVenues: ['COMPOUND_V3'] })
    expect(marginPairMaxLeverage(withoutCompound)).toBe(5)
  })

  it('is undefined while no venue carries a max leverage', () => {
    const [row] = buildMarginPairRows({ groups: [ETH_USDT_LONG], excludedVenues: [] })
    expect(marginPairMaxLeverage(row)).toBeUndefined()
  })
})

describe('filterMarginPairRows', () => {
  const rows = buildMarginPairRows({ groups: ALL_GROUPS, excludedVenues: [] })
  const keys = (filtered: ReturnType<typeof filterMarginPairRows>): string[] => filtered.map((row) => row.group.key)

  it('keeps every row under All networks or the markets chain, and none on another chain', () => {
    expect(keys(filterMarginPairRows({ rows, tokenName }))).toHaveLength(ALL_GROUPS.length)
    expect(keys(filterMarginPairRows({ rows, chainId: MARGIN_CHAIN_ID, tokenName }))).toHaveLength(ALL_GROUPS.length)
    expect(keys(filterMarginPairRows({ rows, chainId: UniverseChainId.Base, tokenName }))).toEqual([])
  })

  it('keeps only the chosen side', () => {
    expect(keys(filterMarginPairRows({ rows, direction: MarginDirection.SHORT, tokenName }))).toEqual([
      'eth-usdc-short',
    ])
  })

  it('matches unwrapped and raw symbols, names and slash-free pair text, never venue names', () => {
    const search = (query: string): string[] =>
      keys(filterMarginPairRows({ rows, query, direction: MarginDirection.LONG, tokenName }))
    expect(search('weth')).toEqual(['eth-usdc-long', 'eth-usdt-long'])
    expect(search('eth')).toEqual(['eth-usdc-long', 'eth-usdt-long', 'wsteth-usdc-long'])
    expect(search('Wrapped')).toEqual(['eth-usdc-long', 'eth-usdt-long'])
    expect(search('ethusdt')).toEqual(['eth-usdt-long'])
    expect(search(' ETH / USDT ')).toEqual(['eth-usdt-long'])
    expect(search('compound')).toEqual([])
    expect(search('zzz')).toEqual([])
  })

  // Data API category ids, keyed by lowercase address. USDC carries one too, to prove the stable leg never
  // puts a pair in a category.
  const categoryIdsByToken = new Map<string, readonly string[]>([
    [WETH.address.toLowerCase(), ['majors']],
    [CBBTC.address.toLowerCase(), ['majors']],
    [WSTETH.address.toLowerCase(), ['defi']],
    [USDC.address.toLowerCase(), ['stablecoins']],
  ])

  it('narrows to a backend category by the traded token alone', () => {
    const inCategory = (categoryId: string): string[] =>
      keys(filterMarginPairRows({ rows, direction: MarginDirection.LONG, categoryId, categoryIdsByToken, tokenName }))
    expect(inCategory('defi')).toEqual(['wsteth-usdc-long'])
    expect(inCategory('majors')).toEqual(['eth-usdc-long', 'eth-usdt-long', 'cbbtc-usdc-long'])
    expect(inCategory('stablecoins')).toEqual([])
  })

  it('matches nothing in a category when no token carries category data', () => {
    expect(keys(filterMarginPairRows({ rows, categoryId: 'majors', tokenName }))).toEqual([])
  })

  it('offers only the categories the listed traded tokens carry', () => {
    const shortRows = filterMarginPairRows({ rows, direction: MarginDirection.SHORT, tokenName })
    expect([...marginPairCategoryIds({ rows, categoryIdsByToken })].sort()).toEqual(['defi', 'majors'])
    expect([...marginPairCategoryIds({ rows: shortRows, categoryIdsByToken })]).toEqual(['majors'])
    expect(marginPairCategoryIds({ rows, categoryIdsByToken: new Map() }).size).toBe(0)
  })

  it('filters by long asset and by debt asset, which is the traded token on a short', () => {
    expect(keys(filterMarginPairRows({ rows, asset: CBBTC.address.toLowerCase(), tokenName }))).toEqual([
      'cbbtc-usdc-long',
    ])
    expect(keys(filterMarginPairRows({ rows, debt: WETH.address.toLowerCase(), tokenName }))).toEqual([
      'eth-usdc-short',
    ])
    expect(keys(filterMarginPairRows({ rows, debt: USDT.address.toLowerCase(), tokenName }))).toEqual(['eth-usdt-long'])
  })
})

describe('filter options', () => {
  const longRows = filterMarginPairRows({
    rows: buildMarginPairRows({ groups: ALL_GROUPS, excludedVenues: [] }),
    direction: MarginDirection.LONG,
    tokenName,
  })

  it('lists each traded token once, in pair order', () => {
    expect(marginAssetFilterOptions(longRows).map((option) => option.token.symbol)).toEqual(['WETH', 'cbBTC', 'wstETH'])
  })

  it('lists each borrowed token once', () => {
    expect(marginDebtFilterOptions(longRows).map((option) => option.token.symbol)).toEqual(['USDC', 'USDT'])
  })
})
