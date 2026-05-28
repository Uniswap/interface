import {
  makeSelectHasTokenFavorited,
  makeSelectHasTokenFavoritedByAddress,
  selectFavoriteTokens,
} from 'uniswap/src/features/favorites/selectors'
import { UniswapRootState } from 'uniswap/src/state'

function createState(tokens: string[]): UniswapRootState {
  return {
    favorites: { tokens, watchedAddresses: [] },
  } as unknown as UniswapRootState
}

describe(selectFavoriteTokens, () => {
  it('returns favorite tokens', () => {
    const state = createState(['1-0xAAA', '1-0xBBB'])
    expect(selectFavoriteTokens(state)).toEqual(['1-0xAAA', '1-0xBBB'])
  })

  it('dedupes exact duplicates', () => {
    const state = createState(['1-0xAAA', '1-0xAAA'])
    expect(selectFavoriteTokens(state)).toEqual(['1-0xAAA'])
  })
})

describe(makeSelectHasTokenFavorited, () => {
  const selectHasTokenFavorited = makeSelectHasTokenFavorited()

  it('returns true for exact match', () => {
    const state = createState(['1-0xAAA'])
    expect(selectHasTokenFavorited(state, '1-0xAAA')).toBe(true)
  })

  it('returns false for same address on different chain', () => {
    const state = createState(['1-0xAAA'])
    expect(selectHasTokenFavorited(state, '42161-0xAAA')).toBe(false)
  })

  it('returns false for different address', () => {
    const state = createState(['1-0xAAA'])
    expect(selectHasTokenFavorited(state, '1-0xBBB')).toBe(false)
  })

  it('returns false for empty favorites', () => {
    const state = createState([])
    expect(selectHasTokenFavorited(state, '1-0xAAA')).toBe(false)
  })
})

describe(makeSelectHasTokenFavoritedByAddress, () => {
  const selectHasTokenFavoritedByAddress = makeSelectHasTokenFavoritedByAddress()

  it('returns true for exact match', () => {
    const state = createState(['1-0xAAA'])
    expect(selectHasTokenFavoritedByAddress(state, '1-0xAAA')).toBe(true)
  })

  it('returns true for same address on different chain', () => {
    const state = createState(['1-0xAAA'])
    expect(selectHasTokenFavoritedByAddress(state, '42161-0xAAA')).toBe(true)
  })

  it('matches case-insensitively', () => {
    const state = createState(['1-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'])
    expect(selectHasTokenFavoritedByAddress(state, '1-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')).toBe(true)
  })

  it('returns false for different address', () => {
    const state = createState(['1-0xAAA'])
    expect(selectHasTokenFavoritedByAddress(state, '1-0xBBB')).toBe(false)
  })

  it('returns false for empty favorites', () => {
    const state = createState([])
    expect(selectHasTokenFavoritedByAddress(state, '1-0xAAA')).toBe(false)
  })
})
