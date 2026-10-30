import type { PlainMessage } from '@bufbuild/protobuf'
import type { Checkpoint } from '@uniswap/client-launches/dist/data/v1/auction_pb'
import { describe, expect, it } from 'vitest'
import type { AuctionDetails } from '~/features/Toucan/Auction/store/types'
import { AuctionCheckpointLoadState, AuctionOutcome, AuctionProgressState } from '~/features/Toucan/Auction/store/types'
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

/** A checkpoint request that resolved — the ordinary case for any auction the API can resolve. */
const SETTLED = AuctionCheckpointLoadState.Success

describe('computeAuctionProgress', () => {
  it('returns UNKNOWN state and UNKNOWN outcome without block data', () => {
    const progress = computeAuctionProgress({
      currentBlock: undefined,
      auctionDetails: makeAuctionDetails(),
      checkpointData: null,
      checkpointLoadState: AuctionCheckpointLoadState.Loading,
    })
    expect(progress.state).toBe(AuctionProgressState.UNKNOWN)
    expect(progress.outcome).toBe(AuctionOutcome.UNKNOWN)
  })

  it('returns UNKNOWN outcome without auction details', () => {
    const progress = computeAuctionProgress({
      currentBlock: 150,
      auctionDetails: null,
      checkpointData: null,
      checkpointLoadState: AuctionCheckpointLoadState.Loading,
    })
    expect(progress.state).toBe(AuctionProgressState.UNKNOWN)
    expect(progress.outcome).toBe(AuctionOutcome.UNKNOWN)
  })

  it('is ACTIVE before the start block', () => {
    const progress = computeAuctionProgress({
      currentBlock: 50,
      auctionDetails: makeAuctionDetails(),
      checkpointData: null,
      // Measured against the prod gateway: a not-yet-started auction answers 200 with neither
      // `checkpoint` nor `simulatedCheckpoint`, so settled-and-empty really does occur here. It
      // must still read ACTIVE — the settled-empty shortcut applies only once the auction ended.
      checkpointLoadState: SETTLED,
    })
    expect(progress.state).toBe(AuctionProgressState.NOT_STARTED)
    expect(progress.outcome).toBe(AuctionOutcome.ACTIVE)
  })

  it('is ACTIVE while in progress, even if graduation already latched', () => {
    const progress = computeAuctionProgress({
      currentBlock: 150,
      auctionDetails: makeAuctionDetails(),
      checkpointData: makeCheckpoint('1000'),
      checkpointLoadState: SETTLED,
    })
    expect(progress.state).toBe(AuctionProgressState.IN_PROGRESS)
    expect(progress.isGraduated).toBe(true)
    expect(progress.hasMetThreshold).toBe(true)
    expect(progress.outcome).toBe(AuctionOutcome.ACTIVE)
  })

  it('is GRADUATED once ended with currencyRaised >= requiredCurrencyRaised', () => {
    const progress = computeAuctionProgress({
      currentBlock: 201,
      auctionDetails: makeAuctionDetails(),
      checkpointData: makeCheckpoint('1500'),
      checkpointLoadState: SETTLED,
    })
    expect(progress.state).toBe(AuctionProgressState.ENDED)
    expect(progress.isGraduated).toBe(true)
    expect(progress.hasMetThreshold).toBe(true)
    expect(progress.outcome).toBe(AuctionOutcome.GRADUATED)
  })

  it('is FAILED once ended without meeting the graduation threshold', () => {
    const progress = computeAuctionProgress({
      currentBlock: 201,
      auctionDetails: makeAuctionDetails(),
      checkpointData: makeCheckpoint('999'),
      checkpointLoadState: SETTLED,
    })
    expect(progress.state).toBe(AuctionProgressState.ENDED)
    expect(progress.isGraduated).toBe(false)
    expect(progress.hasMetThreshold).toBe(false)
    expect(progress.outcome).toBe(AuctionOutcome.FAILED)
  })

  // The distinction the outcome rests on once an auction has ended and no checkpoint is present:
  // a *settled* empty response is authoritative, an unfinished or failed one is not.
  describe('ended with no checkpoint — settled vs in flight', () => {
    it('is UNKNOWN while the checkpoint request is still in flight', () => {
      const progress = computeAuctionProgress({
        currentBlock: 201,
        auctionDetails: makeAuctionDetails(),
        checkpointData: null,
        checkpointLoadState: AuctionCheckpointLoadState.Loading,
      })
      expect(progress.state).toBe(AuctionProgressState.ENDED)
      expect(progress.hasMetThreshold).toBeUndefined()
      expect(progress.outcome).toBe(AuctionOutcome.UNKNOWN)
    })

    it('is UNKNOWN before the checkpoint request has started', () => {
      const progress = computeAuctionProgress({
        currentBlock: 201,
        auctionDetails: makeAuctionDetails(),
        checkpointData: null,
        checkpointLoadState: AuctionCheckpointLoadState.Idle,
      })
      expect(progress.outcome).toBe(AuctionOutcome.UNKNOWN)
    })

    it('is UNKNOWN — never FAILED — when the checkpoint request errored', () => {
      const progress = computeAuctionProgress({
        currentBlock: 201,
        auctionDetails: makeAuctionDetails(),
        checkpointData: null,
        checkpointLoadState: AuctionCheckpointLoadState.Error,
      })
      expect(progress.state).toBe(AuctionProgressState.ENDED)
      expect(progress.isGraduated).toBe(false)
      expect(progress.hasMetThreshold).toBeUndefined()
      // This is the graduated-auction-shows-"failed to launch" bug. GetLatestCheckpoint answers
      // 404 for an address it cannot resolve to an auction — measured on chain 4663, a token
      // address returns `not_found`. A failed fetch says nothing about what the auction raised,
      // so it must never be read as a shortfall. useAuctionCheckpointDiagnostics logs it instead.
      expect(progress.outcome).toBe(AuctionOutcome.UNKNOWN)
    })

    it('is FAILED when the checkpoint settled carrying nothing', () => {
      const progress = computeAuctionProgress({
        currentBlock: 201,
        auctionDetails: makeAuctionDetails(),
        checkpointData: null,
        checkpointLoadState: SETTLED,
      })
      expect(progress.state).toBe(AuctionProgressState.ENDED)
      expect(progress.isGraduated).toBe(false)
      // The response arrived and held no checkpoint: authoritative that nothing was ever raised,
      // so an ended auction genuinely failed. Releasing on the first *resolved* empty is what
      // stops this waiting on a value that will never come — checkpoint polling halts once the
      // auction is no longer IN_PROGRESS, so nothing would retry.
      expect(progress.outcome).toBe(AuctionOutcome.FAILED)
    })
  })

  // proto3 omits empty strings, so '' is how an unpopulated field arrives on the wire.
  it('is UNKNOWN once ended when currencyRaised is an empty string', () => {
    const progress = computeAuctionProgress({
      currentBlock: 201,
      auctionDetails: makeAuctionDetails(),
      checkpointData: makeCheckpoint(''),
      checkpointLoadState: SETTLED,
    })
    expect(progress.outcome).toBe(AuctionOutcome.UNKNOWN)
  })

  it('is UNKNOWN once ended when requiredCurrencyRaised is absent', () => {
    const progress = computeAuctionProgress({
      currentBlock: 201,
      auctionDetails: makeAuctionDetails({ requiredCurrencyRaised: '' }),
      checkpointData: makeCheckpoint('1500'),
      checkpointLoadState: SETTLED,
    })
    expect(progress.outcome).toBe(AuctionOutcome.UNKNOWN)
  })

  it('is UNKNOWN once ended when currencyRaised is malformed', () => {
    const progress = computeAuctionProgress({
      currentBlock: 201,
      auctionDetails: makeAuctionDetails(),
      checkpointData: makeCheckpoint('not-a-number'),
      checkpointLoadState: SETTLED,
    })
    expect(progress.outcome).toBe(AuctionOutcome.UNKNOWN)
  })

  // A loaded zero stays decidable: '0' is a real value, unlike ''. This is the zero-bid failed
  // launch, and measured against the prod gateway such an auction answers 200 with a checkpoint
  // carrying currencyRaised '0' — so it reaches FAILED by the ordinary decidable path, not by the
  // settled-empty shortcut.
  it('is FAILED once ended having raised a genuine zero against a real threshold', () => {
    const progress = computeAuctionProgress({
      currentBlock: 201,
      auctionDetails: makeAuctionDetails(),
      checkpointData: makeCheckpoint('0'),
      checkpointLoadState: SETTLED,
    })
    expect(progress.isGraduated).toBe(false)
    expect(progress.hasMetThreshold).toBe(false)
    expect(progress.outcome).toBe(AuctionOutcome.FAILED)
  })

  // Mirrors isAuctionFailed, which refuses to fail an auction whose threshold is zero.
  it('is GRADUATED once ended with a zero threshold', () => {
    const progress = computeAuctionProgress({
      currentBlock: 201,
      auctionDetails: makeAuctionDetails({ requiredCurrencyRaised: '0' }),
      checkpointData: makeCheckpoint('0'),
      checkpointLoadState: SETTLED,
    })
    expect(progress.outcome).toBe(AuctionOutcome.GRADUATED)
  })

  it('is GRADUATED for the real 20.7x-oversubscribed launch that rendered as failed', () => {
    const progress = computeAuctionProgress({
      currentBlock: 29_642_600,
      auctionDetails: makeAuctionDetails({
        startBlock: '29498515',
        endBlock: '29642515',
        requiredCurrencyRaised: '2617870778999999999',
      }),
      checkpointData: makeCheckpoint('51136794821184367788'),
      checkpointLoadState: SETTLED,
    })
    expect(progress.isGraduated).toBe(true)
    expect(progress.outcome).toBe(AuctionOutcome.GRADUATED)
  })

  describe('served graduation verdict', () => {
    it.each([
      [true, '999', AuctionOutcome.GRADUATED],
      [false, '1000', AuctionOutcome.FAILED],
    ])('isGraduated=%s overrides an ended checkpoint that raised %s', (isGraduated, currencyRaised, outcome) => {
      const progress = computeAuctionProgress({
        currentBlock: 201,
        auctionDetails: makeAuctionDetails({ isGraduated }),
        checkpointData: makeCheckpoint(currencyRaised),
        checkpointLoadState: SETTLED,
      })
      expect(progress).toMatchObject({ hasMetThreshold: isGraduated, isGraduated, outcome })
    })

    it.each([AuctionCheckpointLoadState.Idle, AuctionCheckpointLoadState.Loading, AuctionCheckpointLoadState.Error])(
      'decides an ended auction while its checkpoint is %s, with the final price still pending',
      (checkpointLoadState) => {
        const progress = computeAuctionProgress({
          currentBlock: 201,
          auctionDetails: makeAuctionDetails({ isGraduated: true }),
          checkpointData: null,
          checkpointLoadState,
        })
        expect(progress).toMatchObject({ outcome: AuctionOutcome.GRADUATED, isFinalPricePending: true })
      },
    )

    it.each([
      ['loaded', makeCheckpoint('999')],
      ['settled empty', null],
    ])('clears the pending final price once the checkpoint has %s', (_, checkpointData) => {
      const progress = computeAuctionProgress({
        currentBlock: 201,
        auctionDetails: makeAuctionDetails({ isGraduated: true }),
        checkpointData,
        checkpointLoadState: SETTLED,
      })
      expect(progress.isFinalPricePending).toBe(false)
    })

    it('is ignored while the auction is in progress', () => {
      const progress = computeAuctionProgress({
        currentBlock: 150,
        auctionDetails: makeAuctionDetails({ isGraduated: true }),
        checkpointData: makeCheckpoint('999'),
        checkpointLoadState: SETTLED,
      })
      expect(progress).toMatchObject({ hasMetThreshold: false, outcome: AuctionOutcome.ACTIVE })
    })
  })
})
