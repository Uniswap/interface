import { type FetchStatus, useQuery, useQueryClient } from '@tanstack/react-query'
import { GetBidsByWalletRequest } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { AddressStringFormat, normalizeAddress } from '@universe/chains'
import { useCallback, useMemo } from 'react'
import { auctionQueries } from 'uniswap/src/data/apiClients/dataApiService/auctions/auctionQueries'
import { useAuctionDisplayDataSources } from '~/features/Toucan/Auction/hooks/useAuctionDisplayDataSources'
import {
  AuctionDisplayPhase,
  AuctionDisplayResult,
  resolveAuctionDisplayState,
} from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'
import { getUserBidsPollingEndBlock } from '~/features/Toucan/Auction/utils/userBidsPolling'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import type { TokenDetailsClaimSession } from '~/pages/TokenDetails/hooks/useTokenDetailsClaimSessions'
import { getTdpAuctionRequest } from '~/pages/TokenDetails/tdpAuctionQueryOptions'
import {
  type ClaimableAllocation,
  ClaimableAllocationState,
  getAuctionClaimBlock,
  resolveClaimableAllocation,
} from '~/pages/TokenDetails/utils/claimableAllocation'
import { getPollingIntervalMs } from '~/utils/averageBlockTimeMs'

/** Internal marker; the card renders its own Unavailable copy and never this message. */
const BIDS_OFFLINE_MESSAGE = 'Bids request is offline'

/**
 * The bids failure the claim card reacts to. A paused fetch (offline) never errors and never settles,
 * so without it the card would hold its skeleton with no way out — Unavailable is the only state
 * carrying a Retry. Post-mount data survives going offline.
 */
function resolveBidsError({
  error,
  bidsRequest,
  fetchStatus,
  isFetchedAfterMount,
}: {
  error: Error | null
  bidsRequest: GetBidsByWalletRequest | undefined
  fetchStatus: FetchStatus
  isFetchedAfterMount: boolean
}): Error | null {
  if (error) {
    return error
  }
  const offline = bidsRequest !== undefined && fetchStatus === 'paused' && !isFetchedAfterMount
  return offline ? new Error(BIDS_OFFLINE_MESSAGE) : null
}

/** The connected wallet's allocation from one known Custom auction on this token page. */
export function useTokenDetailsClaimableAllocation({ session }: { session: TokenDetailsClaimSession }): {
  allocation: ClaimableAllocation
  shouldReserveClaimSpace: boolean
  retry: () => void
} {
  // Retry refreshes the page's own GetAuction lookup, so it needs the page key, not the session's auction.
  const { chainId, tokenAddress } = useTDPStore((s) => ({ chainId: s.currencyChainId, tokenAddress: s.address }))
  const queryClient = useQueryClient()
  const { auction, chainId: evmChainId, walletAddress } = session
  const claimBlock = getAuctionClaimBlock(auction.claimBlock)
  const pollingEndBlock = getUserBidsPollingEndBlock(auction.endBlock)
  const watchUntilBlock =
    pollingEndBlock !== null
      ? claimBlock !== null && claimBlock > pollingEndBlock
        ? claimBlock
        : pollingEndBlock
      : undefined
  const dataSources = useAuctionDisplayDataSources({
    chainId: evmChainId,
    // Allocation uses phase and outcome only; the TDP layout owns its pool query.
    tokenAddress: undefined,
    auctionAddress: auction.address,
    startBlock: auction.startBlock,
    endBlock: auction.endBlock,
    watchUntilBlock,
    enabled: true,
  })
  const { phase, result } = resolveAuctionDisplayState({ auction, ...dataSources })
  const currentBlock = dataSources.currentBlock.status === 'success' ? dataSources.currentBlock.blockNumber : undefined
  // Bids decide whether a wallet sees the card at all, so they are only skipped once the checkpoint has
  // resolved a graduated auction whose claim window is still closed. A request that fires before that
  // resolves to NotOpen, never to a settled amount.
  const claimWindowPending =
    result === AuctionDisplayResult.Successful &&
    claimBlock !== null &&
    currentBlock !== undefined &&
    currentBlock < claimBlock
  const bidsEnabled =
    (phase === AuctionDisplayPhase.Ended || phase === AuctionDisplayPhase.Unknown) && !claimWindowPending

  // Keep the exact ADP key; require a fresh response when the claim or refund window opens.
  const bidsRequest = useMemo(() => {
    if (!bidsEnabled) {
      return undefined
    }
    return new GetBidsByWalletRequest({
      walletId: normalizeAddress(walletAddress, AddressStringFormat.Lowercase),
      auctionAddress: normalizeAddress(auction.address, AddressStringFormat.Lowercase),
      chainId: auction.chainId,
    })
  }, [auction, bidsEnabled, walletAddress])
  const { data, error, isSuccess, isFetchedAfterMount, fetchStatus } = useQuery(
    auctionQueries.getBidsByWallet({
      params: bidsRequest,
      enabled: bidsRequest !== undefined,
      staleTime: 0,
      refetchInterval:
        bidsEnabled && pollingEndBlock !== null && currentBlock !== undefined && currentBlock < pollingEndBlock
          ? getPollingIntervalMs(evmChainId)
          : false,
    }),
  )

  const { refetchCurrentBlock, refetchCheckpoint } = dataSources
  const retry = useCallback(() => {
    refetchCurrentBlock()
    refetchCheckpoint()
    // A malformed claim block only recovers once the page's auction lookup refreshes.
    const auctionRequest = getTdpAuctionRequest({ chainId, tokenAddress })
    if (auctionRequest) {
      void queryClient.invalidateQueries({
        queryKey: auctionQueries.getAuction({ params: auctionRequest }).queryKey,
        exact: true,
      })
    }
    if (bidsRequest) {
      void queryClient.invalidateQueries({
        queryKey: auctionQueries.getBidsByWallet({ params: bidsRequest }).queryKey,
        exact: true,
      })
    }
  }, [bidsRequest, chainId, queryClient, refetchCheckpoint, refetchCurrentBlock, tokenAddress])

  const allocation = resolveClaimableAllocation({
    auction,
    dataSources,
    bids: isSuccess && isFetchedAfterMount ? data.bids : undefined,
    error: resolveBidsError({ error, bidsRequest, fetchStatus, isFetchedAfterMount }),
  })
  // An unresolved phase may still be live or upcoming; reserve claim space only after the auction ends.
  const shouldReserveClaimSpace =
    allocation.status === ClaimableAllocationState.Loading && phase === AuctionDisplayPhase.Ended
  return { allocation, shouldReserveClaimSpace, retry }
}
