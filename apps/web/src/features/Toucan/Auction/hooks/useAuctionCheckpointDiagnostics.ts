import type { PlainMessage } from '@bufbuild/protobuf'
import type { Checkpoint } from '@uniswap/client-launches/dist/data/v1/auction_pb'
import { EVMUniverseChainId } from '@universe/chains'
import { useEffect, useMemo } from 'react'
import { logger } from 'utilities/src/logger/logger'
import { AuctionDetailsLoadState, AuctionProgressState } from '~/features/Toucan/Auction/store/types'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import {
  logCheckpointErrorOnce,
  logUndecidableCheckpointOnce,
} from '~/features/Toucan/Auction/utils/auctionCheckpointLogGuards'
import { computeIsGraduated } from '~/features/Toucan/Auction/utils/computeAuctionProgress'

interface AuctionCheckpointDiagnosticsParams {
  chainId: EVMUniverseChainId | undefined
  auctionAddress: string | undefined
  /** The checkpoint request settled as a failure, after its bounded retries. */
  isError: boolean
  error: Error | null
  /** The checkpoint request settled successfully. */
  isSuccess: boolean
  /**
   * The checkpoint the caller is publishing to the store *this render*, null when the response
   * carried none. Passed in rather than read back off the store on purpose — see below.
   */
  publishedCheckpoint: PlainMessage<Checkpoint> | null
}

/**
 * Reports the two ways an ended auction's outcome can stall permanently. Diagnostics only: this
 * hook writes nothing to the store and changes nothing the page renders.
 *
 * Both stalls share a shape. Checkpoint polling stops once the auction leaves IN_PROGRESS, so an
 * ended auction whose graduation cannot be decided waits on data that will never arrive and holds
 * the skeleton indefinitely. That is invisible without a log, and it is the failure this whole
 * feature exists to avoid mistaking for a failed launch.
 *
 * Split out of `useLoadCheckpointData` so that hook is only fetch-and-publish: ~70 lines of
 * logging sat between its load-state memo and its two publish effects, whose relative order is
 * load-bearing (payload before load state). Keeping the coupled effects adjacent there is what
 * makes that invariant hard to break by accident.
 */
