import { useQuery } from '@tanstack/react-query'
import { GetLatestCheckpointRequest } from '@uniswap/client-launches/dist/data/v1/auction_pb'
import { EVMUniverseChainId, AddressStringFormat, normalizeAddress } from '@universe/chains'
import { useEffect, useMemo } from 'react'
import { auctionQueries } from 'uniswap/src/data/apiClients/dataApiService/auctions/auctionQueries'
import { useAuctionCheckpointDiagnostics } from '~/features/Toucan/Auction/hooks/useAuctionCheckpointDiagnostics'
import { AuctionCheckpointLoadState, AuctionProgressState } from '~/features/Toucan/Auction/store/types'
import { useAuctionStore, useAuctionStoreActions } from '~/features/Toucan/Auction/store/useAuctionStore'
import { getPollingIntervalMs } from '~/utils/averageBlockTimeMs'

/**
 * Custom hook to load checkpoint data from API at regular intervals
 * Checkpoint data contains live auction state (clearing price, cumulative MPS, etc.)
 * that updates more frequently than auction details
 *
 * Fetch and publish only. Reporting the ways an ended auction's outcome can stall permanently lives
 * in `useAuctionCheckpointDiagnostics`, so the two publish effects below — whose relative order is
 * load-bearing — stay adjacent instead of being separated by logging.
 *
 * @param chainId - The chain ID for the auction
 * @param auctionAddress - The auction contract address
 */
export function useLoadCheckpointData(
  chainId: EVMUniverseChainId | undefined,
  auctionAddress: string | undefined,
): void {
  const { setCheckpointData, setOnchainCheckpoint, setTotalCleared, setCheckpointLoadState } = useAuctionStoreActions()

  const progressState = useAuctionStore((state) => state.progress.state)

  // Only poll when auction is actively running - data is static before start and after end
  const isAuctionActive = progressState === AuctionProgressState.IN_PROGRESS

  const pollingInterval = useMemo(() => {
    // Only poll during active auction - checkpoint data is static before/after
    if (!isAuctionActive) {
      return false
    }
    if (!chainId) {
      return false
    }
    return getPollingIntervalMs(chainId)
  }, [chainId, isAuctionActive])

  const isEnabled = Boolean(chainId && auctionAddress)

  const {
    data: checkpointResponse,
    isSuccess,
    isError,
    error,
  } = useQuery(
    auctionQueries.getLatestCheckpoint({
      params: new GetLatestCheckpointRequest({
        chainId,
        address: auctionAddress ? normalizeAddress(auctionAddress, AddressStringFormat.Lowercase) : undefined,
      }),
      enabled: isEnabled,
      refetchInterval: pollingInterval,
    }),
  )

  // Settled-vs-in-flight, published to the store so the outcome classifier can tell an unresolved
  // checkpoint from one that resolved empty. Terminal by construction: the query retries a bounded
  // AUCTION_DEFAULT_RETRY times, so a persistent failure lands on Error rather than loading forever.
  const checkpointLoadState = useMemo(() => {
    if (!isEnabled) {
      return AuctionCheckpointLoadState.Idle
    }
    if (isSuccess) {
      return AuctionCheckpointLoadState.Success
    }
    if (isError) {
      return AuctionCheckpointLoadState.Error
    }
    return AuctionCheckpointLoadState.Loading
  }, [isEnabled, isSuccess, isError])

  // The checkpoint this hook publishes to the store, null when the response carried none.
  // simulatedCheckpoint for clearing price (UI display, bid submission, etc.); fall back to
  // checkpoint when simulatedCheckpoint is unavailable to ensure chart data.
  const publishedCheckpoint = useMemo(
    () => checkpointResponse?.simulatedCheckpoint ?? checkpointResponse?.checkpoint ?? null,
    [checkpointResponse],
  )

  // Diagnostics only — writes nothing to the store and changes nothing rendered. Takes the
  // checkpoint being published this render rather than reading it back off the store, which is a
  // commit behind at this point.
  useAuctionCheckpointDiagnostics({
    chainId,
    auctionAddress,
    isError,
    error,
    isSuccess,
    publishedCheckpoint,
  })

  // Update store when checkpoint data changes
  useEffect(() => {
    if (!checkpointResponse) {
      return
    }

    setCheckpointData(publishedCheckpoint)
    // checkpoint for in-range detection (on-chain truth)
    setOnchainCheckpoint(checkpointResponse.checkpoint ?? null)
    // total tokens cleared from the response-level field (not the deprecated Checkpoint.totalCleared);
    // feeds the "% of supply sold" metric and remaining-supply math
    setTotalCleared(checkpointResponse.totalCleared || null)
  }, [checkpointResponse, publishedCheckpoint, setCheckpointData, setOnchainCheckpoint, setTotalCleared])

  // Declared last on purpose — must run after the payload effect directly above, and the ordering is
  // load-bearing rather than incidental. `setCheckpointLoadState` recomputes `progress` against
  // whatever `checkpointData` the store currently holds, so marking Success first would leave the
  // store momentarily reading Success-with-no-checkpoint: exactly `checkpointSettledEmpty`, which
  // resolves an ended auction to FAILED. A graduated auction would hold a false failure outcome for
  // that instant, and any subscriber that reads it renders "failed to launch". Publishing the
  // payload first makes the intermediate state fail safe: it is only ever "data present, not yet
  // marked settled", which classifies from the real amounts or holds UNKNOWN and keeps the skeleton.
  //
  // React 18 batches both updates into one effect flush, so nothing renders in between today; this
  // ordering is what keeps that a convenience rather than the only thing standing between a
  // graduated auction and a one-frame false failure claim. Keep these two effects adjacent.
  useEffect(() => {
    setCheckpointLoadState(checkpointLoadState)
  }, [checkpointLoadState, setCheckpointLoadState])
}
