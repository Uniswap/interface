import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { describe, expect, it } from 'vitest'
import { TimePeriod } from '~/appGraphql/data/util'
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
})
