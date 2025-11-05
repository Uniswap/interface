import { useAuctionStore, useAuctionStoreActions } from 'components/Toucan/Auction/store/useAuctionStore'
import { useEffect, useMemo } from 'react'
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
// biome-ignore lint/style/noRestrictedImports: Use wagmi version because it supports a chain being passed in
import { useBlockNumber } from 'wagmi'

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

  // Determine if we need polling based on auction state
  const shouldPoll = useMemo((): boolean => {
    if (!chainId || !endBlock) {
      return false
    }

    // First poll - we need to know current block
    if (!currentBlockNumber) {
      return true
    }

    const current = Number(currentBlockNumber)

    // Auction ended - no need to poll
    if (current > endBlock) {
      return false
    }

    // Auction active or upcoming - keep polling
    return true
  }, [chainId, endBlock, currentBlockNumber])

  const { data: blockNumber } = useBlockNumber({
    chainId,
    watch: shouldPoll,
    query: {
      enabled: shouldPoll,
    },
  })

  // biome-ignore lint/correctness/useExhaustiveDependencies: setCurrentBlockNumberAndUpdateProgress is stable from store actions
  useEffect(() => {
    if (blockNumber !== undefined) {
      setCurrentBlockNumberAndUpdateProgress(blockNumber)
    }
  }, [blockNumber])
}
