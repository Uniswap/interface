import { PropsWithChildren, useState } from 'react'
import { useParams } from 'react-router'
import { isEVMChain } from 'uniswap/src/features/platforms/utils/chains'
import { useAuctionBlockPolling } from '~/components/Toucan/Auction/hooks/useAuctionBlockPolling'
import { useComputeConcentrationBand } from '~/components/Toucan/Auction/hooks/useComputeConcentrationBand'
import { useLoadAuctionDetails } from '~/components/Toucan/Auction/hooks/useLoadAuctionDetails'
import { useLoadBidDistributionData } from '~/components/Toucan/Auction/hooks/useLoadBidDistributionData'
import { useLoadCheckpointData } from '~/components/Toucan/Auction/hooks/useLoadCheckpointData'
import { useLoadUserBids } from '~/components/Toucan/Auction/hooks/useLoadUserBids'
import { useUpdateTokenColor } from '~/components/Toucan/Auction/hooks/useUpdateTokenColor'
import { AuctionStoreContext } from '~/components/Toucan/Auction/store/AuctionStoreContext'
import { createAuctionStore } from '~/components/Toucan/Auction/store/createAuctionStore'
import { useAuctionStore } from '~/components/Toucan/Auction/store/useAuctionStore'
import { getChainIdFromChainUrlParam } from '~/utils/chainParams'

/**
 * Inner provider component that manages all auction data loading
 * Uses custom hooks to separate concerns and improve maintainability
 */
function AuctionStoreProviderInner({ children }: PropsWithChildren) {
  const { chainId, auctionAddress } = useAuctionStore((state) => ({
    chainId: state.chainId,
    auctionAddress: state.auctionAddress,
  }))

  // Load auction details from API and enrich with token info (fetched once, not polled)
  useLoadAuctionDetails(chainId, auctionAddress)

  // Load checkpoint data with polling (clearing price, graduation progress, etc.)
  useLoadCheckpointData(chainId, auctionAddress)

  // Load user bids with polling
  useLoadUserBids({
    auctionAddress,
    chainId,
  })

  // Load bid distribution data (for stats banner and distribution chart)
  // This provides concentration band and total committed volume data
  useLoadBidDistributionData({
    chainId,
    auctionAddress,
  })

  // Compute concentration band from bid distribution data
  // This makes concentration available for the stats banner immediately on load
  useComputeConcentrationBand()

  // Extract and update token color for theming
  useUpdateTokenColor()

  // Poll for current block number and update auction progress
  // Use chainId from URL params (available immediately) for initial block fetch,
  // not chainIdFromStore (which requires API response) to avoid race condition
  // where progressState is NOT_STARTED while timestamps show "X ago"
  const endBlock = useAuctionStore((state) => state.auctionDetails?.endBlock)
  const endBlockNum = endBlock ? Number(endBlock) : undefined
  useAuctionBlockPolling(chainId, endBlockNum)

  return children
}

export function AuctionStoreProvider({ children }: PropsWithChildren) {
  const { chainName, auctionAddress } = useParams<{
    chainName: string
    auctionAddress: string
  }>()

  const rawChainId = getChainIdFromChainUrlParam(chainName)
  const chainId = rawChainId && isEVMChain(rawChainId) ? rawChainId : undefined

  const [store] = useState(() => createAuctionStore(auctionAddress, chainId))

  return (
    <AuctionStoreContext.Provider value={store}>
      <AuctionStoreProviderInner>{children}</AuctionStoreProviderInner>
    </AuctionStoreContext.Provider>
  )
}
