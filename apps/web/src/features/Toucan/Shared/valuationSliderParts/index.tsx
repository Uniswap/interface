import { memo, useMemo } from 'react'
import { Q96, q96ToPriceString } from '~/features/Toucan/Auction/BidDistributionChart/utils/q96'
import { approximateNumberFromRaw, computeFdvBidTokenRaw } from '~/features/Toucan/Auction/utils/fixedPointFdv'
import type { ValuationSliderProps } from '~/features/Toucan/Shared/valuationSliderParts/types'
import { ValuationInputType } from '~/features/Toucan/Shared/valuationSliderParts/types'
import { useValuationSlider } from '~/features/Toucan/Shared/valuationSliderParts/useValuationSlider'
import { ValuationSliderV1 } from '~/features/Toucan/Shared/valuationSliderParts/ValuationSliderV1'
import { ValuationSliderV2 } from '~/features/Toucan/Shared/valuationSliderParts/ValuationSliderV2'

// When the clearing-price FDV is below these thresholds,
// expand the slider range to the target FDV instead of the default MAX_PERCENTAGE multiple.
const LOW_FDV_THRESHOLD_USD = 10_000
const LOW_FDV_TARGET_USD = 1_000_000
// Fallback thresholds in bid-token units (e.g., ETH) when fiat price is unavailable
const LOW_FDV_THRESHOLD_BID_TOKEN = 10n
const LOW_FDV_TARGET_BID_TOKEN = 1n

function ValuationSliderComponent({
  valueQ96,
  onChangeQ96,
  bidTokenDecimals,
  bidTokenSymbol,
  tokenColor,
  disabled,
  onInteractionStart,
  clearingPriceQ96,
  floorPriceQ96,
  tickSizeQ96,
  auctionTokenDecimals,
  tokenTotalSupply,
  bidTokenPriceFiat,
  tickGrouping,
  groupTicksEnabled,
  tokenColorLoading,
  inputType = ValuationInputType.TokenPrice,
}: ValuationSliderProps): JSX.Element | null {
  // Compute a dynamic max price for the slider when the clearing-price FDV is very low.
  // If FDV < $10K (or < 10 bid tokens when fiat is unavailable), expand the
  // slider upper bound to the price implying $1M FDV (or 1 bid token).
  const maxSliderPriceQ96 = useMemo(() => {
    if (
      !clearingPriceQ96 ||
      !tokenTotalSupply ||
      bidTokenDecimals === undefined ||
      auctionTokenDecimals === undefined
    ) {
      return undefined
    }

    const supplyRaw = BigInt(tokenTotalSupply)
    if (supplyRaw === 0n) {
      return undefined
    }

    const fdvRaw = computeFdvBidTokenRaw({
      priceQ96: clearingPriceQ96,
      totalSupplyRaw: supplyRaw,
      auctionTokenDecimals,
    })

    const bidTokenScale = 10n ** BigInt(bidTokenDecimals)
    let targetFdvRaw: bigint | undefined

    if (bidTokenPriceFiat && bidTokenPriceFiat > 0) {
      // USD path
      const fdvBidToken = approximateNumberFromRaw({ raw: fdvRaw, decimals: bidTokenDecimals })
      const fdvUsd = fdvBidToken * bidTokenPriceFiat
      if (fdvUsd < LOW_FDV_THRESHOLD_USD) {
        const targetBidToken = LOW_FDV_TARGET_USD / bidTokenPriceFiat
        targetFdvRaw = BigInt(Math.ceil(targetBidToken)) * bidTokenScale
      }
    } else {
      // Fallback: bid-token-denominated thresholds (works without fiat price)
      if (fdvRaw < LOW_FDV_THRESHOLD_BID_TOKEN * bidTokenScale) {
        targetFdvRaw = LOW_FDV_TARGET_BID_TOKEN * bidTokenScale
      }
    }

    if (!targetFdvRaw) {
      return undefined // use default MAX_PERCENTAGE range
    }

    // targetPriceQ96 = targetFdvRaw * Q96 / totalSupplyRaw
    return (targetFdvRaw * Q96 + supplyRaw / 2n) / supplyRaw
  }, [clearingPriceQ96, tokenTotalSupply, bidTokenPriceFiat, bidTokenDecimals, auctionTokenDecimals])

  const {
    totalTicks,
    clampedSliderIndex,
    progress,
    handlePointerDown,
    handleTickValueChange,
    minPriceQ96,
    sanitizedValueQ96,
  } = useValuationSlider({
    valueQ96,
    onChangeQ96,
    onInteractionStart,
    clearingPriceQ96,
    floorPriceQ96,
    tickSizeQ96,
    maxSliderPriceQ96,
    tickGrouping,
    groupTicksEnabled,
  })

  // Tick-based mode
  if (
    !clearingPriceQ96 ||
    !minPriceQ96 ||
    !tickSizeQ96 ||
    bidTokenDecimals === undefined ||
    auctionTokenDecimals === undefined ||
    totalTicks === 0 ||
    tokenColorLoading
  ) {
    return null
  }

  const isFdvInputMode = inputType === ValuationInputType.Fdv

  // Convert Q96 to display string for child components that need it
  const priceDisplayValue = sanitizedValueQ96
    ? q96ToPriceString({ q96Value: sanitizedValueQ96, bidTokenDecimals, auctionTokenDecimals })
    : '0'

  if (isFdvInputMode) {
    return (
      <ValuationSliderV2
        value={priceDisplayValue}
        disabled={disabled}
        tokenColor={tokenColor}
        bidTokenSymbol={bidTokenSymbol}
        bidTokenPriceFiat={bidTokenPriceFiat}
        totalTicks={totalTicks}
        clampedSliderIndex={clampedSliderIndex}
        progress={progress}
        onValueChange={handleTickValueChange}
        onPointerDown={handlePointerDown}
      />
    )
  }

  return (
    <ValuationSliderV1
      disabled={disabled}
      tokenColor={tokenColor}
      bidTokenDecimals={bidTokenDecimals}
      bidTokenSymbol={bidTokenSymbol}
      auctionTokenDecimals={auctionTokenDecimals}
      tokenTotalSupply={tokenTotalSupply}
      bidTokenPriceFiat={bidTokenPriceFiat}
      sanitizedValueQ96={sanitizedValueQ96}
      totalTicks={totalTicks}
      clampedSliderIndex={clampedSliderIndex}
      progress={progress}
      onValueChange={handleTickValueChange}
      onPointerDown={handlePointerDown}
    />
  )
}

export const ValuationSlider = memo(ValuationSliderComponent)
export { ValuationInputType } from '~/features/Toucan/Shared/valuationSliderParts/types'
