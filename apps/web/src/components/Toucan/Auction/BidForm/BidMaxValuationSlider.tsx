import { memo, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, getContrastPassingTextColor, Slider, Text, Tooltip, styled as tamaguiStyled } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'
import { parseUnits } from 'viem'
import { priceToQ96WithDecimals, q96ToPriceString } from '~/components/Toucan/Auction/BidDistributionChart/utils/q96'
import { useAuctionTokenColor } from '~/components/Toucan/Auction/hooks/useAuctionTokenColor'
import { useBidTokenInfo } from '~/components/Toucan/Auction/hooks/useBidTokenInfo'
import { useAuctionStore } from '~/components/Toucan/Auction/store/useAuctionStore'
import { getClearingPrice } from '~/components/Toucan/Auction/utils/clearingPrice'
import {
  approximateNumberFromRaw,
  computeFdvBidTokenRaw,
  formatCompactFromRaw,
} from '~/components/Toucan/Auction/utils/fixedPointFdv'
import { snapToNearestTick } from '~/components/Toucan/Auction/utils/ticks'

const MAX_PERCENTAGE = 270
const MARKER_COUNT = 10 // 0% to 270% in 30% increments = 10 dots
const TOOLTIP_OPEN_DELAY_MS = 2000

const StyledSlider = tamaguiStyled(Slider, {
  hoverTheme: false,
  pressTheme: false,
  focusTheme: false,
  width: '100%',
  height: 24,
  justifyContent: 'center',
})

const SliderTrack = tamaguiStyled(Slider.Track, {
  height: 4,
  borderRadius: '$roundedFull',
  backgroundColor: '$surface1',
  position: 'relative',
  justifyContent: 'center',
})

const SliderTrackActive = tamaguiStyled(Slider.TrackActive, {
  height: 4,
  borderRadius: '$roundedFull',
  backgroundColor: 'transparent',
})

const SliderThumb = tamaguiStyled(Slider.Thumb, {
  hoverTheme: false,
  pressTheme: false,
  focusTheme: false,
  width: 'auto',
  height: 'auto',
  backgroundColor: 'transparent',
  cursor: 'grab',
  top: '50%',
  y: '-50%',
})

interface ClampParams {
  value: number
  min: number
  max: number
}

interface BidMaxValuationSliderProps {
  value: string
  onChange: (amount: string) => void
  bidTokenDecimals?: number
  bidTokenSymbol: string
  tokenColor?: string
  disabled?: boolean
  onInteractionStart?: () => void
}

const clamp = ({ value, min, max }: ClampParams): number => Math.min(Math.max(value, min), max)

