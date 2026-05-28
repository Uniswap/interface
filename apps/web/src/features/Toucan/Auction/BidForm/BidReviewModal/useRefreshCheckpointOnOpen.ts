import { useQueryClient } from '@tanstack/react-query'
import { GetLatestCheckpointRequest } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { useCallback, useEffect, useRef, useState } from 'react'
import { auctionQueries } from 'uniswap/src/data/rest/auctions/auctionQueries'
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
import { logger } from 'utilities/src/logger/logger'

interface UseRefreshCheckpointOnOpenParams {
  isOpen: boolean
  chainId: EVMUniverseChainId | undefined
  auctionAddress: string | undefined
}

interface UseRefreshCheckpointOnOpenResult {
  isRefreshing: boolean
  /** Manually trigger a checkpoint refresh (e.g., on error) */
  refreshCheckpoint: () => Promise<void>
}

/**
 * Hook that triggers a checkpoint data refresh when the bid review modal opens.
 * This ensures the user sees the most current clearing price before submitting their bid.
 *
 * @param isOpen - Whether the modal is currently open
 * @param chainId - The chain ID for the auction
 * @param auctionAddress - The auction contract address
 * @returns isRefreshing - Whether the checkpoint data is currently being refreshed
 */
export function useRefreshCheckpointOnOpen({
  isOpen,
  chainId,
  auctionAddress,
}: UseRefreshCheckpointOnOpenParams): UseRefreshCheckpointOnOpenResult {
  const queryClient = useQueryClient()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const wasOpenRef = useRef(false)

  // Manual refresh function that can be called on-demand (e.g., on error)
  const refreshCheckpoint = useCallback(async () => {
    if (!chainId || !auctionAddress) {
      return
    }

    setIsRefreshing(true)

    const checkpointQueryOptions = auctionQueries.getLatestCheckpoint({
      params: new GetLatestCheckpointRequest({
        chainId,
        address: auctionAddress.toLowerCase(),
      }),
    })

    try {
      await queryClient.invalidateQueries({ queryKey: checkpointQueryOptions.queryKey })
    } catch (error) {
      logger.warn('useRefreshCheckpointOnOpen', 'refreshCheckpoint', 'Manual refresh failed', {
        error: error instanceof Error ? error.message : String(error),
        chainId,
        auctionAddress,
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [chainId, auctionAddress, queryClient])

  useEffect(() => {
    let mounted = true

    // Only trigger refresh when modal opens (false → true transition)
    if (isOpen && !wasOpenRef.current && chainId && auctionAddress) {
      setIsRefreshing(true)

      // Get the query key for the checkpoint query
      const checkpointQueryOptions = auctionQueries.getLatestCheckpoint({
        params: new GetLatestCheckpointRequest({
          chainId,
          address: auctionAddress.toLowerCase(),
        }),
      })

      // Invalidate and refetch the checkpoint data
      queryClient
        .invalidateQueries({ queryKey: checkpointQueryOptions.queryKey })
        .then(() => {
          if (mounted) {
            setIsRefreshing(false)
          }
        })
        .catch((error) => {
          // Don't block submission on refresh failure - use stale data
          logger.warn('useRefreshCheckpointOnOpen', 'useEffect', 'Refresh failed on modal open', {
            error: error instanceof Error ? error.message : String(error),
            chainId,
            auctionAddress,
          })
          if (mounted) {
            setIsRefreshing(false)
          }
        })
    }

    // Track the previous open state
    wasOpenRef.current = isOpen

    // Reset refreshing state when modal closes
    if (!isOpen) {
      setIsRefreshing(false)
    }

    return () => {
      mounted = false
    }
  }, [isOpen, chainId, auctionAddress, queryClient])

  return { isRefreshing, refreshCheckpoint }
}
