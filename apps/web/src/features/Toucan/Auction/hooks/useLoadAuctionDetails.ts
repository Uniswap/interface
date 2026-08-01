import { useQuery } from '@tanstack/react-query'
import { GetAuctionRequest } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { useEffect, useMemo, useRef } from 'react'
import { auctionQueries } from 'uniswap/src/data/rest/auctions/auctionQueries'
import { EVMUniverseChainId, UniverseChainId } from 'uniswap/src/features/chains/types'
import { useAuctionTokenInfo } from '~/features/Toucan/Auction/hooks/useAuctionTokenInfo'
import { AuctionDetails, AuctionDetailsLoadState } from '~/features/Toucan/Auction/store/types'
import { useAuctionStoreActions } from '~/features/Toucan/Auction/store/useAuctionStore'
import { computePreBidEndBlock, ParsedAuctionStepLike } from '~/features/Toucan/Auction/utils/preBidEndBlock'
import { resolveAuctionTokenLogo } from '~/features/Toucan/Auction/utils/tokenMetadata'
import { getAuctionMetadata } from '~/features/Toucan/Config/config'
import { getPollingIntervalMs } from '~/utils/averageBlockTimeMs'

/**
 * Custom hook to load auction details from API and enrich with token information.
 * Manages the complete auction loading lifecycle including load states and error handling.
 *
 * Polls at the same cadence as checkpoint data so slow-moving live fields on the auction
 * (e.g. liquidity-lock burn totals) stay fresh. Fast-moving data like clearing price is
 * still polled via useLoadCheckpointData.
 *
 * @param chainId - The chain ID for the auction
 * @param auctionAddress - The auction contract address
 */
export function useLoadAuctionDetails(
  chainId: EVMUniverseChainId | undefined,
  auctionAddress: string | undefined,
): void {
  const { setAuctionDetails, setAuctionDetailsLoadState } = useAuctionStoreActions()
  const previousAuctionIdRef = useRef<string | undefined>(undefined)

  // Fetch auction data from API, polling at the checkpoint cadence. Unlike checkpoint polling
  // this is not gated on the auction being active: lock/burn data keeps updating after the
  // auction ends (burns are keeper-driven on the graduated pool).
  const {
    data: auctionData,
    error: auctionError,
    isLoading: isAuctionLoading,
  } = useQuery(
    auctionQueries.getAuction({
      params: new GetAuctionRequest({
        chainId,
        address: auctionAddress?.toLowerCase(),
      }),
      enabled: Boolean(chainId && auctionAddress),
      refetchInterval: chainId ? getPollingIntervalMs(chainId) : false,
    }),
  )

  // Extract the first auction from response
  const apiAuction = useMemo(() => {
    if (!auctionData) {
      return null
    }
    return auctionData.auctions[0] ?? null
  }, [auctionData])

  // Use auctionId from API response to detect auction changes
  const currentAuctionId = apiAuction?.auctionId

  // Fetch token info for the auction token
  const { tokenInfo } = useAuctionTokenInfo(
    apiAuction?.tokenAddress,
    apiAuction?.chainId as UniverseChainId | undefined,
  )

  // Reset auction details when auctionId changes (new auction loaded)
  useEffect(() => {
    if (previousAuctionIdRef.current !== currentAuctionId) {
      previousAuctionIdRef.current = currentAuctionId

      setAuctionDetails(null)

      if (currentAuctionId) {
        setAuctionDetailsLoadState(AuctionDetailsLoadState.Loading)
      } else {
        setAuctionDetailsLoadState(AuctionDetailsLoadState.Idle)
      }
    }
  }, [currentAuctionId, setAuctionDetails, setAuctionDetailsLoadState])

  // Update loading state when query is loading
  // Only set loading state if we don't have data yet (initial load)
  useEffect(() => {
    if (isAuctionLoading && !apiAuction) {
      setAuctionDetailsLoadState(AuctionDetailsLoadState.Loading)
    }
  }, [isAuctionLoading, apiAuction, setAuctionDetailsLoadState])

  // Handle successful auction data fetch
  useEffect(() => {
    if (!auctionData) {
      return
    }

    if (!apiAuction) {
      setAuctionDetails(null)
      setAuctionDetailsLoadState(AuctionDetailsLoadState.NotFound)
      return
    }

    // Merge auction data with token info
    // Cast the auction to AuctionDetails - the protobuf type has all required fields
    const baseAuctionDetails = apiAuction as unknown as AuctionDetails

    // Fallback clearingPrice to floorPrice if clearingPrice is 0 or missing
    // floorPrice is the fixed base price that defines the tick grid
    // clearingPrice is dynamic and may be 0 before any bids are placed
    const clearingPrice =
      baseAuctionDetails.clearingPrice && baseAuctionDetails.clearingPrice !== '0'
        ? baseAuctionDetails.clearingPrice
        : baseAuctionDetails.floorPrice

    // Use the token total supply from the API, falling back to the auction supply when absent
    const tokenTotalSupply = baseAuctionDetails.tokenTotalSupply ?? baseAuctionDetails.totalSupply

    // Logo precedence: config override (authoritative) -> creator-uploaded API image ->
    // indexed token logo -> TokenLogo placeholder. The override is resolved explicitly so it
    // wins over the API image, while the API image still beats the indexed logo.
    const overrideLogoUrl = baseAuctionDetails.tokenAddress
      ? getAuctionMetadata({
          chainId: baseAuctionDetails.chainId,
          tokenAddress: baseAuctionDetails.tokenAddress,
        })?.logoUrl
      : undefined
    const token = resolveAuctionTokenLogo({
      tokenInfo,
      overrideLogoUrl,
      tokenImageUrl: baseAuctionDetails.tokenImageUrl,
    })

    const auctionDetails: AuctionDetails = {
      ...baseAuctionDetails,
      clearingPrice,
      tokenTotalSupply,
      token,
      preBidEndBlock: computePreBidEndBlock(
        (apiAuction as unknown as { parsedAuctionSteps?: ParsedAuctionStepLike[] }).parsedAuctionSteps,
        baseAuctionDetails.startBlock,
      ),
    }

    setAuctionDetails(auctionDetails)
    setAuctionDetailsLoadState(AuctionDetailsLoadState.Success)
  }, [auctionData, apiAuction, tokenInfo, setAuctionDetails, setAuctionDetailsLoadState])

  // Handle auction fetch errors
  useEffect(() => {
    // If we have stale data (apiAuction exists), ignore the error and don't update UI state
    // This prevents the UI from flashing error state during transient polling failures
    if (!auctionError || apiAuction) {
      return
    }

    setAuctionDetails(null)
    setAuctionDetailsLoadState(AuctionDetailsLoadState.Error, auctionError.message)
  }, [auctionError, apiAuction, setAuctionDetails, setAuctionDetailsLoadState])
}
