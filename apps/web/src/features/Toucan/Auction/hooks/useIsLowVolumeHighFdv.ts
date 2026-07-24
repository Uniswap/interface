import { PlainMessage } from '@bufbuild/protobuf'
import { Checkpoint } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { useMemo } from 'react'
import { computeCurrentValuationUsd } from '~/features/Toucan/Auction/hooks/computeCurrentValuationFiat'
import { AuctionDetails, AuctionProgressState, BidTokenInfo } from '~/features/Toucan/Auction/store/types'
import { approximateNumberFromRaw } from '~/features/Toucan/Auction/utils/fixedPointFdv'
import {
  isLowEngagementHighFdvAuction,
  useAuctionFdvWarningThresholds,
} from '~/features/Toucan/utils/auctionFdvWarning'

interface UseIsLowVolumeHighFdvParams {
  auctionDetails: AuctionDetails | null
  effectiveCheckpoint: PlainMessage<Checkpoint> | null
  totalSupply: string
  auctionProgressState: AuctionProgressState
  auctionTokenDecimals: number | undefined
  clearingPriceQ96: string
  bidTokenInfo: BidTokenInfo | undefined
  auctionTokenMarketPriceUsd: number | undefined
  bidTokenMarketPriceUsd: number | undefined
}

// True when the auction has low committed volume / few bids paired with a high FDV.
export function useIsLowVolumeHighFdv({
  auctionDetails,
  effectiveCheckpoint,
  totalSupply,
  auctionProgressState,
  auctionTokenDecimals,
  clearingPriceQ96,
  bidTokenInfo,
  auctionTokenMarketPriceUsd,
  bidTokenMarketPriceUsd,
}: UseIsLowVolumeHighFdvParams): boolean {
  const fdvWarningThresholds = useAuctionFdvWarningThresholds()

  const currentValuationUsd = useMemo(
    () =>
      computeCurrentValuationUsd({
        totalSupplyRaw: totalSupply,
        auctionProgressState,
        auctionTokenDecimals,
        clearingPriceQ96,
        launchBidTokenPriceUsdRaw: auctionDetails?.currencyPriceUsd,
        bidTokenInfo,
        auctionTokenMarketPriceUsd,
        bidTokenMarketPriceUsd,
      }),
    [
      auctionDetails?.currencyPriceUsd,
      auctionProgressState,
      auctionTokenDecimals,
      auctionTokenMarketPriceUsd,
      bidTokenInfo,
      bidTokenMarketPriceUsd,
      clearingPriceQ96,
      totalSupply,
    ],
  )

  const committedVolumeUsd = useMemo(() => {
    const raw = auctionDetails?.totalBidVolume
    if (!raw || !bidTokenInfo || !bidTokenMarketPriceUsd) {
      return undefined
    }
    return (
      approximateNumberFromRaw({ raw: BigInt(raw), decimals: bidTokenInfo.decimals, significantDigits: 15 }) *
      bidTokenMarketPriceUsd
    )
  }, [auctionDetails?.totalBidVolume, bidTokenInfo, bidTokenMarketPriceUsd])

  return isLowEngagementHighFdvAuction(
    { committedVolumeUsd, bidCount: effectiveCheckpoint?.totalBidCount, fdvUsd: currentValuationUsd },
    fdvWarningThresholds,
  )
}