function BidMaxValuationSliderComponent({
  value,
  onChange,
  bidTokenDecimals,
  bidTokenSymbol,
  tokenColor,
  disabled,
  onInteractionStart,
}: BidMaxValuationSliderProps): JSX.Element | null {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
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
  const auctionTokenDecimals = auctionDetails?.token?.currency.decimals ?? 18
  // minPrice is clearingPrice + 1 tick (which corresponds to 0%)
  const minPriceQ96 = useMemo(() => {
    if (!clearingPriceQ96 || !tickSizeQ96) {
      return undefined
    }
    return clearingPriceQ96 + tickSizeQ96
  }, [clearingPriceQ96, tickSizeQ96])

  const totalTicks = useMemo(() => {
    if (!minPriceQ96 || !tickSizeQ96) {
      return 0
    }
    // Max Price = minPrice * (1 + MAX_PERCENTAGE/100) = minPrice * 5.5
    // Range = minPrice * 4.5
    // Ticks = Range / tickSize
    // Use ceiling division to ensure we can reach at least MAX_PERCENTAGE
    const numerator = minPriceQ96 * BigInt(MAX_PERCENTAGE)
    const denominator = 100n * tickSizeQ96
    return Number((numerator + denominator - 1n) / denominator)
  }, [minPriceQ96, tickSizeQ96])

  const sanitizedValueQ96 = useMemo(() => {
    if (!value || bidTokenDecimals === undefined || !clearingPriceQ96 || !floorPriceQ96 || !tickSizeQ96) {
      return minPriceQ96
    }
    try {
      const rawAmount = parseUnits(value, bidTokenDecimals)
      const parsedQ96 = priceToQ96WithDecimals({ priceRaw: rawAmount, auctionTokenDecimals })
      const snappedToTick = snapToNearestTick({
        value: parsedQ96,
        floorPrice: floorPriceQ96,
        clearingPrice: clearingPriceQ96,
        tickSize: tickSizeQ96,
      })

      if (groupTicksEnabled && tickGrouping && minPriceQ96) {
        const delta = snappedToTick - minPriceQ96
        // Include the exact-min tick case (delta === 0n) so grouped mode snapping is applied consistently.
        if (delta >= 0n) {
          const index = Number(delta / tickSizeQ96)
          const groupSize = Math.max(1, tickGrouping.groupSizeTicks)
          const snappedIndex = Math.round(index / groupSize) * groupSize
          return minPriceQ96 + tickSizeQ96 * BigInt(snappedIndex)
        }
      }

      return snappedToTick
    } catch {
      return minPriceQ96
    }
  }, [
    auctionTokenDecimals,
    bidTokenDecimals,
    clearingPriceQ96,
    floorPriceQ96,
    groupTicksEnabled,
    minPriceQ96,
    tickGrouping,
    tickSizeQ96,
    value,
  ])

  const sliderIndex = useMemo(() => {
    if (!sanitizedValueQ96 || !minPriceQ96 || !tickSizeQ96) {
      return 0
    }
    const delta = sanitizedValueQ96 - minPriceQ96
    if (delta <= 0n) {
      return 0
    }
    const ticksAway = delta / tickSizeQ96
    // Allow index to go above totalTicks if value is manually entered higher
    // But clamp it for the slider visual in the return statement if needed
    return Number(ticksAway)
  }, [minPriceQ96, sanitizedValueQ96, tickSizeQ96])

  const clampedSliderIndex = clamp({ value: sliderIndex, min: 0, max: totalTicks })

  // Track whether user is actively dragging the slider to prevent spurious change events
  // when clicking elsewhere in the form (a Tamagui Slider issue on mobile)
  const isDraggingRef = useRef(false)
  // Store cleanup function to remove document listeners on unmount
  const cleanupListenersRef = useRef<(() => void) | null>(null)

  const handlePointerUp = useEvent(() => {
    // Use setTimeout to allow the final onValueChange to process before we stop accepting changes
    setTimeout(() => {
      isDraggingRef.current = false
    }, 100)
  })

  const handlePointerDown = useEvent(() => {
    isDraggingRef.current = true
    // Notify parent before blur can fire (prevents race condition with input blur handler)
    onInteractionStart?.()

    // Clean up any existing listener from a previous drag that wasn't resolved
    if (cleanupListenersRef.current) {
      cleanupListenersRef.current()
    }

    // Add document-level listener to catch pointer up anywhere (not just on the slider)
    const onDocumentPointerUp = (): void => {
      handlePointerUp()
      document.removeEventListener('pointerup', onDocumentPointerUp)
      document.removeEventListener('pointercancel', onDocumentPointerUp)
      cleanupListenersRef.current = null
    }
    document.addEventListener('pointerup', onDocumentPointerUp)
    document.addEventListener('pointercancel', onDocumentPointerUp)
    // Store cleanup in case component unmounts mid-drag
    cleanupListenersRef.current = onDocumentPointerUp
  })

  // Cleanup document listeners on unmount to prevent memory leak
  useEffect(() => {
    return () => {
      if (cleanupListenersRef.current) {
        document.removeEventListener('pointerup', cleanupListenersRef.current)
        document.removeEventListener('pointercancel', cleanupListenersRef.current)
        cleanupListenersRef.current = null
      }
    }
  }, [])

  const progress = totalTicks > 0 ? clampedSliderIndex / totalTicks : 0
  const thumbX = `calc(${-progress * 100}% + ${-2 + progress * 4}px)`

  const { effectiveTokenColor, tokenColorLoading } = useAuctionTokenColor()
  const effectiveColor = tokenColor ?? effectiveTokenColor
  const textColor = useMemo(
    () => (effectiveColor ? getContrastPassingTextColor(effectiveColor) : '$white'),
    [effectiveColor],
  )

  const fdvDisplay = useMemo(() => {
    if (!auctionDetails?.tokenTotalSupply || !sanitizedValueQ96 || bidTokenDecimals === undefined) {
      return `${0} ${bidTokenSymbol} ${t('stats.fdv')}`.trim()
    }

    try {
      const auctionTokenDecimals = auctionDetails.token?.currency.decimals ?? 18

      const fdvRaw = computeFdvBidTokenRaw({
        priceQ96: sanitizedValueQ96,
        bidTokenDecimals,
        totalSupplyRaw: auctionDetails.tokenTotalSupply,
        auctionTokenDecimals,
      })

      const formattedFdv = formatCompactFromRaw({ raw: fdvRaw, decimals: bidTokenDecimals, maxFractionDigits: 2 })
      return `${formattedFdv} ${bidTokenSymbol} ${t('stats.fdv')}`.trim()
    } catch {
      return `${0} ${bidTokenSymbol} ${t('stats.fdv')}`.trim()
    }
  }, [
    auctionDetails?.tokenTotalSupply,
    auctionDetails?.token?.currency.decimals,
    bidTokenDecimals,
    bidTokenSymbol,
    sanitizedValueQ96,
    t,
  ])

  // Fiat FDV for tooltip - shows the FDV in user's fiat currency
  const fiatFdvDisplay = useMemo(() => {
    if (
      !auctionDetails?.tokenTotalSupply ||
      !sanitizedValueQ96 ||
      bidTokenDecimals === undefined ||
      !bidTokenInfo ||
      bidTokenInfo.priceFiat === 0
    ) {
      return null
    }

    try {
      const auctionTokenDecimals = auctionDetails.token?.currency.decimals ?? 18

      const fdvRaw = computeFdvBidTokenRaw({
        priceQ96: sanitizedValueQ96,
        bidTokenDecimals,
        totalSupplyRaw: auctionDetails.tokenTotalSupply,
        auctionTokenDecimals,
      })

      const fdvBidTokenApprox = approximateNumberFromRaw({
        raw: fdvRaw,
        decimals: bidTokenDecimals,
        significantDigits: 15,
      })
      const fdvFiat = fdvBidTokenApprox * bidTokenInfo.priceFiat

      return `${convertFiatAmountFormatted(fdvFiat, NumberType.FiatTokenStats)} ${t('stats.fdv')}`
    } catch {
      return null
    }
  }, [
    auctionDetails?.tokenTotalSupply,
    auctionDetails?.token?.currency.decimals,
    bidTokenDecimals,
    bidTokenInfo,
    convertFiatAmountFormatted,
    sanitizedValueQ96,
    t,
  ])

  const handleValueChange = useEvent((next: number[]) => {
    // Ignore spurious change events when not actively dragging
    // This prevents the slider from incorrectly responding to clicks on other elements
    if (!isDraggingRef.current) {
      return
    }

    if (!minPriceQ96 || !tickSizeQ96 || bidTokenDecimals === undefined) {
      return
    }
    let nextIndex = clamp({
      value: next[0] ?? 0,
      min: 0,
      max: totalTicks,
    })

    if (groupTicksEnabled && tickGrouping) {
      const groupSize = Math.max(1, tickGrouping.groupSizeTicks)
      nextIndex = Math.round(nextIndex / groupSize) * groupSize
      nextIndex = clamp({ value: nextIndex, min: 0, max: totalTicks })
    }

    const nextQ96 = minPriceQ96 + tickSizeQ96 * BigInt(nextIndex)
    const displayValue = q96ToPriceString({ q96Value: nextQ96, bidTokenDecimals, auctionTokenDecimals })
    onChange(displayValue)
  })

  if (
    !auctionDetails ||
    !minPriceQ96 ||
    !tickSizeQ96 ||
    bidTokenDecimals === undefined ||
    totalTicks === 0 ||
    tokenColorLoading
  ) {
    return null
  }

  return (
    <Flex gap="$spacing8" alignItems="center" width="100%" opacity={disabled ? 0.5 : 1}>
      <StyledSlider
        min={0}
        max={totalTicks}
        step={1}
        value={[clampedSliderIndex]}
        onValueChange={handleValueChange}
        onPointerDown={handlePointerDown}
        disabled={disabled}
      >
        <SliderTrack>
          <Flex
            position="absolute"
            width="100%"
            height="100%"
            row
            justifyContent="space-between"
            alignItems="center"
            pointerEvents="none"
          >
            {Array.from({ length: MARKER_COUNT }).map((_, i) => (
              <Flex key={i} width={4} height={4} borderRadius="$roundedFull" backgroundColor="$neutral3" />
            ))}
          </Flex>
          <SliderTrackActive style={effectiveColor ? { backgroundColor: effectiveColor } : undefined} />
        </SliderTrack>
        <SliderThumb index={0} x={thumbX}>
          <Tooltip
            placement="bottom"
            delay={{ open: TOOLTIP_OPEN_DELAY_MS, close: 0 }}
            restMs={TOOLTIP_OPEN_DELAY_MS}
            offset={{ mainAxis: 8 }}
          >
            <Tooltip.Trigger>
              <Flex position="relative" alignItems="center" justifyContent="center">
                <Flex
                  backgroundColor={effectiveColor}
                  py="$spacing2"
                  borderRadius="$spacing4"
                  overflow="hidden"
                  minWidth={32}
                  userSelect="none"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Flex px="$spacing4">
                    <Text variant="body4" color={textColor} whiteSpace="noWrap">
                      {fdvDisplay}
                    </Text>
                  </Flex>
                </Flex>
              </Flex>
            </Tooltip.Trigger>
            {fiatFdvDisplay && (
              <Tooltip.Content zIndex={zIndexes.tooltip} p="$spacing10">
                <Text variant="body4" color="$neutral1" whiteSpace="nowrap">
                  {fiatFdvDisplay}
                </Text>
              </Tooltip.Content>
            )}
          </Tooltip>
        </SliderThumb>
      </StyledSlider>
    </Flex>
  )
}

export const BidMaxValuationSlider = memo(BidMaxValuationSliderComponent)
