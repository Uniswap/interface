import { useQuery } from '@tanstack/react-query'
import { GetAuctionRequest } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { useEffect, useMemo, useRef } from 'react'
import { auctionQueries } from 'uniswap/src/data/rest/auctions/auctionQueries'
import { EVMUniverseChainId, UniverseChainId } from 'uniswap/src/features/chains/types'
import { useAuctionTokenInfo } from '~/components/Toucan/Auction/hooks/useAuctionTokenInfo'
import { AuctionDetails, AuctionDetailsLoadState } from '~/components/Toucan/Auction/store/types'
import { useAuctionStoreActions } from '~/components/Toucan/Auction/store/useAuctionStore'
import { getTotalSupply } from '~/components/Toucan/Config/config'

type ParsedAuctionStep = {
  mps?: number | string
  startBlock?: string
  endBlock?: string
}

function computePreBidEndBlock(
  steps: ParsedAuctionStep[] | undefined,
  startBlock: string | undefined,
): string | undefined {
  if (!startBlock) {
    return undefined
  }

  if (!steps || steps.length === 0) {
    return startBlock
  }

  const hasMps = (step: ParsedAuctionStep) => {
    if (step.mps === undefined) {
      return false
    }
    const mpsNumber = typeof step.mps === 'string' ? Number(step.mps) : step.mps
    return Number.isFinite(mpsNumber) && mpsNumber > 0
  }

  if (hasMps(steps[0])) {
    return startBlock
  }

  const firstStepWithMps = steps.find(hasMps)
  return firstStepWithMps?.startBlock ?? startBlock
}

/**
 * Custom hook to load auction details from API and enrich with token information.
 * Manages the complete auction loading lifecycle including load states and error handling.
 *
 * Note: This hook fetches auction data once per session (no polling).
 * Live data like clearing price is polled via useLoadCheckpointData instead.
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

  // Fetch auction data from API (no polling - static data fetched once)
  // Live data like clearing price is polled via useLoadCheckpointData
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
      // No refetchInterval - auction details are static, checkpoint data handles live updates
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

    // Apply total supply override if configured for this auction
    const tokenTotalSupply = getTotalSupply({
      chainId: baseAuctionDetails.chainId,
      tokenAddress: baseAuctionDetails.tokenAddress,
      apiTotalSupply: baseAuctionDetails.tokenTotalSupply ?? baseAuctionDetails.totalSupply,
    })

    const auctionDetails: AuctionDetails = {
      ...baseAuctionDetails,
      clearingPrice,
      tokenTotalSupply,
      token: tokenInfo,
      preBidEndBlock: computePreBidEndBlock(
        (apiAuction as unknown as { parsedAuctionSteps?: ParsedAuctionStep[] }).parsedAuctionSteps,
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
