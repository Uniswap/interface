/* oxlint-disable max-lines */
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, useSporeColors } from 'ui/src'
import { useActiveAddress } from 'uniswap/src/features/accounts/store/hooks'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { BidDistributionChartPlaceholder } from '~/features/Toucan/Auction/BidDistributionChart/BidDistributionChartPlaceholder'
import { BidOutOfRangeIndicator } from '~/features/Toucan/Auction/BidDistributionChart/BidOutOfRangeIndicator'
import { ChartBarTooltip } from '~/features/Toucan/Auction/BidDistributionChart/ChartBarTooltip'
import { ClearingPriceTooltip } from '~/features/Toucan/Auction/BidDistributionChart/ClearingPriceTooltip'
import { ConcentrationBandOverlay } from '~/features/Toucan/Auction/BidDistributionChart/ConcentrationBandOverlay'
import { CHART_DIMENSIONS, MARKER_CONFIG } from '~/features/Toucan/Auction/BidDistributionChart/constants'
import { DistributionBarsOverlay } from '~/features/Toucan/Auction/BidDistributionChart/DistributionBarsOverlay'
import { useClearingPriceData } from '~/features/Toucan/Auction/BidDistributionChart/hooks/useClearingPriceData'
import { useYAxisPanZoom } from '~/features/Toucan/Auction/BidDistributionChart/hooks/useYAxisPanZoom'
import { BidMarkerOverlay } from '~/features/Toucan/Auction/BidDistributionChart/markers/BidMarkerOverlay'
import { computeMarkerPositions } from '~/features/Toucan/Auction/BidDistributionChart/markers/computeMarkerPositions'
import {
  computeBidOutOfRange,
  computeYPosition,
} from '~/features/Toucan/Auction/BidDistributionChart/utils/combinedChartPositions'
import {
  fromQ96ToDecimalWithTokenDecimals,
  priceToQ96WithDecimals,
  q96ToPriceString,
} from '~/features/Toucan/Auction/BidDistributionChart/utils/q96'
import { formatTokenVolume } from '~/features/Toucan/Auction/BidDistributionChart/utils/tokenFormatters'
import type { ChartBarData } from '~/features/Toucan/Auction/BidDistributionChart/utils/utils'
import { generateChartData, mergeUserBidVolumes } from '~/features/Toucan/Auction/BidDistributionChart/utils/utils'
import {
  buildViewAdaptiveBars,
  parseBidEntries,
} from '~/features/Toucan/Auction/BidDistributionChart/utils/viewAdaptiveBars'
import { useAuctionValueFormatters } from '~/features/Toucan/Auction/hooks/useAuctionValueFormatters'
import type { AuctionDetails, BidTokenInfo } from '~/features/Toucan/Auction/store/types'
import { AuctionProgressState } from '~/features/Toucan/Auction/store/types'
import { useAuctionStore, useAuctionStoreActions } from '~/features/Toucan/Auction/store/useAuctionStore'
import { getClearingPrice } from '~/features/Toucan/Auction/utils/clearingPrice'
import { snapToNearestTick } from '~/features/Toucan/Auction/utils/ticks'
import { TooltipContainer } from '~/features/Toucan/Shared/TooltipContainer'
import { ClearingPriceChartRenderer } from '~/features/Toucan/ToucanChart/clearingPrice/ClearingPriceChartRenderer'
import { calculateMaxFractionDigits } from '~/features/Toucan/ToucanChart/clearingPrice/utils/yAxisRange'

const DISTRIBUTION_COLUMN_WIDTH = 48
const BID_MARKER_COLUMN_WIDTH = MARKER_CONFIG.AVATAR_SIZE
const BID_MARKER_COLUMN_GAP = 4
/** Total left offset for the chart content area (marker column + gap) */
const CHART_LEFT_OFFSET = BID_MARKER_COLUMN_WIDTH + BID_MARKER_COLUMN_GAP
const PLACEHOLDER_HEIGHT = 400
/** Height of the lightweight-charts time scale (x-axis labels) */
const TIME_SCALE_HEIGHT = 30
const CLEARING_PRICE_HOVER_THRESHOLD = 15

interface CombinedAuctionChartProps {
  auctionDetails: AuctionDetails
  bidTokenInfo: BidTokenInfo
  auctionTokenDecimals: number
  tokenColor?: string
}

/**
 * Combined chart showing clearing price line chart with distribution bars overlay.
 * The clearing price chart occupies the main area, distribution bars in a 48px right column.
 * Both share the same Y-axis (price scale).
 */
