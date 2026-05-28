import { BidTokenInfo } from '~/features/Toucan/Auction/store/types'
import { approximateNumberFromRaw, computeFdvBidTokenRaw } from '~/features/Toucan/Auction/utils/fixedPointFdv'
import { computeCompletedAuctionMarketFdvUsd } from '~/features/Toucan/utils/computeProjectedFdv'

interface ComputeCompletedAuctionValuationFiatParams {
  totalSupplyRaw: string
  auctionTokenDecimals: number
  clearingPriceQ96: string
  launchBidTokenPriceUsd: number | undefined
  bidTokenInfo: BidTokenInfo | undefined
  auctionTokenMarketPriceUsd: number | undefined
}

export function computeCompletedAuctionValuationFiat({
  totalSupplyRaw,
  auctionTokenDecimals,
  clearingPriceQ96,
  launchBidTokenPriceUsd,
  bidTokenInfo,
  auctionTokenMarketPriceUsd,
}: ComputeCompletedAuctionValuationFiatParams): number | undefined {
  if (bidTokenInfo && launchBidTokenPriceUsd !== undefined) {
    const valuationRaw = computeFdvBidTokenRaw({
      priceQ96: clearingPriceQ96,
      bidTokenDecimals: bidTokenInfo.decimals,
      totalSupplyRaw,
      auctionTokenDecimals,
    })

    const valuationBidTokenApprox = approximateNumberFromRaw({
      raw: valuationRaw,
      decimals: bidTokenInfo.decimals,
      significantDigits: 15,
    })

    return valuationBidTokenApprox * launchBidTokenPriceUsd
  }

  if (auctionTokenMarketPriceUsd !== undefined) {
    return computeCompletedAuctionMarketFdvUsd({
      totalSupplyRaw,
      auctionTokenDecimals,
      auctionTokenUsdPrice: auctionTokenMarketPriceUsd,
    })
  }

  return undefined
}

interface ComputeAuctionValuationFiatParams {
  totalSupplyRaw: string
  auctionTokenDecimals: number
  clearingPriceQ96: string
  isAuctionEnded: boolean
  launchBidTokenPriceUsd: number | undefined
  bidTokenInfo: BidTokenInfo | undefined
  bidTokenMarketPriceUsd: number | undefined
  auctionTokenMarketPriceUsd: number | undefined
}

export function computeAuctionValuationFiat({
  totalSupplyRaw,
  auctionTokenDecimals,
  clearingPriceQ96,
  isAuctionEnded,
  launchBidTokenPriceUsd,
  bidTokenInfo,
  bidTokenMarketPriceUsd,
  auctionTokenMarketPriceUsd,
}: ComputeAuctionValuationFiatParams): number | undefined {
  if (isAuctionEnded) {
    return computeCompletedAuctionValuationFiat({
      totalSupplyRaw,
      auctionTokenDecimals,
      clearingPriceQ96,
      launchBidTokenPriceUsd,
      bidTokenInfo,
      auctionTokenMarketPriceUsd,
    })
  }

  const bidTokenPriceUsd =
    bidTokenMarketPriceUsd ?? (bidTokenInfo?.priceFiat === 0 ? undefined : bidTokenInfo?.priceFiat)
  if (!bidTokenInfo || bidTokenPriceUsd === undefined) {
    return undefined
  }

  const valuationRaw = computeFdvBidTokenRaw({
    priceQ96: clearingPriceQ96,
    bidTokenDecimals: bidTokenInfo.decimals,
    totalSupplyRaw,
    auctionTokenDecimals,
  })

  const valuationBidTokenApprox = approximateNumberFromRaw({
    raw: valuationRaw,
    decimals: bidTokenInfo.decimals,
    significantDigits: 15,
  })

  return valuationBidTokenApprox * bidTokenPriceUsd
}
