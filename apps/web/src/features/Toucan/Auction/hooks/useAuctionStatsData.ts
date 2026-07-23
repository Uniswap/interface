import { useQuery } from '@tanstack/react-query'
import { TokenCountAllocatedToLpForAuctionRequest } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/auction_pb'
import { useMemo } from 'react'
import { AuctionQueryClient } from 'uniswap/src/data/apiClients/liquidityService/AuctionQueryClient'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { formatTokenPriceSubscript } from '~/features/Toucan/Auction/BidDistributionChart/utils/tokenFormatters'
import { useStatsBannerData } from '~/features/Toucan/Auction/hooks/useStatsBannerData'
import { BidTokenInfo } from '~/features/Toucan/Auction/store/types'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { formatCompactFromRaw } from '~/features/Toucan/Auction/utils/fixedPointFdv'
import { getAuctionTokenDecimals, mergeAuctionTokenMetadata } from '~/features/Toucan/Auction/utils/tokenMetadata'
import { AuctionMetadataOverride, getAuctionMetadata } from '~/features/Toucan/Config/config'
import { useBlockTimestamp } from '~/hooks/useBlockTimestamp'

interface AuctionStatsData {
  // Contract address (ERC20 token address)
  tokenAddress: string | undefined

  // Auction token symbol (e.g., "TCAN")
  auctionTokenSymbol: string | undefined

  // Auction start date
  launchedOnTimestamp: bigint | undefined
  isAuctionInFuture: boolean
  isAuctionEnded: boolean

  // Supply stats
  auctionSupply: string | null // Formatted auction supply (from auctionDetails.totalSupply - the amount being auctioned)
  totalSupply: string | null // Formatted total supply (from auctionDetails.tokenTotalSupply - token circulating supply)

  // Bid stats
  totalBidCount: number | null // From checkpoint data
  totalCurrencyRaisedFormatted: string | null // Formatted currency raised from checkpoint (currencyRaised)
  requiredCurrencyFormatted: string | null // Amount needed to graduate (e.g., "10k ETH required")

  // Implied token price (concentration band range)
  // start: "0.041589 ETH", end: "0.042626 ETH" (range during auction)
  // start: "0.041589 ETH", end: undefined (single price when auction ended)
  impliedTokenPrice: { start: string; end?: string } | null

  // Percent of the full token supply committed to LP
  percentCommittedToLpFormatted: string | null

  // Loading state
  isLoading: boolean
  hasData: boolean

  // Project metadata (from config overrides)
  metadata: AuctionMetadataOverride | undefined
}

/**
 * Formats a decimal tick value as bid token amount with subscript notation for small values.
 * Uses formatTokenPriceSubscript for consistent subscript formatting.
 */
function formatTickAsBidToken({ tickValue, bidTokenInfo }: { tickValue: number; bidTokenInfo: BidTokenInfo }): string {
  const { text } = formatTokenPriceSubscript(tickValue, { minSigDigits: 2, maxSigDigits: 4 })
  return `${text} ${bidTokenInfo.symbol}`
}

/**
 * Hook that computes all data needed for the AuctionStats component.
 *
 * This hook:
 * - Gets auction address from store
 * - Calculates auction start timestamp using useBlockTimestamp
 * - Gets total bid count from checkpoint data
 * - Gets supply stats from auction details
 * - Formats implied token price from concentration band
 *
 * Note: Reuses computed values from useStatsBannerData to avoid duplication.
 */