export function useAuctionCheckpointDiagnostics({
  chainId,
  auctionAddress,
  isError,
  error,
  isSuccess,
  publishedCheckpoint,
}: AuctionCheckpointDiagnosticsParams): void {
  const { progressState, requiredCurrencyRaised, servedIsGraduated, isAuctionDetailsSettled } = useAuctionStore(
    (state) => ({
      progressState: state.progress.state,
      requiredCurrencyRaised: state.auctionDetails?.requiredCurrencyRaised,
      servedIsGraduated: state.auctionDetails?.isGraduated,
      isAuctionDetailsSettled: state.auctionDetailsLoadState === AuctionDetailsLoadState.Success,
    }),
  )

  const errorMessage = error?.message

  // A failed checkpoint leaves the auction's outcome (or, with a served verdict, its final price)
  // permanently undecided, so the page waits on data that will never arrive. Only worth reporting once that wait is terminal: `refetchInterval`
  // is live only while IN_PROGRESS, so a mid-auction failure is retried on the next poll and is
  // ordinary transient noise. Gating on ENDED does not lose that signal, it defers it — `isError`
  // persists, so an auction that ends still unresolved logs on the transition, which is the moment
  // it actually becomes a stall.
  //
  // A failed *poll* is not a failed *load*: react-query keeps the last successful `data`, so an
  // auction whose final refetch errored can still have a perfectly good checkpoint in hand and a
  // decided outcome. `publishedCheckpoint === null` is what makes this "no usable checkpoint"
  // rather than merely "the last request errored" — without it the diagnostic fires on a healthy
  // decided auction and burns the dedupe key. Deliberately not `outcome === UNKNOWN`: that is a
  // derived store value, so it lags this render's payload (the same trap as the sibling effect
  // below), and it also reads UNKNOWN when block data is merely missing — which would let this log
  // fire on an auction that does have its checkpoint.
  //
  // ENDED plus no-checkpoint, unlike the sibling effect below: that one additionally waits on
  // `isAuctionDetailsSettled` because it reads `requiredCurrencyRaised` off the independent
  // GetAuction path. Here the failed request is itself the evidence, so nothing else has to land.
  //
  // createLogOnceGuard claims the key only after `isTerminal` passes, so the ordering this used to
  // depend on — gate before guard — is now structural rather than a comment.
  useEffect(() => {
    logCheckpointErrorOnce({
      keyParts: [chainId, auctionAddress],
      isTerminal: isError && progressState === AuctionProgressState.ENDED && publishedCheckpoint === null,
      log: () => {
        // Stable message — Datadog error tracking counts occurrences of this exact string. The
        // underlying query error rides on `cause` so its stack survives the rewrap.
        const checkpointError = new Error('Failed to load auction checkpoint', { cause: error })
        logger.error(checkpointError, {
          tags: { file: 'useAuctionCheckpointDiagnostics.ts', function: 'useAuctionCheckpointDiagnostics' },
          extra: { chainId, auctionAddress, error: errorMessage },
        })
      },
    })
  }, [isError, progressState, publishedCheckpoint, chainId, auctionAddress, error, errorMessage])

  // Decided against the checkpoint the caller is publishing this render, NOT against the store's
  // `hasMetThreshold`. The store is one commit behind here: `setCheckpointData` runs in a later
  // effect, so on the first successful load `hasMetThreshold` is still the previous (undefined)
  // value derived from a null checkpoint. Reading it would make every healthy first load of an
  // ended auction look undecidable and fire the diagnostic below — which then burns the dedupe key
  // and hides the rare stall the diagnostic exists to catch.
  const isGraduatedThisRender = useMemo(
    () =>
      computeIsGraduated({
        currencyRaised: publishedCheckpoint?.currencyRaised,
        requiredCurrencyRaised,
      }),
    [publishedCheckpoint, requiredCurrencyRaised],
  )

  // The same silent stall as a failed checkpoint, one layer in: the response arrived and carried a
  // checkpoint, but graduation is still undecided because a side of the comparison does not parse
  // (`currencyRaised` here, or the auction's `requiredCurrencyRaised`). Polling has already stopped,
  // so it is terminal. The outcome deliberately stays UNKNOWN and the page keeps the skeleton — a
  // payload we cannot read is not evidence the auction failed, and rendering "failed to launch" off
  // it would repeat the bug this banner logic exists to avoid — which makes this log the only thing
  // that surfaces it. A served verdict decides the outcome without this comparison, so it is no stall.
  useEffect(() => {
    const isSettledButUndecidable =
      isSuccess &&
      publishedCheckpoint !== null &&
      // Safe to read from the store: both derive from block numbers and the GetAuction response,
      // neither of which is racing the caller's checkpoint write.
      progressState === AuctionProgressState.ENDED &&
      isGraduatedThisRender === undefined &&
      servedIsGraduated === undefined &&
      // requiredCurrencyRaised arrives on the GetAuction path, which settles independently of the
      // checkpoint. Without this gate, details still in flight would log a stall that resolves itself.
      isAuctionDetailsSettled

    // Narrowing only — `isSettledButUndecidable` already requires a checkpoint, so this changes
    // nothing about when the log fires; it lets the payload below read `currencyRaised`.
    if (publishedCheckpoint === null) {
      return
    }

    logUndecidableCheckpointOnce({
      keyParts: [chainId, auctionAddress],
      isTerminal: isSettledButUndecidable,
      log: () => {
        // Stable message — Datadog error tracking counts occurrences of this exact string.
        const undecidableError = new Error('Auction checkpoint settled but graduation is undecidable')
        logger.error(undecidableError, {
          tags: { file: 'useAuctionCheckpointDiagnostics.ts', function: 'useAuctionCheckpointDiagnostics' },
          // Both sides of the failed comparison, so the log says which one could not be read.
          extra: {
            chainId,
            auctionAddress,
            currencyRaised: publishedCheckpoint.currencyRaised,
            requiredCurrencyRaised,
          },
        })
      },
    })
  }, [
    isSuccess,
    publishedCheckpoint,
    progressState,
    isGraduatedThisRender,
    servedIsGraduated,
    isAuctionDetailsSettled,
    requiredCurrencyRaised,
    chainId,
    auctionAddress,
  ])
}
