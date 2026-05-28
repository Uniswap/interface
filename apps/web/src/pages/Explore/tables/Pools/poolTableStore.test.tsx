import { describe, expect, it } from 'vitest'
import { PoolSortFields } from '~/appGraphql/data/pools/useTopPools'
import { createPoolTableStore } from '~/pages/Explore/tables/Pools/poolTableStore'

describe('poolTableStore', () => {
  it('starts with TVL and sortAscending false', () => {
    const store = createPoolTableStore()
    const state = store.getState()

    expect(state.sortMethod).toBe(PoolSortFields.TVL)
    expect(state.sortAscending).toBe(false)
  })

  it('setSort with a new category sets sortMethod and resets sortAscending to false', () => {
    const store = createPoolTableStore()

    store.getState().actions.setSort(PoolSortFields.Apr)

    expect(store.getState().sortMethod).toBe(PoolSortFields.Apr)
    expect(store.getState().sortAscending).toBe(false)
  })

  it('setSort with the same category toggles sortAscending', () => {
    const store = createPoolTableStore()

    store.getState().actions.setSort(PoolSortFields.TVL)
    expect(store.getState().sortAscending).toBe(true)

    store.getState().actions.setSort(PoolSortFields.TVL)
    expect(store.getState().sortAscending).toBe(false)
  })

  it('resetSort restores initial sortMethod and sortAscending', () => {
    const store = createPoolTableStore()

    store.getState().actions.setSort(PoolSortFields.Apr)
    store.getState().actions.setSort(PoolSortFields.Apr)
    expect(store.getState().sortMethod).toBe(PoolSortFields.Apr)
    expect(store.getState().sortAscending).toBe(true)

    store.getState().actions.resetSort()

    expect(store.getState().sortMethod).toBe(PoolSortFields.TVL)
    expect(store.getState().sortAscending).toBe(false)
  })
})
