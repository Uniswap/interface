import type { Checkpoint } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { useMemo } from 'react'
import { FiatNumberType } from 'utilities/src/format/types'
import { AuctionDetails, BidDistributionData, BidTokenInfo } from '~/features/Toucan/Auction/store/types'
import {
  CommittedVolumeBreakdown,
  computeCommittedVolumeBreakdown,
} from '~/features/Toucan/Auction/utils/computeCommittedVolumeBreakdown'

interface UseCommittedVolumeBreakdownParams {
  bidDistributionData: BidDistributionData | null
  clearingPriceQ96: string | undefined
  checkpoint: Checkpoint | null
  auctionDetails: AuctionDetails | null
  bidTokenInfo: BidTokenInfo | undefined
  bidTokenMarketPriceUsd: number | undefined
  convertFiatAmountFormatted: (fromAmount: Maybe<number | string>, numberType: FiatNumberType) => string
}

export function useCommittedVolumeBreakdown({
  bidDistributionData,
  clearingPriceQ96,
  checkpoint,
  auctionDetails,
  bidTokenInfo,
  bidTokenMarketPriceUsd,
  convertFiatAmountFormatted,
}: UseCommittedVolumeBreakdownParams): CommittedVolumeBreakdown | null {
  const filledRaw = checkpoint?.currencyRaised
  const totalRaw = auctionDetails?.totalBidVolume
  const requiredRaw = auctionDetails?.requiredCurrencyRaised

  return useMemo(
    () =>
      computeCommittedVolumeBreakdown({
        bidDistributionData,
        clearingPriceQ96,
        filledRaw,
        totalRaw,
        requiredRaw,
        bidTokenInfo,
        bidTokenMarketPriceUsd,
        convertFiatAmountFormatted,
      }),
    [
      bidDistributionData,
      clearingPriceQ96,
      filledRaw,
      totalRaw,
      requiredRaw,
      bidTokenInfo,
      bidTokenMarketPriceUsd,
      convertFiatAmountFormatted,
    ],
  )
}
