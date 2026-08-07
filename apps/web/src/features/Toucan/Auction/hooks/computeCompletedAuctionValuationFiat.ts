import { BidTokenInfo } from '~/features/Toucan/Auction/store/types'
import { approximateNumberFromRaw, computeFdvBidTokenRaw } from '~/features/Toucan/Auction/utils/fixedPointFdv'

interface ComputeCompletedAuctionValuationFiatParams {
  totalSupplyRaw: string
  auctionTokenDecimals: number
  clearingPriceQ96: string
  launchBidTokenPriceUsd: number | undefined
  bidTokenInfo: BidTokenInfo | undefined
}

// FDV at launch: final clearing-price valuation in bid tokens x launch-time bid token USD price.
// Never derived from the auction token's post-launch market price (LP-821).
export function computeCompletedAuctionValuationFiat({
  totalSupplyRaw,
  auctionTokenDecimals,
  clearingPriceQ96,
  launchBidTokenPriceUsd,
  bidTokenInfo,
}: ComputeCompletedAuctionValuationFiatParams): number | undefined {
  if (!bidTokenInfo || launchBidTokenPriceUsd === undefined) {
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

  return valuationBidTokenApprox * launchBidTokenPriceUsd
}
