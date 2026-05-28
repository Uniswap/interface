import { createDataApiMultichainToken } from 'uniswap/src/test/fixtures/dataApi/multichainToken'
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
    return (tokens as { name: string; symbol: string; projectName: string }[]).filter(
      (t) =>
        t.name.toLowerCase().includes(lower) ||
        t.symbol.toLowerCase().includes(lower) ||
        t.projectName.toLowerCase().includes(lower),
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
      createDataApiMultichainToken({ multichainId: 'mc:a', symbol: 'A', price: 1 }),
      createDataApiMultichainToken({ multichainId: 'mc:b', symbol: 'B', price: 2 }),
    ]
    const { topTokens, tokenSortRank } = processMultichainTokensForDisplay(tokens, defaultOptions)
    expect(topTokens).toHaveLength(2)
    expect(topTokens[0]?.symbol).toBe('A')
    expect(topTokens[1]?.symbol).toBe('B')
    expect(tokenSortRank[topTokens[0]!.multichainId]).toBe(1)
    expect(tokenSortRank[topTokens[1]!.multichainId]).toBe(2)
  })

  it('should filter by options.filterString and keep tokenSortRank from order after sort (before search)', () => {
    const tokens = [
      createDataApiMultichainToken({ multichainId: 'mc:usdc', name: 'USD Coin', symbol: 'USDC' }),
      createDataApiMultichainToken({ multichainId: 'mc:weth', name: 'Wrapped Ether', symbol: 'WETH' }),
    ]
    const { topTokens, tokenSortRank } = processMultichainTokensForDisplay(tokens, {
      ...defaultOptions,
      filterString: 'usdc',
    })
    expect(topTokens).toHaveLength(1)
    expect(topTokens[0]?.symbol).toBe('USDC')
    expect(tokenSortRank[tokens[0]!.multichainId]).toBe(1)
    expect(tokenSortRank[tokens[1]!.multichainId]).toBe(2)
  })

  it('should sort by price descending when sortMethod is PRICE and sortAscending is false', () => {
    const tokens = [
      createDataApiMultichainToken({ symbol: 'Low', price: 0.5 }),
      createDataApiMultichainToken({ symbol: 'High', price: 10 }),
      createDataApiMultichainToken({ symbol: 'Mid', price: 2 }),
    ]
    const { topTokens } = processMultichainTokensForDisplay(tokens, {
      ...defaultOptions,
      sortMethod: TokenSortMethod.PRICE,
      sortAscending: false,
    })
    expect(topTokens).toHaveLength(3)
    expect(topTokens[0]?.symbol).toBe('High')
    expect(topTokens[1]?.symbol).toBe('Mid')
    expect(topTokens[2]?.symbol).toBe('Low')
  })

  it('should sort by price ascending when sortMethod is PRICE and sortAscending is true', () => {
    const tokens = [
      createDataApiMultichainToken({ symbol: 'High', price: 10 }),
      createDataApiMultichainToken({ symbol: 'Low', price: 0.5 }),
      createDataApiMultichainToken({ symbol: 'Mid', price: 2 }),
    ]
    const { topTokens } = processMultichainTokensForDisplay(tokens, {
      ...defaultOptions,
      sortMethod: TokenSortMethod.PRICE,
      sortAscending: true,
    })
    expect(topTokens).toHaveLength(3)
    expect(topTokens[0]?.symbol).toBe('Low')
    expect(topTokens[1]?.symbol).toBe('Mid')
    expect(topTokens[2]?.symbol).toBe('High')
  })

  it('should not sort when sortMethod is not PRICE', () => {
    const tokens = [
      createDataApiMultichainToken({ symbol: 'A', price: 1 }),
      createDataApiMultichainToken({ symbol: 'B', price: 2 }),
    ]
    const { topTokens } = processMultichainTokensForDisplay(tokens, {
      ...defaultOptions,
      sortMethod: TokenSortMethod.VOLUME,
    })
    expect(topTokens).toHaveLength(2)
    expect(topTokens[0]?.symbol).toBe('A')
    expect(topTokens[1]?.symbol).toBe('B')
  })

  it('should filter then sort when both filterString and PRICE sort are set', () => {
    const tokens = [
      createDataApiMultichainToken({ name: 'Token Alpha', symbol: 'ALPHA', price: 5 }),
      createDataApiMultichainToken({ name: 'Token Beta', symbol: 'BETA', price: 1 }),
      createDataApiMultichainToken({ name: 'Token Alpha Two', symbol: 'ALPHA2', price: 3 }),
    ]
    const { topTokens } = processMultichainTokensForDisplay(tokens, {
      ...defaultOptions,
      filterString: 'alpha',
      sortMethod: TokenSortMethod.PRICE,
      sortAscending: true,
    })
    expect(topTokens).toHaveLength(2)
    expect(topTokens[0]?.symbol).toBe('ALPHA2')
    expect(topTokens[1]?.symbol).toBe('ALPHA')
  })

  it('should treat missing stats.price as 0 for sort', () => {
    const withPrice = createDataApiMultichainToken({ symbol: 'With', price: 1 })
    const noStats = createDataApiMultichainToken({
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
    expect(topTokens[0]?.symbol).toBe('None')
    expect(topTokens[1]?.symbol).toBe('With')
  })

  it('should keep global ranks from post-sort order when filterString narrows rows', () => {
    const a = createDataApiMultichainToken({ multichainId: 'mc:a', name: 'Alpha', symbol: 'A' })
    const b = createDataApiMultichainToken({ multichainId: 'mc:b', name: 'Beta', symbol: 'B' })
    const { topTokens, tokenSortRank } = processMultichainTokensForDisplay([a, b], {
      ...defaultOptions,
      filterString: 'alpha',
    })
    expect(topTokens).toHaveLength(1)
    expect(topTokens[0]?.symbol).toBe('A')
    expect(tokenSortRank['mc:a']).toBe(1)
    expect(tokenSortRank['mc:b']).toBe(2)
  })

  it('should rank by PRICE-sorted order then filter does not change ranks for remaining rows', () => {
    const low = createDataApiMultichainToken({ multichainId: 'mc:low', symbol: 'Low', price: 1 })
    const high = createDataApiMultichainToken({ multichainId: 'mc:high', symbol: 'High', price: 10 })
    const { topTokens, tokenSortRank } = processMultichainTokensForDisplay([low, high], {
      ...defaultOptions,
      sortMethod: TokenSortMethod.PRICE,
      sortAscending: false,
    })
    expect(topTokens[0]?.symbol).toBe('High')
    expect(tokenSortRank['mc:high']).toBe(1)
    expect(tokenSortRank['mc:low']).toBe(2)
  })
})
