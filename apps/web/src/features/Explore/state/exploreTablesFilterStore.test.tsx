import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { describe, expect, it } from 'vitest'
import { TimePeriod } from '~/data/util'
import { AuctionQuickFilter, createExploreTablesFilterStore } from '~/features/Explore/state/exploreTablesFilterStore'

describe('exploreTablesFilterStore', () => {
  it('starts with empty filterString, DAY timePeriod, All quick filter, and UNSPECIFIED protocol', () => {
    const store = createExploreTablesFilterStore()
    const state = store.getState()

    expect(state.filterString).toBe('')
    expect(state.timePeriod).toBe(TimePeriod.DAY)
    expect(state.quickFilter).toBe(AuctionQuickFilter.All)
    expect(state.selectedProtocol).toBe(ProtocolVersion.UNSPECIFIED)
  })

  it('seeds the quick filter when an initial value is provided', () => {
    const store = createExploreTablesFilterStore(AuctionQuickFilter.Verified)

    expect(store.getState().quickFilter).toBe(AuctionQuickFilter.Verified)
  })

  it('starts with no pools APR range and holds whatever the pools table publishes', () => {
    const store = createExploreTablesFilterStore()
    expect(store.getState().poolsAprRange).toBeUndefined()

    store.getState().actions.setPoolsAprRange({ min: 0.8, max: 14.4 })
    expect(store.getState().poolsAprRange).toEqual({ min: 0.8, max: 14.4 })

    store.getState().actions.setPoolsAprRange(undefined)
    expect(store.getState().poolsAprRange).toBeUndefined()
  })

  it('starts with no flex slot category and holds the last one set', () => {
    const store = createExploreTablesFilterStore()
    expect(store.getState().flexSlotCategoryId).toBeUndefined()

    store.getState().actions.setFlexSlotCategoryId('defi')
    expect(store.getState().flexSlotCategoryId).toBe('defi')
  })
})
