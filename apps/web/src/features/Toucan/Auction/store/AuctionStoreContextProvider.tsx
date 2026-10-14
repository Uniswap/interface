import { AddressStringFormat, EVMUniverseChainId, isEVMChain, normalizeAddress } from '@universe/chains'
import { PropsWithChildren, useState } from 'react'
import { useParams } from 'react-router'
import { useAuctionBlockPolling } from '~/features/Toucan/Auction/hooks/useAuctionBlockPolling'
import { useComputeConcentrationBand } from '~/features/Toucan/Auction/hooks/useComputeConcentrationBand'
import { useLoadAuctionDetails } from '~/features/Toucan/Auction/hooks/useLoadAuctionDetails'
import { useLoadBidDistributionData } from '~/features/Toucan/Auction/hooks/useLoadBidDistributionData'
import { useLoadCheckpointData } from '~/features/Toucan/Auction/hooks/useLoadCheckpointData'
import { useLoadTickDetails } from '~/features/Toucan/Auction/hooks/useLoadTickDetails'
import { useLoadUserBids } from '~/features/Toucan/Auction/hooks/useLoadUserBids'
import { useUpdateTokenColor } from '~/features/Toucan/Auction/hooks/useUpdateTokenColor'
import { AuctionStoreContext } from '~/features/Toucan/Auction/store/AuctionStoreContext'
import { createAuctionStore } from '~/features/Toucan/Auction/store/createAuctionStore'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { getChainIdFromChainUrlParam } from '~/utils/params/chainParams'

/**
 * Inner provider component that manages all auction data loading
 * Uses custom hooks to separate concerns and improve maintainability
 */
function AuctionStoreProviderInner({
  children,
  onWithdrawalConfirmed,
}: PropsWithChildren<{ onWithdrawalConfirmed?: () => void }>) {
  const { chainId, auctionAddress } = useAuctionStore((state) => ({
    chainId: state.chainId,
    auctionAddress: state.auctionAddress,
  }))

  // Load auction details from API and enrich with token info (polled at the checkpoint cadence)
  useLoadAuctionDetails(chainId, auctionAddress)

  // Load checkpoint data with polling (clearing price, graduation progress, etc.)
  useLoadCheckpointData(chainId, auctionAddress)

  // Load user bids with polling
  useLoadUserBids({
    auctionAddress,
    chainId,
    onWithdrawalConfirmed,
  })

  const startBlock = useAuctionStore((state) => state.auctionDetails?.startBlock)
  const endBlock = useAuctionStore((state) => state.auctionDetails?.endBlock)
  useAuctionBlockPolling({
    chainId,
    startBlock: startBlock ? Number(startBlock) : undefined,
    endBlock: endBlock ? Number(endBlock) : undefined,
  })

  return children
}

/** Chart data and page theming are only consumed by the Auction Details page. */
function AuctionPageDataLoader(): null {
  const { chainId, auctionAddress } = useAuctionStore((state) => ({
    chainId: state.chainId,
    auctionAddress: state.auctionAddress,
  }))

  // Load bid distribution data (for stats banner and distribution chart)
  // This provides concentration band and total committed volume data
  useLoadBidDistributionData({
    chainId,
    auctionAddress,
  })

  // Load initialized-tick details for the ChartBarTooltip "Remaining" row.
  // Gated on ToucanTickDetailsTooltip — no-op when flag is off.
  useLoadTickDetails({
    chainId,
    auctionAddress,
  })

  // Compute concentration band from bid distribution data
  // This makes concentration available for the stats banner immediately on load
  useComputeConcentrationBand()

  // Extract and update token color for theming
  useUpdateTokenColor()

  return null
}

/** Creates the store once for its lifetime; remount with a `key` to switch auctions. */
export function AuctionStoreInstanceProvider({
  auctionAddress,
  chainId,
  children,
  onWithdrawalConfirmed,
}: PropsWithChildren<{
  auctionAddress?: string
  chainId?: EVMUniverseChainId
  onWithdrawalConfirmed?: () => void
}>) {
  const [store] = useState(() => createAuctionStore(auctionAddress, chainId))

  return (
    <AuctionStoreContext.Provider value={store}>
      <AuctionStoreProviderInner onWithdrawalConfirmed={onWithdrawalConfirmed}>{children}</AuctionStoreProviderInner>
    </AuctionStoreContext.Provider>
  )
}

export function AuctionStoreProvider({ children }: PropsWithChildren) {
  const { chainName, auctionAddress } = useParams<{
    chainName: string
    auctionAddress: string
  }>()

  const rawChainId = getChainIdFromChainUrlParam(chainName)
  const chainId = rawChainId && isEVMChain(rawChainId) ? rawChainId : undefined

  return (
    // React Router reuses the route element when only params change, so an
    // auction A -> auction B navigation would otherwise keep A's store alive
    // (including its canonicalized auctionAddress). Keying on the URL params
    // remounts the subtree and recreates the store per auction. The key uses
    // the raw param — canonicalization inside the store never changes the URL,
    // so resolving a token address to the auction contract doesn't remount.
    <AuctionStoreInstanceProvider
      key={`${chainId ?? 'unknown'}:${auctionAddress ? normalizeAddress(auctionAddress, AddressStringFormat.Lowercase) : 'unknown'}`}
      auctionAddress={auctionAddress}
      chainId={chainId}
    >
      <AuctionPageDataLoader />
      {children}
    </AuctionStoreInstanceProvider>
  )
}
