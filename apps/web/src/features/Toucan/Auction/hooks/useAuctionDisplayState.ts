import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useAuctionDisplayDataSources } from '~/features/Toucan/Auction/hooks/useAuctionDisplayDataSources'
import { useAuctionTradingToken } from '~/features/Toucan/Auction/hooks/useAuctionTradingToken'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import {
  resolveAuctionDisplayState,
  type AuctionDisplayState,
} from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'

/**
 * Shared phase / pool-availability state for the auction in the store. `undefined` while the
 * TokenProvenance flag is off, which also keeps the pool lookup from running.
 */
export function useAuctionDisplayState(): AuctionDisplayState | undefined {
  const isEnabled = useFeatureFlag(FeatureFlags.TokenProvenance)
  const { auctionDetails, currentBlockNumber } = useAuctionStore((state) => ({
    auctionDetails: state.auctionDetails,
    currentBlockNumber: state.currentBlockNumber,
  }))
  const { tradingTokenAddress, loading: tradingTokenLoading } = useAuctionTradingToken({
    chainId: auctionDetails?.chainId,
    tokenAddress: auctionDetails?.tokenAddress,
    enabled: isEnabled,
  })
  const { currentBlock, currencyRaised, pools } = useAuctionDisplayDataSources({
    chainId: auctionDetails?.chainId,
    tokenAddress: tradingTokenAddress,
    auctionAddress: auctionDetails?.address,
    startBlock: auctionDetails?.startBlock,
    endBlock: auctionDetails?.endBlock,
    enabled: isEnabled && auctionDetails !== null,
    currentBlock:
      currentBlockNumber === undefined
        ? { status: 'loading' }
        : { status: 'success', blockNumber: BigInt(currentBlockNumber) },
  })

  if (!isEnabled) {
    return undefined
  }

  // A redeemable whose underlying read failed (or returned the zero address) has no token to look pools
  // up for, so the lookup would stay Loading forever and hide both the now-trading card and the legacy
  // banner. Settle it as a confirmed missing pool rather than a failed lookup: there is nothing to
  // trade, and `error` would leave the timeline promising trading that no surface here can offer.
  const tradingTokenUnresolved = auctionDetails !== null && tradingTokenAddress === undefined && !tradingTokenLoading

  return resolveAuctionDisplayState({
    auction: auctionDetails,
    currentBlock,
    currencyRaised,
    pools: tradingTokenUnresolved ? { status: 'success', poolCount: 0 } : pools,
  })
}
