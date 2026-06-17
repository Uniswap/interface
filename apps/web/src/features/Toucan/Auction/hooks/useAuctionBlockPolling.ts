import { useEffect, useMemo } from 'react'
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
// oxlint-disable-next-line no-restricted-imports -- Use wagmi version because it supports a chain being passed in
import { useBlockNumber } from 'wagmi'
import { useAuctionStore, useAuctionStoreActions } from '~/features/Toucan/Auction/store/useAuctionStore'
import { useBlockTimestamp } from '~/hooks/useBlockTimestamp'
import { useMachineTimeMs } from '~/hooks/useMachineTime'

/**
 * Polls for the current block number on the auction's chain and updates the store.
 * Uses wagmi's useBlockNumber hook with watch enabled for automatic polling.
 * Polling interval is configured globally in wagmi config (12s for all chains).
 *
 * The 12s watch interval can lag a state transition by up to a full interval. To respond promptly,
 * once the countdown to the next boundary (auction start or end) reaches zero we refetch the block
 * number directly until the chain confirms the transition. All auction UI (bid form, intro banner,
 * clearing-price chart) derives its state from the store, so this makes them flip without a refresh.
 *
 * Polling automatically stops once the auction has ended to conserve RPC calls.
 * @param params.chainId - The chain ID to poll for block numbers
 * @param params.startBlock - Auction start block, used to detect the NOT_STARTED -> IN_PROGRESS boundary
 * @param params.endBlock - Auction end block, used to detect the IN_PROGRESS -> ENDED boundary and stop polling
 */
export function useAuctionBlockPolling({
  chainId,
  startBlock,
  endBlock,
}: {
  chainId: EVMUniverseChainId | undefined
  startBlock: number | undefined
  endBlock: number | undefined
}): void {
  const { setCurrentBlockNumberAndUpdateProgress } = useAuctionStoreActions()
  const currentBlockNumber = useAuctionStore((state) => state.currentBlockNumber)

  // Whether we should poll continuously (watch) - only after auction details load
  const shouldPoll = useMemo((): boolean => {
    if (!chainId || !endBlock) {
      return false
    }

    const current = Number(currentBlockNumber)

    // Auction ended - no need to poll
    if (currentBlockNumber && current > endBlock) {
      return false
    }

    // Auction active or upcoming - keep polling
    return true
  }, [chainId, endBlock, currentBlockNumber])

  // The block at which the auction next changes state (start, then end), or undefined once ended.
  const nextBoundaryBlock = useMemo((): number | undefined => {
    if (currentBlockNumber === undefined || startBlock === undefined || endBlock === undefined) {
      return undefined
    }
    if (currentBlockNumber < startBlock) {
      return startBlock
    }
    if (currentBlockNumber <= endBlock) {
      return endBlock
    }
    return undefined
  }, [currentBlockNumber, startBlock, endBlock])

  // Estimated wall-clock time of the next boundary — the same source the visible countdown uses.
  const boundaryTimestamp = useBlockTimestamp({ chainId, blockNumber: nextBoundaryBlock })
  const now = useMachineTimeMs(ONE_SECOND_MS)
  const isBoundaryCountdownDone = boundaryTimestamp !== undefined && now >= Number(boundaryTimestamp) * ONE_SECOND_MS

  // Whether we should fetch the initial block immediately (even before endBlock loads)
  // This prevents showing incorrect auction state while waiting for auction details
  const shouldFetchInitial = Boolean(chainId) && !currentBlockNumber

  // Enable query when either:
  // 1. We need to fetch initial block (chainId available, no currentBlock yet)
  // 2. We need to poll continuously (auction is active)
  const queryEnabled = shouldFetchInitial || shouldPoll

  const { data: blockNumber, refetch } = useBlockNumber({
    chainId,
    watch: shouldPoll,
    query: {
      enabled: queryEnabled,
    },
  })

  // The countdown has hit zero but the watch interval hasn't fetched the boundary block yet.
  // Refetch each tick until the store transitions, which clears nextBoundaryBlock and stops this.
  useEffect(() => {
    if (isBoundaryCountdownDone && queryEnabled) {
      refetch()
    }
  }, [isBoundaryCountdownDone, now, queryEnabled, refetch])

  useEffect(() => {
    if (blockNumber === undefined) {
      return
    }
    const nextBlockNumber = Number(blockNumber)
    if (currentBlockNumber !== undefined && nextBlockNumber <= currentBlockNumber) {
      return
    }
    if (currentBlockNumber !== nextBlockNumber) {
      setCurrentBlockNumberAndUpdateProgress(nextBlockNumber)
    }
  }, [blockNumber, currentBlockNumber, setCurrentBlockNumberAndUpdateProgress])
}
