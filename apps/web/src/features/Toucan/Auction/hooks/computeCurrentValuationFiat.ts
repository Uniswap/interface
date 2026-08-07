import { FiatNumberType, NumberType } from 'utilities/src/format/types'
import { computeCompletedAuctionValuationFiat } from '~/features/Toucan/Auction/hooks/computeCompletedAuctionValuationFiat'
import { BidTokenInfo, AuctionProgressState } from '~/features/Toucan/Auction/store/types'
import { approximateNumberFromRaw, computeFdvBidTokenRaw } from '~/features/Toucan/Auction/utils/fixedPointFdv'

interface ComputeCurrentValuationFiatParams {
  totalSupplyRaw: string
  auctionTokenDecimals: number
  clearingPriceQ96: string
  bidTokenInfo: BidTokenInfo | undefined
  bidTokenPriceUsd: number | undefined
}

export function computeCurrentValuationFiat({
  totalSupplyRaw,
  auctionTokenDecimals,
  clearingPriceQ96,
  bidTokenInfo,
  bidTokenPriceUsd,
}: ComputeCurrentValuationFiatParams): number | undefined {
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

interface ConvertToStatsFiatParams {
  valuationUsd: number | undefined
  convertFiatAmountFormatted: (fromAmount: string | number | null | undefined, numberType: FiatNumberType) => string
}

function convertToStatsFiat({
  valuationUsd,
  convertFiatAmountFormatted,
}: ConvertToStatsFiatParams): string | undefined {
  if (valuationUsd === undefined) {
    return undefined
  }

  return convertFiatAmountFormatted(valuationUsd, NumberType.FiatTokenStats)
}

interface ComputeCurrentValuationFiatFormattedParams {
  totalSupplyRaw: string
  auctionProgressState: AuctionProgressState
  auctionTokenDecimals: number | undefined
  clearingPriceQ96: string
  launchBidTokenPriceUsdRaw: string | undefined
  bidTokenInfo: BidTokenInfo | undefined
  bidTokenMarketPriceUsd: number | undefined
  convertFiatAmountFormatted: (fromAmount: string | number | null | undefined, numberType: FiatNumberType) => string
}

// Ended auctions stay on the launch valuation basis (see computeCompletedAuctionValuationFiat),
// falling back to the current bid token price on that same valuation, so the fiat line can never
// contradict the bid-token line (LP-821).
export function computeCurrentValuationUsd({
  totalSupplyRaw,
  auctionProgressState,
  auctionTokenDecimals,
  clearingPriceQ96,
  launchBidTokenPriceUsdRaw,
  bidTokenInfo,
  bidTokenMarketPriceUsd,
}: Omit<ComputeCurrentValuationFiatFormattedParams, 'convertFiatAmountFormatted'>): number | undefined {
  if (!totalSupplyRaw || totalSupplyRaw === '0' || auctionTokenDecimals === undefined) {
    return undefined
  }

  const launchBidTokenPriceUsd = launchBidTokenPriceUsdRaw ? Number(launchBidTokenPriceUsdRaw) : undefined

  if (auctionProgressState === AuctionProgressState.ENDED) {
    const completedAuctionValuation = computeCompletedAuctionValuationFiat({
      totalSupplyRaw,
      auctionTokenDecimals,
      clearingPriceQ96,
      launchBidTokenPriceUsd,
      bidTokenInfo,
    })
    if (completedAuctionValuation !== undefined) {
      return completedAuctionValuation
    }
  }

  const bidTokenPriceUsd =
    bidTokenMarketPriceUsd ?? (bidTokenInfo?.priceFiat === 0 ? undefined : bidTokenInfo?.priceFiat)
  return computeCurrentValuationFiat({
    totalSupplyRaw,
    auctionTokenDecimals,
    clearingPriceQ96,
    bidTokenInfo,
    bidTokenPriceUsd,
  })
}

export function computeCurrentValuationFiatFormatted(params: ComputeCurrentValuationFiatFormattedParams): string {
  return (
    convertToStatsFiat({
      valuationUsd: computeCurrentValuationUsd(params),
      convertFiatAmountFormatted: params.convertFiatAmountFormatted,
    }) ?? '--'
  )
}
