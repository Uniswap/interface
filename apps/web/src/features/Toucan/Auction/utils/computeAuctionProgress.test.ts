import type { PlainMessage } from '@bufbuild/protobuf'
import type { Checkpoint } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { describe, expect, it } from 'vitest'
import type { AuctionDetails } from '~/features/Toucan/Auction/store/types'
import { AuctionOutcome, AuctionProgressState } from '~/features/Toucan/Auction/store/types'
import { computeAuctionProgress } from '~/features/Toucan/Auction/utils/computeAuctionProgress'

function makeAuctionDetails(overrides: Partial<AuctionDetails> = {}): AuctionDetails {
  return {
    startBlock: '100',
    endBlock: '200',
    requiredCurrencyRaised: '1000',
    ...overrides,
  } as AuctionDetails
}

function makeCheckpoint(currencyRaised: string): PlainMessage<Checkpoint> {
  return { currencyRaised } as PlainMessage<Checkpoint>
}

describe('computeAuctionProgress', () => {
  it('returns UNKNOWN state and UNKNOWN outcome without block data', () => {
    const progress = computeAuctionProgress({
      currentBlock: undefined,
      auctionDetails: makeAuctionDetails(),
      checkpointData: null,
    })
    expect(progress.state).toBe(AuctionProgressState.UNKNOWN)
    expect(progress.outcome).toBe(AuctionOutcome.UNKNOWN)
  })

  it('returns UNKNOWN outcome without auction details', () => {
    const progress = computeAuctionProgress({ currentBlock: 150, auctionDetails: null, checkpointData: null })
    expect(progress.state).toBe(AuctionProgressState.UNKNOWN)
    expect(progress.outcome).toBe(AuctionOutcome.UNKNOWN)
  })

  it('is ACTIVE before the start block', () => {
    const progress = computeAuctionProgress({
      currentBlock: 50,
      auctionDetails: makeAuctionDetails(),
      checkpointData: null,
    })
    expect(progress.state).toBe(AuctionProgressState.NOT_STARTED)
    expect(progress.outcome).toBe(AuctionOutcome.ACTIVE)
  })

  it('is ACTIVE while in progress, even if graduation already latched', () => {
    const progress = computeAuctionProgress({
      currentBlock: 150,
      auctionDetails: makeAuctionDetails(),
      checkpointData: makeCheckpoint('1000'),
    })
    expect(progress.state).toBe(AuctionProgressState.IN_PROGRESS)
    expect(progress.isGraduated).toBe(true)
    expect(progress.outcome).toBe(AuctionOutcome.ACTIVE)
  })

  it('is GRADUATED once ended with currencyRaised >= requiredCurrencyRaised', () => {
    const progress = computeAuctionProgress({
      currentBlock: 201,
      auctionDetails: makeAuctionDetails(),
      checkpointData: makeCheckpoint('1500'),
    })
    expect(progress.state).toBe(AuctionProgressState.ENDED)
    expect(progress.isGraduated).toBe(true)
    expect(progress.outcome).toBe(AuctionOutcome.GRADUATED)
  })

  it('is FAILED once ended without meeting the graduation threshold', () => {
    const progress = computeAuctionProgress({
      currentBlock: 201,
      auctionDetails: makeAuctionDetails(),
      checkpointData: makeCheckpoint('999'),
    })
    expect(progress.state).toBe(AuctionProgressState.ENDED)
    expect(progress.isGraduated).toBe(false)
    expect(progress.outcome).toBe(AuctionOutcome.FAILED)
  })

  it('is FAILED once ended with no checkpoint data at all', () => {
    const progress = computeAuctionProgress({
      currentBlock: 201,
      auctionDetails: makeAuctionDetails(),
      checkpointData: null,
    })
    expect(progress.outcome).toBe(AuctionOutcome.FAILED)
  })
})
