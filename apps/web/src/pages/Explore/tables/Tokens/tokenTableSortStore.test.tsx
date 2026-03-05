import { describe, expect, it } from 'vitest'
import { TokenSortMethod } from '~/components/Tokens/constants'
import { createTokenTableSortStore } from '~/pages/Explore/tables/Tokens/tokenTableSortStore'

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
})
