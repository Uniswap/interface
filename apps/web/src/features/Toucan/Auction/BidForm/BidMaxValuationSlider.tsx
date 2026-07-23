import { memo, useMemo } from 'react'
import { useAuctionTokenColor } from '~/features/Toucan/Auction/hooks/useAuctionTokenColor'
import { useBidTokenInfo } from '~/features/Toucan/Auction/hooks/useBidTokenInfo'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { getClearingPrice } from '~/features/Toucan/Auction/utils/clearingPrice'
import { getAuctionTokenDecimals } from '~/features/Toucan/Auction/utils/tokenMetadata'
import { ValuationInputType, ValuationSlider } from '~/features/Toucan/Shared/ValuationSlider'

interface BidMaxValuationSliderProps {
  valueQ96: bigint | undefined
  onChangeQ96: (q96: bigint) => void
  bidTokenDecimals?: number
  bidTokenSymbol: string
  tokenColor?: string
  disabled?: boolean
  onInteractionStart?: () => void
  inputType?: ValuationInputType
}

function BidMaxValuationSliderComponent({
  valueQ96,
  onChangeQ96,
  bidTokenDecimals,
  bidTokenSymbol,
  tokenColor,
  disabled,
  onInteractionStart,
  inputType,
}: BidMaxValuationSliderProps): JSX.Element | null {
  const { auctionDetails, checkpointData, tickGrouping, groupTicksEnabled } = useAuctionStore((state) => ({
    auctionDetails: state.auctionDetails,
    checkpointData: state.checkpointData,
    tickGrouping: state.tickGrouping,
    groupTicksEnabled: state.groupTicksEnabled,
  }))

  const { bidTokenInfo } = useBidTokenInfo({
    bidTokenAddress: auctionDetails?.currency,
    chainId: auctionDetails?.chainId,
  })

  const clearingPriceString = getClearingPrice(checkpointData, auctionDetails)
  const clearingPriceQ96 = useMemo(
    () => (clearingPriceString !== '0' ? BigInt(clearingPriceString) : undefined),
    [clearingPriceString],
  )
  const floorPriceQ96 = useMemo(
    () => (auctionDetails?.floorPrice ? BigInt(auctionDetails.floorPrice) : undefined),
    [auctionDetails?.floorPrice],
  )
  const tickSizeQ96 = useMemo(
    () => (auctionDetails?.tickSize ? BigInt(auctionDetails.tickSize) : undefined),
    [auctionDetails?.tickSize],
  )

  const { effectiveTokenColor, tokenColorLoading } = useAuctionTokenColor()

  return (
    <ValuationSlider
      valueQ96={valueQ96}
      onChangeQ96={onChangeQ96}
      bidTokenDecimals={bidTokenDecimals}
      bidTokenSymbol={bidTokenSymbol}
      tokenColor={tokenColor ?? effectiveTokenColor}
      disabled={disabled}
      onInteractionStart={onInteractionStart}
      clearingPriceQ96={clearingPriceQ96}
      floorPriceQ96={floorPriceQ96}
      tickSizeQ96={tickSizeQ96}
      auctionTokenDecimals={getAuctionTokenDecimals(auctionDetails?.token)}
      tokenTotalSupply={auctionDetails?.tokenTotalSupply}
      bidTokenPriceFiat={bidTokenInfo?.priceFiat}
      tickGrouping={tickGrouping}
      groupTicksEnabled={groupTicksEnabled}
      tokenColorLoading={tokenColorLoading}
      inputType={inputType}
    />
  )
}

export const BidMaxValuationSlider = memo(BidMaxValuationSliderComponent)