export function useAuctionStatsData(): AuctionStatsData {
  const { formatPercent } = useLocalizationContext()

  // Reuse computed values from useStatsBannerData
  const {
    clearingPriceDecimal,
    concentrationStartDecimal,
    concentrationEndDecimal,
    bidTokenInfo,
    currencyRaisedFormatted: totalCurrencyRaisedFormatted,
    requiredCurrencyFormatted,
    isLoading: statsBannerLoading,
    isAuctionEnded,
    isAuctionNotStarted,
  } = useStatsBannerData()

  // Get auction data from store (only what's unique to this hook)
  const { auctionDetails, checkpointData } = useAuctionStore((state) => ({
    auctionDetails: state.auctionDetails,
    checkpointData: state.checkpointData,
  }))

  // Get the ERC20 token address and symbol from auction details
  const tokenAddress = auctionDetails?.tokenAddress
  const auctionTokenSymbol = auctionDetails?.token?.currency.symbol

  const { data: lpAllocationResponse } = useQuery({
    queryKey: [
      ReactQueryCacheKey.LiquidityService,
      'tokenCountAllocatedToLpForAuction',
      auctionDetails?.address,
      auctionDetails?.chainId,
    ],
    queryFn: async () =>
      AuctionQueryClient.tokenCountAllocatedToLpForAuction(
        new TokenCountAllocatedToLpForAuctionRequest({
          auctionContractAddress: auctionDetails!.address.toLowerCase(),
          chainId: Number(auctionDetails!.chainId),
        }),
      ),
    enabled: Boolean(auctionDetails?.address && auctionDetails.chainId),
  })

  const percentCommittedToLpFormatted = useMemo(() => {
    // Denominator is the FULL token supply (tokenTotalSupply), not the auctioned slice
    // (totalSupply) — the LP allocation is drawn from the full supply, so dividing by the
    // slice overflows past 100%. tokenTotalSupply is optional (null on an RPC error).
    const tokenTotalSupplyRaw = auctionDetails?.tokenTotalSupply
    if (lpAllocationResponse?.tokenCountAllocatedToLp == null || tokenTotalSupplyRaw == null) {
      return null
    }

    try {
      const lpTokenCount = BigInt(lpAllocationResponse.tokenCountAllocatedToLp)
      const tokenTotalSupply = BigInt(tokenTotalSupplyRaw)

      if (tokenTotalSupply === 0n) {
        return null
      }

      // Round to whole percent for display
      const percentRounded = (lpTokenCount * 100n + tokenTotalSupply / 2n) / tokenTotalSupply
      return formatPercent(Number(percentRounded), 1)
    } catch {
      return null
    }
  }, [auctionDetails?.tokenTotalSupply, formatPercent, lpAllocationResponse?.tokenCountAllocatedToLp])

  // Get auction start block timestamp
  const auctionStartBlockNumber = auctionDetails?.startBlock ? Number(auctionDetails.startBlock) : undefined
  const launchedOnTimestamp = useBlockTimestamp({
    chainId: auctionDetails?.chainId,
    blockNumber: auctionStartBlockNumber,
  })

  // Get total bid count from checkpoint data
  const totalBidCount = checkpointData?.totalBidCount ?? null

  const auctionTokenDecimals = getAuctionTokenDecimals(auctionDetails?.token)

  // Format auction supply (uses totalSupply - the amount being auctioned)
  const auctionSupply = useMemo(() => {
    const auctionSupplyRaw = auctionDetails?.totalSupply

    if (!auctionSupplyRaw || auctionTokenDecimals === undefined) {
      return null
    }

    return formatCompactFromRaw({
      raw: BigInt(auctionSupplyRaw),
      decimals: auctionTokenDecimals,
      maxFractionDigits: 2,
    })
  }, [auctionDetails?.totalSupply, auctionTokenDecimals])

  // Format total supply (uses tokenTotalSupply - the total circulating supply of the token)
  const totalSupply = useMemo(() => {
    const tokenTotalSupplyRaw = auctionDetails?.tokenTotalSupply

    if (!tokenTotalSupplyRaw || auctionTokenDecimals === undefined) {
      return null
    }

    return formatCompactFromRaw({
      raw: BigInt(tokenTotalSupplyRaw),
      decimals: auctionTokenDecimals,
      maxFractionDigits: 2,
    })
  }, [auctionDetails?.tokenTotalSupply, auctionTokenDecimals])

  // Format implied token price from concentration band (same as "Bids concentrated at" in AuctionStatsBanner)
  // Uses formatTickAsBidToken for subscript notation on small values (e.g., 0.0₄15)
  // Returns structured data: { start: string, end?: string } for flexible rendering
  const impliedTokenPrice = useMemo(() => {
    if (!bidTokenInfo || auctionTokenDecimals === undefined) {
      return null
    }

    if (isAuctionEnded || concentrationStartDecimal === null || concentrationEndDecimal === null) {
      // Format clearingPriceDecimal with subscript notation - single price (no end)
      const { text } = formatTokenPriceSubscript(clearingPriceDecimal, {
        minSigDigits: 2,
        maxSigDigits: 4,
      })
      return { start: `${text} ${bidTokenInfo.symbol}` }
    }

    const startFormatted = formatTickAsBidToken({
      tickValue: concentrationStartDecimal,
      bidTokenInfo,
    })
    const endFormatted = formatTickAsBidToken({
      tickValue: concentrationEndDecimal,
      bidTokenInfo,
    })

    return { start: startFormatted, end: endFormatted }
  }, [
    concentrationStartDecimal,
    concentrationEndDecimal,
    bidTokenInfo,
    isAuctionEnded,
    clearingPriceDecimal,
    auctionTokenDecimals,
  ])

  // Get project metadata from config overrides, filled in with the launched-token
  // metadata returned by the auction API (description / X handle). Overrides win.
  const metadata = useMemo(() => {
    if (!auctionDetails) {
      return undefined
    }
    const override = getAuctionMetadata({
      chainId: auctionDetails.chainId,
      tokenAddress: auctionDetails.tokenAddress,
    })
    return mergeAuctionTokenMetadata({
      override,
      tokenDescription: auctionDetails.tokenDescription,
      xHandle: auctionDetails.xHandle,
    })
  }, [auctionDetails])

  // Determine loading state
  const isLoading = statsBannerLoading || !auctionDetails
  const hasData = !isLoading && !isAuctionNotStarted

  return {
    tokenAddress,
    auctionTokenSymbol,
    launchedOnTimestamp,
    isAuctionInFuture: isAuctionNotStarted,
    isAuctionEnded,
    auctionSupply,
    totalSupply,
    totalBidCount,
    totalCurrencyRaisedFormatted,
    requiredCurrencyFormatted,
    impliedTokenPrice,
    percentCommittedToLpFormatted,
    isLoading,
    hasData,
    metadata,
  }
}
