import { useQuery } from '@tanstack/react-query'
import { GetLatestCheckpointRequest } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { useEffect, useMemo } from 'react'
import { auctionQueries } from 'uniswap/src/data/rest/auctions/auctionQueries'
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
import { AuctionProgressState } from '~/components/Toucan/Auction/store/types'
import { useAuctionStore, useAuctionStoreActions } from '~/components/Toucan/Auction/store/useAuctionStore'
import { getPollingIntervalMs } from '~/utils/averageBlockTimeMs'

/**
 * Custom hook to load checkpoint data from API at regular intervals
 * Checkpoint data contains live auction state (clearing price, cumulative MPS, etc.)
 * that updates more frequently than auction details
 *
 * @param chainId - The chain ID for the auction
 * @param auctionAddress - The auction contract address
 */
export function useLoadCheckpointData(
  chainId: EVMUniverseChainId | undefined,
  auctionAddress: string | undefined,
): void {
  const { setCheckpointData, setOnchainCheckpoint } = useAuctionStoreActions()

  // Only poll when auction is actively running - data is static before start and after end
  const isAuctionActive = useAuctionStore((state) => state.progress.state === AuctionProgressState.IN_PROGRESS)

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

  const { data: checkpointResponse } = useQuery(
    auctionQueries.getLatestCheckpoint({
      params: new GetLatestCheckpointRequest({
        chainId,
        address: auctionAddress?.toLowerCase(),
      }),
      enabled: Boolean(chainId && auctionAddress),
      refetchInterval: pollingInterval,
    }),
  )

  // Update store when checkpoint data changes
  useEffect(() => {
    if (!checkpointResponse) {
      return
    }

    // simulatedCheckpoint for clearing price (UI display, bid submission, etc.)
    // Fall back to checkpoint when simulatedCheckpoint is unavailable to ensure chart data
    setCheckpointData(checkpointResponse.simulatedCheckpoint ?? checkpointResponse.checkpoint ?? null)
    // checkpoint for in-range detection (on-chain truth)
    setOnchainCheckpoint(checkpointResponse.checkpoint ?? null)
  }, [checkpointResponse, setCheckpointData, setOnchainCheckpoint])
}
