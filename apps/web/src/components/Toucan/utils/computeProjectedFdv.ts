import {
  approximateNumberFromRaw,
  computeFdvBidTokenRaw,
  formatCompactFromRaw,
} from '~/components/Toucan/Auction/utils/fixedPointFdv'
import type { EnrichedAuction } from '~/state/explore/topAuctions/useTopAuctions'

export interface ProjectedFdvTableValue {
  raw: bigint // Raw FDV in bid token for computation
  usd?: number // USD value for sorting/display
  formattedBidToken: string // Formatted bid token (e.g., "1.5K ETH")
}

/**
 * Computes completed-auction FDV in USD using market token price.
 * Returns undefined if required inputs are unavailable.
 */
export function computeCompletedAuctionMarketFdvUsd({
  totalSupplyRaw,
  auctionTokenDecimals,
  auctionTokenUsdPrice,
}: {
  totalSupplyRaw: string
  auctionTokenDecimals: number | undefined
  auctionTokenUsdPrice: number | undefined
}): number | undefined {
  if (auctionTokenUsdPrice === undefined || auctionTokenDecimals === undefined) {
    return undefined
  }

  const totalSupplyDecimal = approximateNumberFromRaw({ raw: BigInt(totalSupplyRaw), decimals: auctionTokenDecimals })
  return totalSupplyDecimal * auctionTokenUsdPrice
}

/**
 * Computes all projected FDV values for table display:
 * - Raw bigint for precise calculations
 * - USD value for sorting and primary display
 * - Formatted strings for both USD and bid token
 *
 * For completed auctions, uses the actual auction token market price when available,
 * falling back to clearing price if not.
 */
export function computeProjectedFdvTableValue({
  auction,
  auctionTokenUsdPrice,
}: {
  auction: EnrichedAuction
  /** USD price of the auction token from market data */
  auctionTokenUsdPrice?: number
}): ProjectedFdvTableValue {
  const fallback: ProjectedFdvTableValue = {
    raw: 0n,
    usd: undefined,
    formattedBidToken: '—',
  }

  const bidTokenDecimals = auction.auction?.currencyTokenDecimals
  const bidTokenSymbol = auction.auction?.currencyTokenSymbol

  try {
    if (!auction.auction) {
      return fallback
    }

    const totalSupply = auction.auction.tokenTotalSupply ?? auction.auction.totalSupply

    if (!totalSupply) {
      return fallback
    }

    // For completed auctions, prefer the actual market price over clearing price
    if (auction.timeRemaining.isCompleted && auctionTokenUsdPrice !== undefined) {
      const usd = computeCompletedAuctionMarketFdvUsd({
        totalSupplyRaw: totalSupply,
        auctionTokenDecimals: auction.auction.tokenDecimals,
        auctionTokenUsdPrice,
      })

      if (usd === undefined) {
        return fallback
      }

      return {
        raw: 0n, // Not meaningful when using direct USD calculation
        usd,
        formattedBidToken: '—', // USD display will be used instead
      }
    }

    // For active auctions (or completed without market price), use clearing price
    if (!bidTokenDecimals || !bidTokenSymbol) {
      return fallback
    }

    const priceQ96 = auction.auction.clearingPrice !== '0' ? auction.auction.clearingPrice : auction.auction.floorPrice

    if (priceQ96 === '0') {
      return fallback
    }

    // Compute raw FDV in bid token units
    const raw = computeFdvBidTokenRaw({
      priceQ96,
      bidTokenDecimals,
      totalSupplyRaw: totalSupply,
      auctionTokenDecimals: auction.auction.tokenDecimals,
    })

    // Convert to USD
    const usd =
      auction.auction.currencyPriceUsd !== undefined
        ? approximateNumberFromRaw({ raw, decimals: bidTokenDecimals }) * Number(auction.auction.currencyPriceUsd)
        : undefined

    // Format bid token value
    const formattedAmount = formatCompactFromRaw({
      raw,
      decimals: bidTokenDecimals,
    })
    const formattedBidToken = `${formattedAmount} ${bidTokenSymbol}`

    return {
      raw,
      usd,
      formattedBidToken,
    }
  } catch (_error) {
    return fallback
  }
}
