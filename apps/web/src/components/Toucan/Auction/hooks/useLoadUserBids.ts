import { useQuery } from '@tanstack/react-query'
import { GetBidsByWalletRequest } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { auctionQueries } from 'uniswap/src/data/rest/auctions/auctionQueries'
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { isFinalizedTxStatus } from 'uniswap/src/features/transactions/types/utils'
import { logger } from 'utilities/src/logger/logger'
import { areUserBidsEqual, sortUserBidsById } from '~/components/Toucan/Auction/BidDistributionChart/utils/equality'
import { AuctionBidStatus, AuctionProgressState } from '~/components/Toucan/Auction/store/types'
import { useAuctionStore, useAuctionStoreActions } from '~/components/Toucan/Auction/store/useAuctionStore'
import { mapApiBidToUserBid } from '~/components/Toucan/Auction/utils/mapApiBidToUserBid'
import { useActiveAddress } from '~/features/accounts/store/hooks'
import { useTransaction, useTransactions } from '~/state/transactions/hooks'
import { getPollingIntervalMs } from '~/utils/averageBlockTimeMs'

/**
 * Number of blocks to continue polling user bids after the auction ends.
 * This buffer accounts for potential API data lag in reflecting final bid states.
 */
const USER_BIDS_POST_AUCTION_POLLING_BUFFER_BLOCKS = 200

interface UseLoadUserBidsParams {
  auctionAddress: string | undefined
  chainId: EVMUniverseChainId | undefined
}

/**
 * Custom hook to load user bids for a specific auction and wallet
 * Handles bid polling, wallet/auction change detection, deduplication, and error logging
 *
 * Polling behavior:
 * - Before start: No polling (no bids can exist yet)
 * - During auction: Poll every block to capture new bids
 * - After end: Continue polling for USER_BIDS_POST_AUCTION_POLLING_BUFFER_BLOCKS blocks
 *   to account for potential API data lag in reflecting final bid states
 * - After buffer period: Manual refetch only via refetchUserBids() for withdrawals/claims
 */
