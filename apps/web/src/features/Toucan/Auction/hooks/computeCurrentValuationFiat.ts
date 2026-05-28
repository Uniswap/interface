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
  auctionTokenDecimals: number
  clearingPriceQ96: string
  launchBidTokenPriceUsdRaw: string | undefined
  bidTokenInfo: BidTokenInfo | undefined
  auctionTokenMarketPriceUsd: number | undefined
  bidTokenMarketPriceUsd: number | undefined
  convertFiatAmountFormatted: (fromAmount: string | number | null | undefined, numberType: FiatNumberType) => string
}

export function computeCurrentValuationFiatFormatted({
  totalSupplyRaw,
  auctionProgressState,
  auctionTokenDecimals,
  clearingPriceQ96,
  launchBidTokenPriceUsdRaw,
  bidTokenInfo,
  auctionTokenMarketPriceUsd,
  bidTokenMarketPriceUsd,
  convertFiatAmountFormatted,
}: ComputeCurrentValuationFiatFormattedParams): string {
  if (!totalSupplyRaw || totalSupplyRaw === '0') {
    return '--'
  }

  const launchBidTokenPriceUsd = launchBidTokenPriceUsdRaw ? Number(launchBidTokenPriceUsdRaw) : undefined

  if (auctionProgressState === AuctionProgressState.ENDED) {
    const completedAuctionValuation = computeCompletedAuctionValuationFiat({
      totalSupplyRaw,
      auctionTokenDecimals,
      clearingPriceQ96,
      launchBidTokenPriceUsd,
      bidTokenInfo,
      auctionTokenMarketPriceUsd,
    })
    const completedAuctionFormatted = convertToStatsFiat({
      valuationUsd: completedAuctionValuation,
      convertFiatAmountFormatted,
    })

    if (completedAuctionFormatted) {
      return completedAuctionFormatted
    }
  }

  const bidTokenPriceUsd =
    bidTokenMarketPriceUsd ?? (bidTokenInfo?.priceFiat === 0 ? undefined : bidTokenInfo?.priceFiat)
  const currentValuation = computeCurrentValuationFiat({
    totalSupplyRaw,
    auctionTokenDecimals,
    clearingPriceQ96,
    bidTokenInfo,
    bidTokenPriceUsd,
  })
  const currentValuationFormatted = convertToStatsFiat({
    valuationUsd: currentValuation,
    convertFiatAmountFormatted,
  })

  return currentValuationFormatted ?? '--'
}