// oxlint-disable-next-line complexity
export function CombinedAuctionChart({
  auctionDetails,
  bidTokenInfo,
  auctionTokenDecimals,
  tokenColor,
}: CombinedAuctionChartProps): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const { setSelectedTickPrice } = useAuctionStoreActions()
  const connectedWalletAddress = useActiveAddress(auctionDetails.chainId as UniverseChainId)

  // ── Clearing price data ──
  const { normalizedData } = useClearingPriceData({
    auctionDetails,
    bidTokenInfo,
  })

  // ── Distribution data (same as BidDistributionChart.tsx) ──
  const { bidDistributionData, excludedBidVolume, userBids, optimisticBid, userBidPrice, isBidInputFocused } =
    useAuctionStore((state) => ({
      bidDistributionData: state.bidDistributionData,
      excludedBidVolume: state.excludedBidVolume,
      userBids: state.userBids,
      optimisticBid: state.optimisticBid,
      userBidPrice: state.userBidPrice,
      isBidInputFocused: state.isBidInputFocused,
    }))

  const clearingPrice = useAuctionStore((state) => {
    const isActive = state.progress.state === AuctionProgressState.IN_PROGRESS
    const effectiveCheckpoint = isActive ? state.onchainCheckpoint : state.checkpointData
    return getClearingPrice(effectiveCheckpoint, state.auctionDetails)
  })

  const tickSize = auctionDetails.tickSize || '0'
  const floorPrice = auctionDetails.floorPrice || '0'
  const totalSupply = auctionDetails.tokenTotalSupply

  const { formatPrice, formatTokenAmount } = useAuctionValueFormatters({
    bidTokenInfo,
    totalSupply,
    auctionTokenDecimals,
  })

  const effectiveBidDistributionData = useMemo(
    () => mergeUserBidVolumes({ bidDistributionData, userBids, optimisticBid }),
    [bidDistributionData, userBids, optimisticBid],
  )

  const chartData = useMemo(() => {
    if (!effectiveBidDistributionData) {
      return null
    }
    try {
      return generateChartData({
        bidData: effectiveBidDistributionData,
        bidTokenInfo,
        totalSupply,
        auctionTokenDecimals,
        clearingPrice,
        floorPrice,
        tickSize,
        formatter: (amount: number) => amount.toString(),
        chartMode: 'distribution',
        excludedVolume: excludedBidVolume,
      })
    } catch {
      return null
    }
  }, [
    effectiveBidDistributionData,
    bidTokenInfo,
    clearingPrice,
    floorPrice,
    tickSize,
    totalSupply,
    auctionTokenDecimals,
    excludedBidVolume,
  ])

  // ── Visible price range from clearing price chart ──
  const [visiblePriceRange, setVisiblePriceRange] = useState<{
    min: number
    max: number
  } | null>(null)

  const handleVisiblePriceRangeChange = useCallback((range: { min: number; max: number }) => {
    setVisiblePriceRange({ min: Math.max(0, range.min), max: range.max })
  }, [])

  // ── Distribution bar hover (crosshair + tooltip) ──
  const [hoverState, setHoverState] = useState<{
    bar: ChartBarData | null
    y: number
    tickPrice: number
  } | null>(null)

  const handleBarHover = useCallback(
    ({ bar, y, tickPrice }: { bar: ChartBarData | null; y: number; tickPrice: number }) => {
      if (y === 0 && tickPrice === 0) {
        setHoverState(null)
      } else {
        setHoverState({ bar, y, tickPrice })
      }
    },
    [],
  )

  const handleBarClick = useCallback(
    (bar: ChartBarData | null, tickPrice: number) => {
      if (!Number.isFinite(tickPrice) || tickPrice <= 0) {
        return
      }
      // Use the bar's exact Q96 value when available to avoid floating-point precision loss
      const q96Value = bar?.tickQ96
        ? BigInt(bar.tickQ96)
        : priceToQ96WithDecimals({
            priceRaw: BigInt(Math.round(tickPrice * 10 ** bidTokenInfo.decimals)),
            auctionTokenDecimals,
          })

      const snappedQ96 = snapToNearestTick({
        value: q96Value,
        floorPrice: BigInt(floorPrice),
        clearingPrice: BigInt(clearingPrice || '0'),
        tickSize: BigInt(tickSize),
      })
      const priceString = q96ToPriceString({
        q96Value: snappedQ96,
        bidTokenDecimals: bidTokenInfo.decimals,
        auctionTokenDecimals,
      })
      setSelectedTickPrice(priceString)
    },
    [floorPrice, clearingPrice, tickSize, bidTokenInfo.decimals, auctionTokenDecimals, setSelectedTickPrice],
  )

  const formatFdvValue = useCallback(
    (amount: number): string => convertFiatAmountFormatted(amount, NumberType.FiatTokenStats),
    [convertFiatAmountFormatted],
  )
  const formatVolumeLabel = useCallback(
    (amount: number): string => {
      const tokenAmount = bidTokenInfo.priceFiat > 0 ? amount / bidTokenInfo.priceFiat : amount
      return formatTokenVolume(tokenAmount, { maxDecimals: 3 })
    },
    [bidTokenInfo.priceFiat],
  )

  // ── Clearing price in decimal for bar coloring ──
  const clearingPriceDecimal = useMemo(() => {
    if (!clearingPrice || clearingPrice === '0') {
      return undefined
    }
    return fromQ96ToDecimalWithTokenDecimals({
      q96Value: clearingPrice,
      bidTokenDecimals: bidTokenInfo.decimals,
      auctionTokenDecimals,
    })
  }, [clearingPrice, bidTokenInfo.decimals, auctionTokenDecimals])

  const effectiveHeight = CHART_DIMENSIONS.HEIGHT
  const scaleFactor = normalizedData?.scaleFactor ?? 1
  const chartAreaHeight = effectiveHeight - TIME_SCALE_HEIGHT

  // ── Y-axis panning, zooming, and auto-grouped bars ──
  const { pannedNormalizedData, groupedBars, tickSizeDecimal, chartWheelRef, panToPrice } = useYAxisPanZoom({
    normalizedData,
    chartData,
    clearingPriceDecimal,
    tickSize,
    bidTokenDecimals: bidTokenInfo.decimals,
    auctionTokenDecimals,
    chartHeightPx: chartAreaHeight,
  })

  const maxFractionDigits = pannedNormalizedData ? calculateMaxFractionDigits(pannedNormalizedData.yMax) : 0

  // ── View-adaptive overlay bars: re-bucket raw bids against the current visible
  // price range so bar resolution matches zoom level, bypassing the generation-time
  // barStep grid (which is too coarse for narrow views and too fine for wide ones). ──
  // Parse bid entries once per bidData change; re-bucket per view change without
  // repeating BigInt Q96→decimal conversions.
  const parsedBidEntries = useMemo(
    () => parseBidEntries({ bidData: effectiveBidDistributionData, bidTokenInfo, auctionTokenDecimals }),
    [effectiveBidDistributionData, bidTokenInfo, auctionTokenDecimals],
  )

  const adaptiveOverlayBars = useMemo(() => {
    if (!visiblePriceRange || parsedBidEntries.length === 0 || scaleFactor <= 0) {
      return []
    }
    return buildViewAdaptiveBars({
      entries: parsedBidEntries,
      visiblePriceRangeUnscaled: {
        min: visiblePriceRange.min / scaleFactor,
        max: visiblePriceRange.max / scaleFactor,
      },
      chartHeightPx: chartAreaHeight,
    })
  }, [visiblePriceRange, parsedBidEntries, scaleFactor, chartAreaHeight])

  // ── User bid price line (horizontal dashed line) ──
  const bidLineY = useMemo(() => {
    if (!userBidPrice || !visiblePriceRange) {
      return null
    }
    const bidPrice = Number(userBidPrice)
    if (isNaN(bidPrice) || bidPrice <= 0) {
      return null
    }
    return computeYPosition({
      price: bidPrice,
      scaleFactor,
      visiblePriceRange,
      chartAreaHeight,
    })
  }, [userBidPrice, visiblePriceRange, scaleFactor, chartAreaHeight])

  // ── Bid out-of-range indicator ──
  const bidOutOfRange = useMemo<'up' | 'down' | null>(() => {
    if (!userBidPrice || !visiblePriceRange) {
      return null
    }
    const bidPrice = Number(userBidPrice)
    if (isNaN(bidPrice) || bidPrice <= 0) {
      return null
    }
    return computeBidOutOfRange({ bidPrice, scaleFactor, visiblePriceRange })
  }, [userBidPrice, visiblePriceRange, scaleFactor])

  // ── Clearing price Y position ──
  const clearingPriceY = useMemo(() => {
    if (clearingPriceDecimal === undefined || !visiblePriceRange) {
      return null
    }
    return computeYPosition({
      price: clearingPriceDecimal,
      scaleFactor,
      visiblePriceRange,
      chartAreaHeight,
    })
  }, [clearingPriceDecimal, visiblePriceRange, scaleFactor, chartAreaHeight])

  // ── Clearing price hover detection ──
  const isHoveringClearingPrice =
    hoverState !== null &&
    clearingPriceY !== null &&
    Math.abs(hoverState.y - clearingPriceY) < CLEARING_PRICE_HOVER_THRESHOLD

  // ── Clearing price tooltip data ──
  const clearingPriceTooltipData = useMemo(() => {
    if (clearingPriceDecimal === undefined || !chartData) {
      return null
    }
    const bars = groupedBars ?? chartData.bars
    const matchingBar = bars.find((bar) => Math.abs(bar.tick - clearingPriceDecimal) < tickSizeDecimal * 0.5)
    const volumeAtClearingPrice = matchingBar?.amount ?? 0
    return {
      clearingPriceDecimal,
      volumeAtClearingPrice,
      totalBidVolume: chartData.totalBidVolume,
    }
  }, [clearingPriceDecimal, chartData, groupedBars, tickSizeDecimal])

  // ── User bid markers (Unicon avatars at bid tick Y positions) ──
  const bidMarkerPositions = useMemo(() => {
    if (userBids.length === 0 || !visiblePriceRange) {
      return []
    }
    return computeMarkerPositions({
      userBids,
      visiblePriceRange,
      chartAreaHeight: effectiveHeight - TIME_SCALE_HEIGHT,
      scaleFactor,
      bidTokenDecimals: bidTokenInfo.decimals,
      auctionTokenDecimals,
      clearingPrice,
      address: connectedWalletAddress ?? '',
    })
  }, [
    userBids,
    visiblePriceRange,
    effectiveHeight,
    bidTokenInfo.decimals,
    auctionTokenDecimals,
    scaleFactor,
    connectedWalletAddress,
    clearingPrice,
  ])

  const dottedBackgroundStyle = {
    backgroundImage: `radial-gradient(circle, ${colors.surface3Hovered.val} 1px, transparent 1px)`,
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0',
  }

  if (!pannedNormalizedData) {
    return (
      <BidDistributionChartPlaceholder height={PLACEHOLDER_HEIGHT}>
        {t('toucan.auction.errorLoading')}
      </BidDistributionChartPlaceholder>
    )
  }

  return (
    <Flex ref={chartWheelRef} position="relative" width="100%" height={effectiveHeight}>
      {/* Price chart fills main area minus marker column and distribution column */}
      <Flex position="absolute" left={CHART_LEFT_OFFSET} top={0} bottom={0} right={DISTRIBUTION_COLUMN_WIDTH}>
        <ClearingPriceChartRenderer
          normalizedData={pannedNormalizedData}
          bidTokenInfo={bidTokenInfo}
          maxFractionDigits={maxFractionDigits}
          tokenColor={tokenColor}
          height={effectiveHeight}
          onVisiblePriceRangeChange={handleVisiblePriceRangeChange}
          disableMouseWheelInteractions
          totalSupply={totalSupply}
          auctionTokenDecimals={auctionTokenDecimals}
        />
        {/* Right-edge fade: masks the area fill so it doesn't clip abruptly */}
        <Flex
          position="absolute"
          right={0}
          top={0}
          bottom={0}
          width={80}
          pointerEvents="none"
          style={{
            background: `linear-gradient(to right, transparent, ${colors.surface1.val})`,
          }}
        />
      </Flex>

      {/* Distribution bars in 48px right column */}
      {chartData && visiblePriceRange && (
        <Flex
          position="absolute"
          right={0}
          top={0}
          bottom={TIME_SCALE_HEIGHT}
          width={DISTRIBUTION_COLUMN_WIDTH}
          overflow="hidden"
        >
          <DistributionBarsOverlay
            bars={adaptiveOverlayBars.length > 0 ? adaptiveOverlayBars : (groupedBars ?? chartData.bars)}
            clearingPriceDecimal={clearingPriceDecimal}
            concentration={chartData.concentration}
            priceRange={visiblePriceRange}
            scaleFactor={scaleFactor}
            tokenColor={tokenColor}
            fallbackAccentColor={colors.neutral2.val}
            neutralColor={colors.neutral3.val}
            width={DISTRIBUTION_COLUMN_WIDTH}
            height={effectiveHeight - TIME_SCALE_HEIGHT}
            onBarHover={handleBarHover}
            onBarClick={handleBarClick}
          />
        </Flex>
      )}

      {/* Concentration band overlay spanning full width */}
      {chartData?.concentration && visiblePriceRange && (
        <ConcentrationBandOverlay
          concentration={chartData.concentration}
          priceRange={visiblePriceRange}
          scaleFactor={scaleFactor}
          height={effectiveHeight - TIME_SCALE_HEIGHT}
          isVisible={isBidInputFocused}
          labelLeftOffset={CHART_LEFT_OFFSET + CHART_DIMENSIONS.Y_AXIS_LABEL_WIDTH}
          bidTokenSymbol={bidTokenInfo.symbol}
        />
      )}

      {/* Hover crosshair — horizontal dashed line at cursor Y */}
      {hoverState && (
        <Flex
          position="absolute"
          left={CHART_LEFT_OFFSET}
          right={0}
          top={hoverState.y}
          height={1}
          pointerEvents="none"
          style={{
            borderTop: `1px dashed ${colors.neutral3.val}`,
          }}
        />
      )}

      {/* User bid price line — solid line spanning full width with "Your bid" label */}
      {bidLineY !== null && (
        <>
          <Flex
            position="absolute"
            left={CHART_LEFT_OFFSET}
            right={0}
            top={bidLineY}
            height={1}
            pointerEvents="none"
            backgroundColor="$neutral2"
          />
          <TooltipContainer
            py="$spacing4"
            px="$spacing6"
            style={{
              left: CHART_LEFT_OFFSET + CHART_DIMENSIONS.Y_AXIS_LABEL_WIDTH,
              top: bidLineY,
              transform: 'translateY(-50%)',
              whiteSpace: 'nowrap',
            }}
          >
            <Text variant="body4" color="$neutral1">
              {t('toucan.bidDistribution.yourBid')}
            </Text>
          </TooltipContainer>
        </>
      )}

      {/* Tooltip layer — offset by marker column + Y_AXIS_LABEL_WIDTH so tooltips don't overlap */}
      <Flex
        position="absolute"
        left={CHART_LEFT_OFFSET + CHART_DIMENSIONS.Y_AXIS_LABEL_WIDTH}
        top={0}
        bottom={0}
        right={0}
        pointerEvents="none"
      >
        {/* Clearing price tooltip — shows on hover near clearing price Y */}
        {isHoveringClearingPrice && clearingPriceTooltipData && (
          <ClearingPriceTooltip
            state={{
              left: 0,
              top: clearingPriceY,
              isVisible: true,
              clearingPriceDecimal: clearingPriceTooltipData.clearingPriceDecimal,
              volumeAtClearingPrice: clearingPriceTooltipData.volumeAtClearingPrice,
              totalBidVolume: clearingPriceTooltipData.totalBidVolume,
            }}
            bidTokenInfo={bidTokenInfo}
            totalSupply={totalSupply}
            auctionTokenDecimals={auctionTokenDecimals}
          />
        )}

        {/* Distribution bar tooltip — shows on hover with FDV and volume (if any) */}
        {chartData && (
          <ChartBarTooltip
            left={0}
            top={hoverState?.y ?? 0}
            isVisible={hoverState !== null && !isHoveringClearingPrice}
            tickValue={hoverState?.bar?.tick ?? hoverState?.tickPrice ?? 0}
            volumeAmount={hoverState?.bar?.amount ?? 0}
            totalVolume={chartData.totalBidVolume}
            bidTokenInfo={bidTokenInfo}
            totalSupply={totalSupply}
            auctionTokenDecimals={auctionTokenDecimals}
            formatter={formatFdvValue}
            volumeFormatter={formatVolumeLabel}
          />
        )}
      </Flex>

      {/* Bid out-of-range indicator — shows when bid is above/below visible range */}
      {bidOutOfRange && userBidPrice && (
        <BidOutOfRangeIndicator
          direction={bidOutOfRange}
          tickValue={Number(userBidPrice)}
          bidTokenInfo={bidTokenInfo}
          totalSupply={totalSupply}
          auctionTokenDecimals={auctionTokenDecimals}
          formatter={formatFdvValue}
          onClick={() => panToPrice(Number(userBidPrice))}
        />
      )}

      {/* User bid markers — Unicon avatars at the left edge of the chart */}
      <Flex position="absolute" left={0} top={0} bottom={TIME_SCALE_HEIGHT} width={BID_MARKER_COLUMN_WIDTH}>
        <BidMarkerOverlay
          markerPositions={bidMarkerPositions}
          bidTokenInfo={bidTokenInfo}
          formatPrice={formatPrice}
          formatTokenAmount={formatTokenAmount}
        />
      </Flex>

      {/* Dotted background overlay — rendered last so it sits on top of the fade gradient */}
      <Flex
        position="absolute"
        top={0}
        left={CHART_LEFT_OFFSET}
        right={0}
        bottom={0}
        pointerEvents="none"
        style={dottedBackgroundStyle}
      />
    </Flex>
  )
}
