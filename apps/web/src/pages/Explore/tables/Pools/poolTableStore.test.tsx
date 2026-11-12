import { describe, expect, it } from 'vitest'
import { PoolSortFields } from '~/data/pools/poolStats'
import { createPoolTableStore } from '~/pages/Explore/tables/Pools/poolTableStore'

describe('poolTableStore', () => {
  it('starts with 1 day volume and sortAscending false', () => {
    const state = createPoolTableStore().getState()
    expect(state.sortMethod).toBe(PoolSortFields.Volume24h)
    expect(state.sortAscending).toBe(false)
  })

  it('stores the selected field and direction together', () => {
    const store = createPoolTableStore()
    store.getState().actions.setSort(PoolSortFields.Apr, true)
    expect(store.getState().sortMethod).toBe(PoolSortFields.Apr)
    expect(store.getState().sortAscending).toBe(true)
    store.getState().actions.setSort(PoolSortFields.Volume30D, false)
    expect(store.getState().sortMethod).toBe(PoolSortFields.Volume30D)
    expect(store.getState().sortAscending).toBe(false)
  })

  it('resetSort restores initial sortMethod and sortAscending', () => {
    const store = createPoolTableStore()
    store.getState().actions.setSort(PoolSortFields.Apr, true)
    store.getState().actions.resetSort()
    expect(store.getState().sortMethod).toBe(PoolSortFields.Volume24h)
    expect(store.getState().sortAscending).toBe(false)
  })
})
