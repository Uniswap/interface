import type { PlainMessage } from '@bufbuild/protobuf'
import type { Checkpoint } from '@uniswap/client-launches/dist/data/v1/auction_pb'
import { UniverseChainId } from '@universe/chains'
import { createElement } from 'react'
import { logger } from 'utilities/src/logger/logger'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuctionCheckpointDiagnostics } from '~/features/Toucan/Auction/hooks/useAuctionCheckpointDiagnostics'
import { AuctionStoreContext } from '~/features/Toucan/Auction/store/AuctionStoreContext'
import { createAuctionStore } from '~/features/Toucan/Auction/store/createAuctionStore'
import { AuctionDetails, AuctionDetailsLoadState } from '~/features/Toucan/Auction/store/types'
import { resetAuctionCheckpointLogGuards } from '~/features/Toucan/Auction/utils/auctionCheckpointLogGuards'
import { render } from '~/test-utils/render'

const AUCTION_ADDRESS = '0x9D908e12c463e6ae0f074bF3Af56DedeD0cA1949'
const START_BLOCK = '100'
const END_BLOCK = '200'
const ENDED_BLOCK = 201
const REQUIRED_CURRENCY_RAISED = '1000'
/** Above the threshold — the ordinary graduated auction, and the case the log must stay quiet on. */
const RAISED_ABOVE_TARGET = '1500'

