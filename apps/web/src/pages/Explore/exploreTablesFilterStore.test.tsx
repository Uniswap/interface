import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { describe, expect, it } from 'vitest'
import { TimePeriod } from '~/appGraphql/data/util'
import {
  AuctionStatusFilter,
  AuctionVerificationFilter,
  createExploreTablesFilterStore,
} from '~/pages/Explore/exploreTablesFilterStore'

describe('exploreTablesFilterStore', () => {
  it('starts with empty filterString, DAY timePeriod, All verification/status, and UNSPECIFIED protocol', () => {
    const store = createExploreTablesFilterStore()
    const state = store.getState()

    expect(state.filterString).toBe('')
    expect(state.timePeriod).toBe(TimePeriod.DAY)
    expect(state.verificationFilter).toBe(AuctionVerificationFilter.All)
    expect(state.statusFilter).toBe(AuctionStatusFilter.All)
    expect(state.selectedProtocol).toBe(ProtocolVersion.UNSPECIFIED)
  })
})
