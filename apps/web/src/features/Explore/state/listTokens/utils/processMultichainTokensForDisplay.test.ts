import type { RankedMultichainToken } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { ALL_CHAIN_IDS } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { createRankedMultichainToken } from 'uniswap/src/test/fixtures/dataApi/rankedMultichainToken'
import { describe, expect, it, vi } from 'vitest'
import { TokenSortMethod } from '~/components/Tokens/constants'
import { TimePeriod } from '~/data/util'
import type { ProcessMultichainTokensForDisplayParams } from '~/features/Explore/state/listTokens/utils/processMultichainTokensForDisplay'
import { processMultichainTokensForDisplay } from '~/features/Explore/state/listTokens/utils/processMultichainTokensForDisplay'

vi.mock('~/features/Explore/state/listTokens/utils/filterMultichainTokensBySearchString', () => ({
  filterMultichainTokensBySearchString: vi.fn((tokens: unknown[], filterString: string) => {
    if (!filterString) {
      return tokens
    }
    const lower = filterString.toLowerCase()
    return (tokens as { multichainToken?: { name: string; symbol: string } }[]).filter(
      (t) =>
        t.multichainToken?.name.toLowerCase().includes(lower) ||
        t.multichainToken?.symbol.toLowerCase().includes(lower),
    )
  }),
}))

const defaultOptions: ProcessMultichainTokensForDisplayParams['options'] = {
  sortMethod: TokenSortMethod.VOLUME,
  sortAscending: false,
  filterString: '',
  filterTimePeriod: TimePeriod.DAY,
}

