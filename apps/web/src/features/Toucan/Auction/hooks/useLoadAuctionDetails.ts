import { useQuery } from '@tanstack/react-query'
import { GetAuctionRequest } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { UniverseChainId, EVMUniverseChainId, AddressStringFormat, normalizeAddress } from '@universe/chains'
import { useEffect, useMemo, useRef } from 'react'
import { auctionQueries } from 'uniswap/src/data/apiClients/dataApiService/auctions/auctionQueries'
import { logger } from 'utilities/src/logger/logger'
import { useAuctionTokenInfo } from '~/features/Toucan/Auction/hooks/useAuctionTokenInfo'
import { AuctionDetails, AuctionDetailsLoadState } from '~/features/Toucan/Auction/store/types'
import { useAuctionStoreActions } from '~/features/Toucan/Auction/store/useAuctionStore'
import {
  logAuctionDetailsErrorOnce,
  logMissingTokenTotalSupplyOnce,
} from '~/features/Toucan/Auction/utils/auctionDetailsLogGuards'
import { computePreBidEndBlock, ParsedAuctionStepLike } from '~/features/Toucan/Auction/utils/emissionStartBlock'
import { resolveAuctionTokenLogo } from '~/features/Toucan/Auction/utils/tokenMetadata'
import { hasTokenTotalSupply } from '~/features/Toucan/Auction/utils/tokenTotalSupply'
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
    errorUpdateCount,
    isLoading: isAuctionLoading,
  } = useQuery(
    auctionQueries.getAuction({
      params: new GetAuctionRequest({
        chainId,
        address: auctionAddress ? normalizeAddress(auctionAddress, AddressStringFormat.Lowercase) : undefined,
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
      token,
      preBidEndBlock: computePreBidEndBlock(
        (apiAuction as unknown as { parsedAuctionSteps?: ParsedAuctionStepLike[] }).parsedAuctionSteps,
        baseAuctionDetails.startBlock,
      ),
    }

    setAuctionDetails(auctionDetails)
    setAuctionDetailsLoadState(AuctionDetailsLoadState.Success)

    // `tokenTotalSupply` is the token's entire supply, while `totalSupply` is only the slice
    // deposited into the auction contract.
    logMissingTokenTotalSupplyOnce({
      keyParts: [chainId, auctionAddress],
      isTerminal: !hasTokenTotalSupply(baseAuctionDetails.tokenTotalSupply),
      log: () => {
        logger.warn('useLoadAuctionDetails.ts', 'useLoadAuctionDetails', 'Auction is missing tokenTotalSupply', {
          chainId,
          auctionAddress,
          tokenAddress: baseAuctionDetails.tokenAddress,
          tokenTotalSupply: baseAuctionDetails.tokenTotalSupply,
        })
      },
    })
  }, [auctionData, apiAuction, tokenInfo, chainId, auctionAddress, setAuctionDetails, setAuctionDetailsLoadState])

  // Handle auction fetch errors
  useEffect(() => {
    // If we have stale data (apiAuction exists), ignore the error and don't update UI state
    // This prevents the UI from flashing error state during transient polling failures
    if (!auctionError || apiAuction) {
      return
    }

    setAuctionDetails(null)
    setAuctionDetailsLoadState(AuctionDetailsLoadState.Error, auctionError.message)

    // This is the root stall, and until now nothing reported it. Without auction details there are
    // no start/end blocks, so `computeAuctionProgress` cannot even reach ENDED: the outcome stays
    // UNKNOWN, the launched banner holds its skeleton, and the checkpoint diagnostics stay silent by
    // design because their ENDED gate is unreachable. Reporting it there would name the symptom;
    // this names the cause — GetAuction never resolved for this address.
    //
    // Gated on a *second* settled failure, because "no data in hand" is not the same as terminal.
    // The `apiAuction` early return only establishes that nothing has arrived yet — on first mount
    // there has never been a success to retain, so a transient failure that exhausts its retries
    // reaches here, reports a permanent stall, and consumes the once-per-session key. The next poll
    // recovers and the genuinely permanent failure later in the session is then silent.
    //
    // `errorUpdateCount` is incremented by query-core's "error" action, which fires once per *fetch*
    // after retries are exhausted (`failureCount` is the per-attempt counter). So `> 1` means the
    // failure survived a full retry cycle and a subsequent poll — independent of the retry constant.
    logAuctionDetailsErrorOnce({
      keyParts: [chainId, auctionAddress],
      isTerminal: errorUpdateCount > 1,
      log: () => {
        // Stable message — Datadog error tracking counts occurrences of this exact string. The
        // underlying query error rides on `cause` so its stack survives the rewrap.
        const detailsError = new Error('Failed to load auction details', { cause: auctionError })
        logger.error(detailsError, {
          tags: { file: 'useLoadAuctionDetails.ts', function: 'useLoadAuctionDetails' },
          extra: { chainId, auctionAddress, error: auctionError.message },
        })
      },
    })
  }, [
    auctionError,
    apiAuction,
    chainId,
    auctionAddress,
    errorUpdateCount,
    setAuctionDetails,
    setAuctionDetailsLoadState,
  ])
}
