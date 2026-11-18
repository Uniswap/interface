import { describe, expect, it } from 'vitest'
import { TimePeriod } from '~/data/util'
import { createExploreTablesFilterStore } from '~/features/Explore/state/exploreTablesFilterStore'
import { AuctionQuickFilter, AuctionStatus } from '~/types/auctionFilters'

describe('exploreTablesFilterStore', () => {
  it('starts with empty filterString, DAY timePeriod, and All auction filters', () => {
    const store = createExploreTablesFilterStore()
    const state = store.getState()

    expect(state.filterString).toBe('')
    expect(state.timePeriod).toBe(TimePeriod.DAY)
    expect(state.quickFilter).toBe(AuctionQuickFilter.All)
    expect(state.statusFilter).toBe(AuctionStatus.All)
  })

  it('seeds each auction filter independently', () => {
    const store = createExploreTablesFilterStore({ statusFilter: AuctionStatus.Upcoming })

    expect(store.getState().quickFilter).toBe(AuctionQuickFilter.All)
    expect(store.getState().statusFilter).toBe(AuctionStatus.Upcoming)

    store.getState().actions.setQuickFilter(AuctionQuickFilter.Verified)
    expect(store.getState().statusFilter).toBe(AuctionStatus.Upcoming)
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
    expect(store.getState().flexSlotCategoryIds).toEqual({})

    store.getState().actions.setFlexSlotCategoryId({ kind: 'token', categoryId: 'defi' })
    store.getState().actions.setFlexSlotCategoryId({ kind: 'pool', categoryId: 'defi-pools' })
    expect(store.getState().flexSlotCategoryIds).toEqual({ token: 'defi', pool: 'defi-pools' })
  })
})