describe('processMultichainTokensForDisplay', () => {
  it('should return topTokens unchanged when filterString is empty and sortMethod is not PRICE', () => {
    const tokens = [
      createRankedMultichainToken({ multichainId: 'mc:a', symbol: 'A', price: 1 }),
      createRankedMultichainToken({ multichainId: 'mc:b', symbol: 'B', price: 2 }),
    ]
    const { topTokens, tokenSortRank } = processMultichainTokensForDisplay({
      tokens,
      options: defaultOptions,
      trustBackendOrder: false,
      allowedChainIds: ALL_CHAIN_IDS,
    })
    expect(topTokens).toHaveLength(2)
    expect(topTokens[0]?.multichainToken?.symbol).toBe('A')
    expect(topTokens[1]?.multichainToken?.symbol).toBe('B')
    expect(tokenSortRank[topTokens[0]!.multichainToken!.multichainId]).toBe(1)
    expect(tokenSortRank[topTokens[1]!.multichainToken!.multichainId]).toBe(2)
  })

  it('should filter by options.filterString and keep tokenSortRank from order after sort (before search)', () => {
    const tokens = [
      createRankedMultichainToken({ multichainId: 'mc:usdc', name: 'USD Coin', symbol: 'USDC' }),
      createRankedMultichainToken({ multichainId: 'mc:weth', name: 'Wrapped Ether', symbol: 'WETH' }),
    ]
    const { topTokens, tokenSortRank } = processMultichainTokensForDisplay({
      tokens,
      options: {
        ...defaultOptions,
        filterString: 'usdc',
      },
      trustBackendOrder: false,
      allowedChainIds: ALL_CHAIN_IDS,
    })
    expect(topTokens).toHaveLength(1)
    expect(topTokens[0]?.multichainToken?.symbol).toBe('USDC')
    expect(tokenSortRank[tokens[0]!.multichainToken!.multichainId]).toBe(1)
    expect(tokenSortRank[tokens[1]!.multichainToken!.multichainId]).toBe(2)
  })

  it('should sort by price descending when sortMethod is PRICE and sortAscending is false', () => {
    const tokens = [
      createRankedMultichainToken({ multichainId: 'mc:low', symbol: 'Low', price: 0.5 }),
      createRankedMultichainToken({ multichainId: 'mc:high', symbol: 'High', price: 10 }),
      createRankedMultichainToken({ multichainId: 'mc:mid', symbol: 'Mid', price: 2 }),
    ]
    const { topTokens } = processMultichainTokensForDisplay({
      tokens,
      options: { ...defaultOptions, sortMethod: TokenSortMethod.PRICE, sortAscending: false },
      trustBackendOrder: false,
      allowedChainIds: ALL_CHAIN_IDS,
    })
    expect(topTokens).toHaveLength(3)
    expect(topTokens[0]?.multichainToken?.symbol).toBe('High')
    expect(topTokens[1]?.multichainToken?.symbol).toBe('Mid')
    expect(topTokens[2]?.multichainToken?.symbol).toBe('Low')
  })

  it('should sort by price ascending when sortMethod is PRICE and sortAscending is true', () => {
    const tokens = [
      createRankedMultichainToken({ multichainId: 'mc:high', symbol: 'High', price: 10 }),
      createRankedMultichainToken({ multichainId: 'mc:low', symbol: 'Low', price: 0.5 }),
      createRankedMultichainToken({ multichainId: 'mc:mid', symbol: 'Mid', price: 2 }),
    ]
    const { topTokens } = processMultichainTokensForDisplay({
      tokens,
      options: { ...defaultOptions, sortMethod: TokenSortMethod.PRICE, sortAscending: true },
      trustBackendOrder: false,
      allowedChainIds: ALL_CHAIN_IDS,
    })
    expect(topTokens).toHaveLength(3)
    expect(topTokens[0]?.multichainToken?.symbol).toBe('Low')
    expect(topTokens[1]?.multichainToken?.symbol).toBe('Mid')
    expect(topTokens[2]?.multichainToken?.symbol).toBe('High')
  })

  it('should not sort when sortMethod is not PRICE', () => {
    const tokens = [
      createRankedMultichainToken({ multichainId: 'mc:a', symbol: 'A', price: 1 }),
      createRankedMultichainToken({ multichainId: 'mc:b', symbol: 'B', price: 2 }),
    ]
    const { topTokens } = processMultichainTokensForDisplay({
      tokens,
      options: { ...defaultOptions, sortMethod: TokenSortMethod.VOLUME },
      trustBackendOrder: false,
      allowedChainIds: ALL_CHAIN_IDS,
    })
    expect(topTokens).toHaveLength(2)
    expect(topTokens[0]?.multichainToken?.symbol).toBe('A')
    expect(topTokens[1]?.multichainToken?.symbol).toBe('B')
  })

  it('should not sort by price when trustBackendOrder is true, even if sortMethod is PRICE', () => {
    const tokens = [
      createRankedMultichainToken({ multichainId: 'mc:low', symbol: 'Low', price: 0.5 }),
      createRankedMultichainToken({ multichainId: 'mc:high', symbol: 'High', price: 10 }),
    ]
    const { topTokens } = processMultichainTokensForDisplay({
      tokens,
      options: { ...defaultOptions, sortMethod: TokenSortMethod.PRICE, sortAscending: false },
      trustBackendOrder: true,
      allowedChainIds: ALL_CHAIN_IDS,
    })
    expect(topTokens).toHaveLength(2)
    expect(topTokens[0]?.multichainToken?.symbol).toBe('Low')
    expect(topTokens[1]?.multichainToken?.symbol).toBe('High')
  })

  it('should filter then sort when both filterString and PRICE sort are set', () => {
    const tokens = [
      createRankedMultichainToken({ multichainId: 'mc:alpha', name: 'Token Alpha', symbol: 'ALPHA', price: 5 }),
      createRankedMultichainToken({ multichainId: 'mc:beta', name: 'Token Beta', symbol: 'BETA', price: 1 }),
      createRankedMultichainToken({ multichainId: 'mc:alpha2', name: 'Token Alpha Two', symbol: 'ALPHA2', price: 3 }),
    ]
    const { topTokens } = processMultichainTokensForDisplay({
      tokens,
      options: { ...defaultOptions, filterString: 'alpha', sortMethod: TokenSortMethod.PRICE, sortAscending: true },
      trustBackendOrder: false,
      allowedChainIds: ALL_CHAIN_IDS,
    })
    expect(topTokens).toHaveLength(2)
    expect(topTokens[0]?.multichainToken?.symbol).toBe('ALPHA2')
    expect(topTokens[1]?.multichainToken?.symbol).toBe('ALPHA')
  })

  it('should treat missing price as 0 for sort', () => {
    const withPrice = createRankedMultichainToken({ symbol: 'With', price: 1 })
    const noStats = createRankedMultichainToken({
      multichainId: 'mc:1_0xNone',
      symbol: 'None',
      name: 'No Stats',
      price: undefined,
    })
    const { topTokens } = processMultichainTokensForDisplay({
      tokens: [withPrice, noStats],
      options: { ...defaultOptions, sortMethod: TokenSortMethod.PRICE, sortAscending: true },
      trustBackendOrder: false,
      allowedChainIds: ALL_CHAIN_IDS,
    })
    expect(topTokens).toHaveLength(2)
    expect(topTokens[0]?.multichainToken?.symbol).toBe('None')
    expect(topTokens[1]?.multichainToken?.symbol).toBe('With')
  })

  it('should keep global ranks from post-sort order when filterString narrows rows', () => {
    const a = createRankedMultichainToken({ multichainId: 'mc:a', name: 'Alpha', symbol: 'A' })
    const b = createRankedMultichainToken({ multichainId: 'mc:b', name: 'Beta', symbol: 'B' })
    const { topTokens, tokenSortRank } = processMultichainTokensForDisplay({
      tokens: [a, b],
      options: { ...defaultOptions, filterString: 'alpha' },
      trustBackendOrder: false,
      allowedChainIds: ALL_CHAIN_IDS,
    })
    expect(topTokens).toHaveLength(1)
    expect(topTokens[0]?.multichainToken?.symbol).toBe('A')
    expect(tokenSortRank['mc:a']).toBe(1)
    expect(tokenSortRank['mc:b']).toBe(2)
  })

  it('should rank by PRICE-sorted order then filter does not change ranks for remaining rows', () => {
    const low = createRankedMultichainToken({ multichainId: 'mc:low', symbol: 'Low', price: 1 })
    const high = createRankedMultichainToken({ multichainId: 'mc:high', symbol: 'High', price: 10 })
    const { topTokens, tokenSortRank } = processMultichainTokensForDisplay({
      tokens: [low, high],
      options: { ...defaultOptions, sortMethod: TokenSortMethod.PRICE, sortAscending: false },
      trustBackendOrder: false,
      allowedChainIds: ALL_CHAIN_IDS,
    })
    expect(topTokens[0]?.multichainToken?.symbol).toBe('High')
    expect(tokenSortRank['mc:high']).toBe(1)
    expect(tokenSortRank['mc:low']).toBe(2)
  })

  it('should drop repeat multichainIds, keeping the first occurrence (e.g. the same token returned twice in one fetch)', () => {
    const firstSeen = createRankedMultichainToken({ multichainId: 'mc:dup', symbol: 'DUP', price: 1 })
    const repeat = createRankedMultichainToken({ multichainId: 'mc:dup', symbol: 'DUP', price: 1 })
    const other = createRankedMultichainToken({ multichainId: 'mc:unique', symbol: 'UNIQUE', price: 2 })
    const { topTokens } = processMultichainTokensForDisplay({
      tokens: [firstSeen, repeat, other],
      options: defaultOptions,
      trustBackendOrder: false,
      allowedChainIds: ALL_CHAIN_IDS,
    })
    expect(topTokens).toHaveLength(2)
    expect(topTokens[0]).toBe(firstSeen)
    expect(topTokens[1]).toBe(other)
  })

  it('should drop a token missing its multichainToken payload (empty network set renders no row)', () => {
    const withoutId = { multichainToken: undefined } as unknown as RankedMultichainToken
    const withId = createRankedMultichainToken({ multichainId: 'mc:a', symbol: 'B' })
    const { topTokens, tokenSortRank } = processMultichainTokensForDisplay({
      tokens: [withoutId, withoutId, withId],
      options: defaultOptions,
      trustBackendOrder: false,
      allowedChainIds: ALL_CHAIN_IDS,
    })
    // A payload-less row has no addresses, so its filtered network set is empty: it would
    // render "0 networks" with no icons or TDP link, so it produces no row and no rank.
    expect(topTokens).toHaveLength(1)
    expect(topTokens[0]).toBe(withId)
    expect(tokenSortRank['mc:a']).toBe(1)
  })

  it('should drop a token whose every addresses leg is outside the allowed list, keeping ranks contiguous', () => {
    // Impossible for well-formed data (the FE only requests enabled chains, so a ranked token
    // must have at least one enabled leg); defensive hide of inconsistent data per reviewer
    // direction. The drop runs before ranking, so the next visible token takes the dropped
    // token's rank number instead of leaving a numbering gap.
    const first = createRankedMultichainToken({ multichainId: 'mc:first', symbol: 'FIRST', addresses: { '1': '0xa' } })
    const unsupported = createRankedMultichainToken({
      multichainId: 'mc:unsupported',
      symbol: 'GONE',
      addresses: { '57073': '0xb', '999999999': '0xc' },
    })
    const next = createRankedMultichainToken({ multichainId: 'mc:next', symbol: 'NEXT', addresses: { '10': '0xd' } })
    const { topTokens, tokenSortRank } = processMultichainTokensForDisplay({
      tokens: [first, unsupported, next],
      options: defaultOptions,
      trustBackendOrder: true,
      allowedChainIds: [UniverseChainId.Mainnet, UniverseChainId.Optimism],
    })
    expect(topTokens.map((t) => t.multichainToken?.symbol)).toEqual(['FIRST', 'NEXT'])
    expect(tokenSortRank['mc:first']).toBe(1)
    expect(tokenSortRank['mc:next']).toBe(2)
    expect(tokenSortRank['mc:unsupported']).toBeUndefined()
  })
  it('should give ungrouped singles (empty multichainId) distinct ranks instead of colliding', () => {
    const tokens = [
      createRankedMultichainToken({ multichainId: 'mc:eth', symbol: 'ETH' }),
      createRankedMultichainToken({
        multichainId: '',
        symbol: 'USDC.e',
        addresses: { '137': '0x1111111111111111111111111111111111111111' },
      }),
      createRankedMultichainToken({
        multichainId: '',
        symbol: 'WBNB',
        addresses: { '56': '0x2222222222222222222222222222222222222222' },
      }),
    ]
    const { topTokens, tokenSortRank } = processMultichainTokensForDisplay({
      tokens,
      options: defaultOptions,
      trustBackendOrder: true,
      allowedChainIds: ALL_CHAIN_IDS,
    })
    // Singles must not dedupe against each other on the shared '' sentinel...
    expect(topTokens).toHaveLength(3)
    // ...and each gets its own rank, keyed by chainId:address.
    expect(tokenSortRank['mc:eth']).toBe(1)
    expect(tokenSortRank['137:0x1111111111111111111111111111111111111111']).toBe(2)
    expect(tokenSortRank['56:0x2222222222222222222222222222222222222222']).toBe(3)
  })

  it('should dedupe a repeated ungrouped single by its chain and address', () => {
    const tokens = [
      createRankedMultichainToken({
        multichainId: '',
        symbol: 'USDC.e',
        addresses: { '137': '0x1111111111111111111111111111111111111111' },
      }),
      createRankedMultichainToken({
        multichainId: '',
        symbol: 'USDC.e',
        addresses: { '137': '0x1111111111111111111111111111111111111111' },
      }),
    ]
    const { topTokens } = processMultichainTokensForDisplay({
      tokens,
      options: defaultOptions,
      trustBackendOrder: true,
      allowedChainIds: ALL_CHAIN_IDS,
    })
    expect(topTokens).toHaveLength(1)
  })
})