vi.mock('utilities/src/logger/logger', () => ({
  logger: { error: vi.fn(), debug: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

function makeAuctionDetails(overrides: Partial<AuctionDetails> = {}): AuctionDetails {
  return {
    address: AUCTION_ADDRESS,
    chainId: UniverseChainId.Mainnet,
    startBlock: START_BLOCK,
    endBlock: END_BLOCK,
    requiredCurrencyRaised: REQUIRED_CURRENCY_RAISED,
    ...overrides,
  } as AuctionDetails
}

function checkpoint(currencyRaised: string): PlainMessage<Checkpoint> {
  return { currencyRaised } as PlainMessage<Checkpoint>
}

/**
 * Mounts the diagnostics hook over a REAL auction store, deliberately not a mocked one.
 *
 * The defect this suite exists for is a skew: the caller passes the checkpoint it is about to
 * publish, while the store still holds the previous one. Hand-set mock state is frozen and always
 * self-consistent, so it cannot reproduce that skew — which is exactly why an earlier revision
 * shipped with the undecidable log firing on every healthy load. Leaving `publishedCheckpoint`
 * ahead of the store's `checkpointData` here reproduces it faithfully.
 *
 * @param ended - Whether the auction has ended (drives the progress state the hook reads).
 * @param detailsSettled - Whether the independent GetAuction path has settled.
 * @param publishedCheckpoint - The checkpoint the caller is publishing this render.
 */
function load({
  chainId = UniverseChainId.Mainnet,
  address = AUCTION_ADDRESS,
  ended = true,
  detailsSettled = true,
  auctionDetails = makeAuctionDetails(),
  publishedCheckpoint = null,
  isError = false,
  isSuccess = false,
  error = null,
}: {
  chainId?: UniverseChainId
  address?: string
  ended?: boolean
  detailsSettled?: boolean
  auctionDetails?: AuctionDetails | null
  publishedCheckpoint?: PlainMessage<Checkpoint> | null
  isError?: boolean
  isSuccess?: boolean
  error?: Error | null
} = {}) {
  const store = createAuctionStore(AUCTION_ADDRESS, UniverseChainId.Mainnet)
  const { actions } = store.getState()
  if (auctionDetails) {
    actions.setAuctionDetails(auctionDetails)
  }
  actions.setAuctionDetailsLoadState(detailsSettled ? AuctionDetailsLoadState.Success : AuctionDetailsLoadState.Loading)
  actions.setCurrentBlockNumberAndUpdateProgress(ended ? ENDED_BLOCK : Number(START_BLOCK) + 1)

  function Probe(): null {
    useAuctionCheckpointDiagnostics({
      chainId: chainId as never,
      auctionAddress: address,
      isError,
      error,
      isSuccess,
      publishedCheckpoint,
    })
    return null
  }

  render(createElement(AuctionStoreContext.Provider, { value: store }, createElement(Probe)))

  return { store }
}

describe('useAuctionCheckpointDiagnostics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetAuctionCheckpointLogGuards()
  })

  describe('failed-fetch logging', () => {
    it('logs a failed checkpoint request so the stalled outcome is not silent', () => {
      load({ isError: true, error: new Error('NotFound: No CCA auction found for contract') })

      expect(logger.error).toHaveBeenCalledTimes(1)
      expect(logger.error).toHaveBeenCalledWith(expect.any(Error), {
        tags: { file: 'useAuctionCheckpointDiagnostics.ts', function: 'useAuctionCheckpointDiagnostics' },
        extra: {
          chainId: UniverseChainId.Mainnet,
          auctionAddress: AUCTION_ADDRESS,
          error: 'NotFound: No CCA auction found for contract',
        },
      })
      // Stable message — Datadog error tracking counts occurrences of this exact string.
      const loggedError = vi.mocked(logger.error).mock.calls[0]?.[0] as Error
      expect(loggedError.message).toBe('Failed to load auction checkpoint')
    })

    it('carries the underlying query error on `cause` so its stack survives the rewrap', () => {
      const queryError = new Error('NotFound: No CCA auction found for contract')
      load({ isError: true, error: queryError })

      const loggedError = vi.mocked(logger.error).mock.calls[0]?.[0] as Error
      expect(loggedError.cause).toBe(queryError)
    })

    it('logs at most once per auction, since the hook re-renders on every poll', () => {
      load({ isError: true, error: new Error('boom') })
      load({ isError: true, error: new Error('boom') })
      load({ isError: true, error: new Error('boom') })

      expect(logger.error).toHaveBeenCalledTimes(1)
    })

    it('does not log while loading or on success', () => {
      load()
      expect(logger.error).not.toHaveBeenCalled()

      load({ isSuccess: true })
      expect(logger.error).not.toHaveBeenCalled()
    })

    it('stays quiet on a transient error while the auction is still live', () => {
      // Polling is live while IN_PROGRESS, so this is retried — expected noise, not a stall.
      load({ ended: false, isError: true, error: new Error('503') })

      expect(logger.error).not.toHaveBeenCalled()
    })

    it('stays quiet when the failed poll still left a usable checkpoint in hand', () => {
      // react-query retains the last successful `data`, so an ended auction whose final refetch
      // errored can hold a good checkpoint and a decided outcome. Nothing is stalled, so reporting
      // it would be a false diagnostic — and it would burn the key that a real stall needs.
      load({ isError: true, error: new Error('503'), publishedCheckpoint: checkpoint(RAISED_ABOVE_TARGET) })

      expect(logger.error).not.toHaveBeenCalled()
    })

    it('still reports a terminal failure after a transient one already occurred mid-auction', () => {
      // The regression guard for the dedupe key. `shouldLogCheckpointErrorOnce` consumes the key by
      // being called, so a mid-auction blip evaluated before the ENDED gate would burn it and leave
      // the genuinely terminal failure — the one that strands the page on a skeleton — unreported.
      load({ ended: false, isError: true, error: new Error('503') })
      expect(logger.error).not.toHaveBeenCalled()

      // Same auction key, now ended and still unresolved: the signal must survive.
      load({ ended: true, isError: true, error: new Error('not_found') })

      expect(logger.error).toHaveBeenCalledTimes(1)
      const loggedError = vi.mocked(logger.error).mock.calls[0]?.[0] as Error
      expect(loggedError.message).toBe('Failed to load auction checkpoint')
    })
  })

  describe('settled-but-undecidable logging', () => {
    it('stays quiet on the ordinary successful load of an ended auction', () => {
      // The regression guard. The caller publishes the checkpoint in a later effect than the one
      // that evaluates this condition, so the store's `hasMetThreshold` is still the previous,
      // undefined value at that point in the commit — reproduced here by leaving the store's
      // checkpointData unset while passing publishedCheckpoint. Deriving undecidability from the
      // store would fire this error-level diagnostic on every healthy page view of an ended auction,
      // and the once-per-auction dedupe would then swallow the genuine stall it exists to report.
      load({ isSuccess: true, publishedCheckpoint: checkpoint(RAISED_ABOVE_TARGET) })

      expect(logger.error).not.toHaveBeenCalled()
    })

    it('stays quiet on an ended auction that decidably fell short', () => {
      load({ isSuccess: true, publishedCheckpoint: checkpoint('999') })

      expect(logger.error).not.toHaveBeenCalled()
    })

    it('logs an ended auction whose settled checkpoint leaves graduation undecidable', () => {
      load({ isSuccess: true, publishedCheckpoint: checkpoint('not-a-number') })

      expect(logger.error).toHaveBeenCalledTimes(1)
      expect(logger.error).toHaveBeenCalledWith(expect.any(Error), {
        tags: { file: 'useAuctionCheckpointDiagnostics.ts', function: 'useAuctionCheckpointDiagnostics' },
        extra: {
          chainId: UniverseChainId.Mainnet,
          auctionAddress: AUCTION_ADDRESS,
          currencyRaised: 'not-a-number',
          requiredCurrencyRaised: REQUIRED_CURRENCY_RAISED,
        },
      })
      // Stable message — Datadog error tracking counts occurrences of this exact string, and it has
      // to stay distinguishable from the fetch-failure signal above.
      const loggedError = vi.mocked(logger.error).mock.calls[0]?.[0] as Error
      expect(loggedError.message).toBe('Auction checkpoint settled but graduation is undecidable')
    })

    it('logs when the auction-side threshold is the unreadable half', () => {
      // requiredCurrencyRaised is proto3 `string` field 22, so an unpopulated field arrives as ''.
      load({
        isSuccess: true,
        publishedCheckpoint: checkpoint(RAISED_ABOVE_TARGET),
        auctionDetails: makeAuctionDetails({ requiredCurrencyRaised: '' }),
      })

      expect(logger.error).toHaveBeenCalledTimes(1)
    })

    it('logs at most once per auction, since the hook re-renders on every store update', () => {
      load({ isSuccess: true, publishedCheckpoint: checkpoint('not-a-number') })
      load({ isSuccess: true, publishedCheckpoint: checkpoint('not-a-number') })

      expect(logger.error).toHaveBeenCalledTimes(1)
    })

    it('stays quiet while the auction is still running', () => {
      load({ ended: false, isSuccess: true, publishedCheckpoint: checkpoint('not-a-number') })

      expect(logger.error).not.toHaveBeenCalled()
    })

    it('stays quiet while auction details are still in flight', () => {
      // requiredCurrencyRaised comes from GetAuction, which settles independently of the checkpoint.
      // Logging before it lands would report a stall that resolves itself a poll later.
      //
      // Isolates `isAuctionDetailsSettled`, so this fails if that clause is dropped. Every other
      // condition is deliberately satisfied: details ARE present (so start/end blocks resolve and
      // the auction reads ENDED), the checkpoint IS settled and non-null, and the pair IS
      // undecidable because the stale `requiredCurrencyRaised` is ''. The in-flight details load is
      // the only thing keeping it quiet. Passing `auctionDetails: null` instead — as an earlier
      // revision did — leaves the progress state UNKNOWN, so the ENDED gate silences it and the
      // test passes without ever exercising the condition it is named for.
      //
      // Realistic shape: details loaded once with an unpopulated threshold (proto3 default '') and
      // a refetch is in flight, so the real value may be about to arrive.
      load({
        detailsSettled: false,
        auctionDetails: makeAuctionDetails({ requiredCurrencyRaised: '' }),
        isSuccess: true,
        publishedCheckpoint: checkpoint(RAISED_ABOVE_TARGET),
      })

      expect(logger.error).not.toHaveBeenCalled()
    })

    it('logs the same case once those details settle — the positive control for the gate above', () => {
      // Identical to the previous test except the details have settled. The pair proves the gate is
      // the only difference, rather than the quiet case being quiet for some unrelated reason.
      load({
        detailsSettled: true,
        auctionDetails: makeAuctionDetails({ requiredCurrencyRaised: '' }),
        isSuccess: true,
        publishedCheckpoint: checkpoint(RAISED_ABOVE_TARGET),
      })

      expect(logger.error).toHaveBeenCalledTimes(1)
    })

    it('stays quiet when GetAuction serves the graduation verdict', () => {
      load({
        isSuccess: true,
        publishedCheckpoint: checkpoint('not-a-number'),
        auctionDetails: makeAuctionDetails({ isGraduated: true }),
      })

      expect(logger.error).not.toHaveBeenCalled()
    })

    it('stays quiet when the checkpoint settled empty, which is decidable on its own', () => {
      // Settled-and-empty resolves to FAILED rather than stalling, so it is not a silent wait.
      load({ isSuccess: true, publishedCheckpoint: null })

      expect(logger.error).not.toHaveBeenCalled()
    })
  })
})
