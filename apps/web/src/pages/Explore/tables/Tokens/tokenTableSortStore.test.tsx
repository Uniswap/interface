import { TokensOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { describe, expect, it } from 'vitest'
import { TokenSortMethod } from '~/components/Tokens/constants'
import { createTokenTableSortStore, getTokenTableSort } from '~/pages/Explore/tables/Tokens/tokenTableSortStore'

describe('tokenTableSortStore', () => {
  it('starts with VOLUME and sortAscending false', () => {
    const store = createTokenTableSortStore()
    const state = store.getState()

    expect(state.sortMethod).toBe(TokenSortMethod.VOLUME)
    expect(state.sortAscending).toBe(false)
  })

  it('setSort with a new category sets sortMethod and resets sortAscending to false', () => {
    const store = createTokenTableSortStore()

    store.getState().actions.setSort(TokenSortMethod.PRICE)

    expect(store.getState().sortMethod).toBe(TokenSortMethod.PRICE)
    expect(store.getState().sortAscending).toBe(false)
  })

  it('setSort with the same category toggles sortAscending', () => {
    const store = createTokenTableSortStore()

    store.getState().actions.setSort(TokenSortMethod.VOLUME)
    expect(store.getState().sortAscending).toBe(true)

    store.getState().actions.setSort(TokenSortMethod.VOLUME)
    expect(store.getState().sortAscending).toBe(false)
  })

  it('setSort with new category then same category toggles sortAscending for that category', () => {
    const store = createTokenTableSortStore()

    store.getState().actions.setSort(TokenSortMethod.PRICE)
    expect(store.getState().sortMethod).toBe(TokenSortMethod.PRICE)
    expect(store.getState().sortAscending).toBe(false)

    store.getState().actions.setSort(TokenSortMethod.PRICE)
    expect(store.getState().sortAscending).toBe(true)
  })

  it('starts from the given initial sort and toggles it on the same column', () => {
    const store = createTokenTableSortStore({ sortMethod: TokenSortMethod.DAY_CHANGE, sortAscending: true })

    expect(store.getState().sortMethod).toBe(TokenSortMethod.DAY_CHANGE)
    expect(store.getState().sortAscending).toBe(true)

    store.getState().actions.setSort(TokenSortMethod.DAY_CHANGE)
    expect(store.getState().sortAscending).toBe(false)
  })
})

describe(getTokenTableSort, () => {
  it('maps a category default sort to the matching column and direction', () => {
    expect(getTokenTableSort({ orderBy: TokensOrderBy.PRICE_CHANGE_1D, ascending: true })).toEqual({
      sortMethod: TokenSortMethod.DAY_CHANGE,
      sortAscending: true,
    })
    expect(getTokenTableSort({ orderBy: TokensOrderBy.PRICE_CHANGE_1D, ascending: false })).toEqual({
      sortMethod: TokenSortMethod.DAY_CHANGE,
      sortAscending: false,
    })
    expect(getTokenTableSort({ orderBy: TokensOrderBy.VOLUME_1D, ascending: false })).toEqual({
      sortMethod: TokenSortMethod.VOLUME,
      sortAscending: false,
    })
  })

  it('falls back to volume descending when unset or unmapped', () => {
    const volumeDescending = { sortMethod: TokenSortMethod.VOLUME, sortAscending: false }

    expect(getTokenTableSort(undefined)).toEqual(volumeDescending)
    expect(getTokenTableSort({ orderBy: TokensOrderBy.TVL, ascending: true })).toEqual(volumeDescending)
  })
})
