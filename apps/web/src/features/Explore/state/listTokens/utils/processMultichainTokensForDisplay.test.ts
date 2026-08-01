import { createRankedMultichainToken } from 'uniswap/src/test/fixtures/dataApi/rankedMultichainToken'
import { describe, expect, it, vi } from 'vitest'
import { TimePeriod } from '~/appGraphql/data/util'
import { TokenSortMethod } from '~/components/Tokens/constants'
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

const defaultOptions: Parameters<typeof processMultichainTokensForDisplay>[1] = {
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
    const { topTokens, tokenSortRank } = processMultichainTokensForDisplay(tokens, defaultOptions)
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
    const { topTokens, tokenSortRank } = processMultichainTokensForDisplay(tokens, {
      ...defaultOptions,
      filterString: 'usdc',
    })
    expect(topTokens).toHaveLength(1)
    expect(topTokens[0]?.multichainToken?.symbol).toBe('USDC')
    expect(tokenSortRank[tokens[0]!.multichainToken!.multichainId]).toBe(1)
    expect(tokenSortRank[tokens[1]!.multichainToken!.multichainId]).toBe(2)
  })

  it('should sort by price descending when sortMethod is PRICE and sortAscending is false', () => {
    const tokens = [
      createRankedMultichainToken({ symbol: 'Low', price: 0.5 }),
      createRankedMultichainToken({ symbol: 'High', price: 10 }),
      createRankedMultichainToken({ symbol: 'Mid', price: 2 }),
    ]
    const { topTokens } = processMultichainTokensForDisplay(tokens, {
      ...defaultOptions,
      sortMethod: TokenSortMethod.PRICE,
      sortAscending: false,
    })
    expect(topTokens).toHaveLength(3)
    expect(topTokens[0]?.multichainToken?.symbol).toBe('High')
    expect(topTokens[1]?.multichainToken?.symbol).toBe('Mid')
    expect(topTokens[2]?.multichainToken?.symbol).toBe('Low')
  })

  it('should sort by price ascending when sortMethod is PRICE and sortAscending is true', () => {
    const tokens = [
      createRankedMultichainToken({ symbol: 'High', price: 10 }),
      createRankedMultichainToken({ symbol: 'Low', price: 0.5 }),
      createRankedMultichainToken({ symbol: 'Mid', price: 2 }),
    ]
    const { topTokens } = processMultichainTokensForDisplay(tokens, {
      ...defaultOptions,
      sortMethod: TokenSortMethod.PRICE,
      sortAscending: true,
    })
    expect(topTokens).toHaveLength(3)
    expect(topTokens[0]?.multichainToken?.symbol).toBe('Low')
    expect(topTokens[1]?.multichainToken?.symbol).toBe('Mid')
    expect(topTokens[2]?.multichainToken?.symbol).toBe('High')
  })

  it('should not sort when sortMethod is not PRICE', () => {
    const tokens = [
      createRankedMultichainToken({ symbol: 'A', price: 1 }),
      createRankedMultichainToken({ symbol: 'B', price: 2 }),
    ]
    const { topTokens } = processMultichainTokensForDisplay(tokens, {
      ...defaultOptions,
      sortMethod: TokenSortMethod.VOLUME,
    })
    expect(topTokens).toHaveLength(2)
    expect(topTokens[0]?.multichainToken?.symbol).toBe('A')
    expect(topTokens[1]?.multichainToken?.symbol).toBe('B')
  })

  it('should filter then sort when both filterString and PRICE sort are set', () => {
    const tokens = [
      createRankedMultichainToken({ name: 'Token Alpha', symbol: 'ALPHA', price: 5 }),
      createRankedMultichainToken({ name: 'Token Beta', symbol: 'BETA', price: 1 }),
      createRankedMultichainToken({ name: 'Token Alpha Two', symbol: 'ALPHA2', price: 3 }),
    ]
    const { topTokens } = processMultichainTokensForDisplay(tokens, {
      ...defaultOptions,
      filterString: 'alpha',
      sortMethod: TokenSortMethod.PRICE,
      sortAscending: true,
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
    const { topTokens } = processMultichainTokensForDisplay([withPrice, noStats], {
      ...defaultOptions,
      sortMethod: TokenSortMethod.PRICE,
      sortAscending: true,
    })
    expect(topTokens).toHaveLength(2)
    expect(topTokens[0]?.multichainToken?.symbol).toBe('None')
    expect(topTokens[1]?.multichainToken?.symbol).toBe('With')
  })

  it('should keep global ranks from post-sort order when filterString narrows rows', () => {
    const a = createRankedMultichainToken({ multichainId: 'mc:a', name: 'Alpha', symbol: 'A' })
    const b = createRankedMultichainToken({ multichainId: 'mc:b', name: 'Beta', symbol: 'B' })
    const { topTokens, tokenSortRank } = processMultichainTokensForDisplay([a, b], {
      ...defaultOptions,
      filterString: 'alpha',
    })
    expect(topTokens).toHaveLength(1)
    expect(topTokens[0]?.multichainToken?.symbol).toBe('A')
    expect(tokenSortRank['mc:a']).toBe(1)
    expect(tokenSortRank['mc:b']).toBe(2)
  })

  it('should rank by PRICE-sorted order then filter does not change ranks for remaining rows', () => {
    const low = createRankedMultichainToken({ multichainId: 'mc:low', symbol: 'Low', price: 1 })
    const high = createRankedMultichainToken({ multichainId: 'mc:high', symbol: 'High', price: 10 })
    const { topTokens, tokenSortRank } = processMultichainTokensForDisplay([low, high], {
      ...defaultOptions,
      sortMethod: TokenSortMethod.PRICE,
      sortAscending: false,
    })
    expect(topTokens[0]?.multichainToken?.symbol).toBe('High')
    expect(tokenSortRank['mc:high']).toBe(1)
    expect(tokenSortRank['mc:low']).toBe(2)
  })
})