export function useLoadUserBids({ auctionAddress, chainId }: UseLoadUserBidsParams): void {
  const {
    setUserBids,
    setRefetchUserBids,
    setOptimisticBid,
    removePendingWithdrawalBid,
    removeAwaitingConfirmationBid,
    clearAllWithdrawalStateForBid,
    clearAllWithdrawalState,
    setUserBidsInitialized,
  } = useAuctionStoreActions()
  const previousBidsKeyRef = useRef<string | undefined>(undefined)
  const optimisticBid = useAuctionStore((state) => state.optimisticBid)
  const awaitingConfirmationBidIds = useAuctionStore((state) => state.awaitingConfirmationBidIds)
  const withdrawalTxHashes = useAuctionStore((state) => state.withdrawalTxHashes)
  const isGraduated = useAuctionStore((state) => state.progress.isGraduated)
  const userBidsInitialized = useAuctionStore((state) => state.userBidsInitialized)

  // Monitor transaction status for optimistic bid - clears if transaction fails on-chain
  const optimisticBidTx = useTransaction(optimisticBid?.txHash)

  // Get unique txHashes from pending withdrawals for monitoring all concurrent transactions
  const uniqueTxHashes = useMemo(() => new Set(withdrawalTxHashes.values()), [withdrawalTxHashes])
  const withdrawalTxMap = useTransactions(uniqueTxHashes)

  const currentBlockNumber = useAuctionStore((state) => state.currentBlockNumber)
  const endBlock = useAuctionStore((state) => state.auctionDetails?.endBlock)
  const progressState = useAuctionStore((state) => state.progress.state)

  const shouldPollUserBids = useMemo(() => {
    // Always poll during active auction
    if (progressState === AuctionProgressState.IN_PROGRESS) {
      return true
    }

    // After auction ends, continue polling until we're past the buffer period
    if (progressState === AuctionProgressState.ENDED) {
      if (currentBlockNumber === undefined || !endBlock) {
        return false
      }

      const endBlockNum = Number(endBlock)
      const blocksSinceEnd = currentBlockNumber - endBlockNum
      return blocksSinceEnd < USER_BIDS_POST_AUCTION_POLLING_BUFFER_BLOCKS
    }

    // Don't poll before auction starts or in UNKNOWN state
    return false
  }, [progressState, currentBlockNumber, endBlock])

  // Get active wallet address
  const activeWalletAddress = useActiveAddress(Platform.EVM)

  // Normalize wallet address for consistency
  const normalizedWalletId = activeWalletAddress?.toLowerCase()

  // Generate composite key to detect wallet or auction changes
  const bidsKey = useMemo(
    () => (normalizedWalletId && auctionAddress ? `${normalizedWalletId}::${auctionAddress.toLowerCase()}` : undefined),
    [normalizedWalletId, auctionAddress],
  )

  // Clear bids and reset initialized flag when wallet or auction changes
  useEffect(() => {
    if (previousBidsKeyRef.current !== bidsKey) {
      previousBidsKeyRef.current = bidsKey
      setUserBids([])
      setUserBidsInitialized(false)
    }
  }, [bidsKey, setUserBids, setUserBidsInitialized])

  // When there's no wallet connected, immediately mark as initialized since there are no bids to load
  // This handles both initial mount and wallet disconnect cases
  useEffect(() => {
    if (!normalizedWalletId) {
      setUserBidsInitialized(true)
    }
  }, [normalizedWalletId, setUserBidsInitialized])

  // Prepare query parameters
  const bidsQueryParams = useMemo(() => {
    if (!normalizedWalletId || !auctionAddress || !chainId) {
      return undefined
    }

    return new GetBidsByWalletRequest({
      walletId: normalizedWalletId,
      auctionAddress: auctionAddress.toLowerCase(),
      chainId,
    })
  }, [auctionAddress, chainId, normalizedWalletId])

  // Determine polling interval based on chain type
  // Polling is enabled during active auction, post-auction buffer period, OR when any bid is awaiting withdrawal confirmation
  const hasAwaitingConfirmations = awaitingConfirmationBidIds.size > 0
  const bidsPollingInterval = useMemo<number | false>(() => {
    if (!shouldPollUserBids && !hasAwaitingConfirmations) {
      return false
    }
    if (!chainId) {
      return false
    }

    return getPollingIntervalMs(chainId)
  }, [chainId, shouldPollUserBids, hasAwaitingConfirmations])

  // Fetch bids with polling (only during active auction)
  const {
    data: bidsResponse,
    error: bidsError,
    refetch,
  } = useQuery(
    auctionQueries.getBidsByWallet({
      params: bidsQueryParams,
      enabled: Boolean(bidsQueryParams),
      refetchInterval: bidsPollingInterval,
    }),
  )

  // Expose refetch function via store for manual refresh after withdrawals
  const stableRefetch = useCallback(() => {
    refetch()
  }, [refetch])

  useEffect(() => {
    setRefetchUserBids(stableRefetch)
    return () => {
      setRefetchUserBids(null)
    }
  }, [stableRefetch, setRefetchUserBids])

  // Get current userBids from store for comparison
  const currentUserBids = useAuctionStore((state) => state.userBids)

  // Process and store bids (only if changed)
  useEffect(() => {
    if (!bidsResponse || !bidsQueryParams) {
      return
    }

    const bids = bidsResponse.bids
    if (bids.length === 0) {
      // Only update if current state is not already empty
      if (currentUserBids.length > 0) {
        setUserBids([])
      }
      // Mark as initialized even with empty bids
      setUserBidsInitialized(true)
      return
    }

    // Deduplicate bids by bidId
    const seenBidIds = new Set<string>()
    const mappedBids = bids
      .filter((bid) => {
        if (seenBidIds.has(bid.bidId)) {
          return false
        }
        seenBidIds.add(bid.bidId)
        return true
      })
      .map(mapApiBidToUserBid)

    const sortedMappedBids = sortUserBidsById(mappedBids)
    const sortedCurrentBids = sortUserBidsById(currentUserBids)

    // Only update store if bids have actually changed
    if (!areUserBidsEqual(sortedCurrentBids, sortedMappedBids)) {
      setUserBids(sortedMappedBids)

      // Clear optimistic bid when API returns a matching bid
      // Match on maxPrice AND createdAt being within 60s of submission time
      // This handles both new bids and updates, avoiding false matches on old bids with same price
      if (optimisticBid !== null) {
        const MATCH_WINDOW_MS = 20_000 // 20 seconds
        const optimisticBidConfirmed = sortedMappedBids.some((bid) => {
          if (bid.maxPrice !== optimisticBid.maxPriceQ96) {
            return false
          }
          const bidCreatedAt = new Date(bid.createdAt).getTime()
          const timeDiff = Math.abs(bidCreatedAt - optimisticBid.submittedAt)
          return timeDiff < MATCH_WINDOW_MS
        })
        if (optimisticBidConfirmed) {
          setOptimisticBid(null)
        }
      }
    }

    // Mark as initialized after processing bids
    setUserBidsInitialized(true)
  }, [
    bidsQueryParams,
    bidsResponse,
    setUserBids,
    setUserBidsInitialized,
    currentUserBids,
    optimisticBid,
    setOptimisticBid,
  ])

  // Log bid fetch errors
  useEffect(() => {
    if (bidsError) {
      logger.error(bidsError, {
        tags: { file: 'useLoadUserBids.ts', function: 'useLoadUserBids' },
        extra: { walletId: normalizedWalletId, auctionAddress },
      })
    }
  }, [auctionAddress, bidsError, normalizedWalletId])

  // Clear optimistic bid if its transaction fails on-chain
  // For success cases, wait for API to return the bid (handled in bids processing effect above)
  useEffect(() => {
    if (optimisticBid?.txHash && optimisticBidTx?.status === TransactionStatus.Failed) {
      setOptimisticBid(null)
    }
  }, [optimisticBid?.txHash, optimisticBidTx?.status, setOptimisticBid])

  // Safety timeout: clear optimistic bid after 30 seconds to prevent lingering on edge cases
  useEffect(() => {
    if (!optimisticBid) {
      return undefined
    }

    const OPTIMISTIC_BID_TIMEOUT_MS = 30_000 // 30 seconds
    const elapsed = Date.now() - optimisticBid.submittedAt
    const remainingTime = Math.max(0, OPTIMISTIC_BID_TIMEOUT_MS - elapsed)

    const timeoutId = setTimeout(() => {
      setOptimisticBid(null)
    }, remainingTime)

    return () => clearTimeout(timeoutId)
  }, [optimisticBid, setOptimisticBid])

  // Check each bid that's awaiting confirmation and remove it from the set when resolved
  // This effect monitors individual bids rather than requiring ALL bids to be resolved
  useEffect(() => {
    if (awaitingConfirmationBidIds.size === 0 || !userBidsInitialized) {
      return
    }

    if (currentUserBids.length === 0) {
      // No bids in API response but we're awaiting confirmations - clear all
      clearAllWithdrawalState()
      return
    }

    // Check each awaiting bid and remove from set if resolved
    for (const bidId of awaitingConfirmationBidIds) {
      const bid = currentUserBids.find((b) => b.bidId === bidId)
      if (!bid) {
        // Bid not found in API response - might have been deleted, clear its state
        clearAllWithdrawalStateForBid(bidId)
        continue
      }

      const isResolved = isGraduated
        ? bid.status === AuctionBidStatus.Claimed || (bid.status === AuctionBidStatus.Exited && bid.amount === '0')
        : bid.status === AuctionBidStatus.Exited

      if (isResolved) {
        // This specific bid is resolved, remove it from awaiting set
        removeAwaitingConfirmationBid(bidId)
      }
    }
  }, [
    awaitingConfirmationBidIds,
    clearAllWithdrawalState,
    clearAllWithdrawalStateForBid,
    currentUserBids,
    isGraduated,
    removeAwaitingConfirmationBid,
    userBidsInitialized,
  ])

  // Update pending state when any withdrawal transaction finalizes
  // This effect monitors all pending transactions and clears state for bids associated with finalized txs
  useEffect(() => {
    if (withdrawalTxHashes.size === 0) {
      return
    }

    // Check each unique txHash for finalization
    for (const txHash of uniqueTxHashes) {
      const tx = withdrawalTxMap.get(txHash)
      if (!tx?.status || !isFinalizedTxStatus(tx.status)) {
        continue
      }

      // Find all bidIds associated with this finalized txHash
      const bidIdsForTx: string[] = []
      for (const [bidId, bidTxHash] of withdrawalTxHashes) {
        if (bidTxHash === txHash) {
          bidIdsForTx.push(bidId)
        }
      }

      if (tx.status === TransactionStatus.Success) {
        // Tx succeeded - clear pending state for these bids, but keep awaiting confirmation
        // to continue polling until API reflects the updated bid status
        for (const bidId of bidIdsForTx) {
          removePendingWithdrawalBid(bidId)
        }
      } else {
        // Tx failed or cancelled - clear all withdrawal state for these bids
        for (const bidId of bidIdsForTx) {
          clearAllWithdrawalStateForBid(bidId)
        }
      }
    }
  }, [clearAllWithdrawalStateForBid, removePendingWithdrawalBid, uniqueTxHashes, withdrawalTxHashes, withdrawalTxMap])
}
