import { useEffect, useMemo } from 'react'
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
// biome-ignore lint/style/noRestrictedImports: Use wagmi version because it supports a chain being passed in
import { useBlockNumber } from 'wagmi'
import { useAuctionStore, useAuctionStoreActions } from '~/components/Toucan/Auction/store/useAuctionStore'

/**
 * Polls for the current block number on the auction's chain and updates the store
 * Uses wagmi's useBlockNumber hook with watch enabled for automatic polling
 * Polling interval is configured globally in wagmi config (12s for all chains)
 * Polling automatically stops once the auction has ended to conserve RPC calls
 * @param chainId - The chain ID to poll for block numbers
 * @param endBlock - Auction end blocks to determine if polling is needed
 */
export function useAuctionBlockPolling(chainId: EVMUniverseChainId | undefined, endBlock: number | undefined): void {
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

  // Whether we should fetch the initial block immediately (even before endBlock loads)
  // This prevents showing incorrect auction state while waiting for auction details
  const shouldFetchInitial = Boolean(chainId) && !currentBlockNumber

  // Enable query when either:
  // 1. We need to fetch initial block (chainId available, no currentBlock yet)
  // 2. We need to poll continuously (auction is active)
  const queryEnabled = shouldFetchInitial || shouldPoll

  const { data: blockNumber } = useBlockNumber({
    chainId,
    watch: shouldPoll,
    query: {
      enabled: queryEnabled,
    },
  })

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
