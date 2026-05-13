import { mix } from 'polished'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSporeColors } from 'ui/src/hooks/useSporeColors'
import {
  useLocalizationContext,
  type LocalizationContextState,
} from 'uniswap/src/features/language/LocalizationContext'
import { formatPriceRangeBound } from '~/pages/Liquidity/CreateAuction/components/customPriceRangeEditorFormatting'
import {
  CustomPriceRangeBound,
  type CustomPriceRangeEntry,
  type CustomPriceRangeValue,
  PriceRangeStrategy,
} from '~/pages/Liquidity/CreateAuction/types'
import { isCustomPriceRangeEntryValid } from '~/pages/Liquidity/CreateAuction/utils'

const HISTOGRAM_MAX_BAR_COUNT = 200
const HISTOGRAM_BAR_WIDTH = 4
const HISTOGRAM_BAR_GAP = 1
const CONTAINER_HEIGHT = 48
/** Max bar height (px) left of clearing price in concentrated full range. */
const CONCENTRATED_LEFT_MAX_BAR_HEIGHT = 42
const PRICE_INDICATOR_TOP_OFFSET = 9
const CUSTOM_RANGE_LABEL_HEIGHT = 20
/** Height of the “Final clearing price” pill; center guide meets its bottom edge. */
const FINAL_CLEARING_PRICE_PILL_HEIGHT = 16
/** Horizontal padding inside the pill (each side). */
const FINAL_CLEARING_PRICE_PILL_H_PADDING = 8
/**
 * Finite negative % from clearing mapped linearly across the left half: −100% aligns with the
 * left edge (same slot as −∞); −50% is halfway between center and that edge.
 */
export const CUSTOM_PRICE_HISTOGRAM_NEGATIVE_FULL_EXTENT_PERCENT = 100
/**
 * Finite positive % from clearing mapped linearly across the right half: +500% aligns with the
 * right edge (same slot as +∞); values below scale proportionally.
 */
export const CUSTOM_PRICE_HISTOGRAM_POSITIVE_FULL_EXTENT_PERCENT = 500
const EDGE_OPACITIES = [0.12, 0.24, 0.54] as const
const MIN_BAR_COUNT = 7

export function getPriceHistogramBarOpacity(index: number, total: number): number {
  if (index < EDGE_OPACITIES.length) {
    return EDGE_OPACITIES[index]
  }
  if (index >= total - EDGE_OPACITIES.length) {
    return EDGE_OPACITIES[total - 1 - index]
  }
  return 1
}

/** Pixel heights: strictly left of the middle bar {@link CONCENTRATED_LEFT_MAX_BAR_HEIGHT}; middle bar and right {@link CONTAINER_HEIGHT}. */
export function getConcentratedPriceHistogramHeights(count: number): number[] {
  const centerIndex = Math.floor((count - 1) / 2)
  return Array.from({ length: count }, (_, i) =>
    i < centerIndex ? CONCENTRATED_LEFT_MAX_BAR_HEIGHT : CONTAINER_HEIGHT,
  )
}

export function getPriceHistogramBarCountForWidth(width: number): number {
  if (width <= 0) {
    return MIN_BAR_COUNT
  }

  const maxFit = Math.floor((width + HISTOGRAM_BAR_GAP) / (HISTOGRAM_BAR_WIDTH + HISTOGRAM_BAR_GAP))
  const clamped = Math.max(MIN_BAR_COUNT, Math.min(HISTOGRAM_MAX_BAR_COUNT, maxFit))
  return clamped % 2 === 1 ? clamped : Math.max(MIN_BAR_COUNT, clamped - 1)
}

function getComparableBound(value: CustomPriceRangeValue): number {
  if (value === CustomPriceRangeBound.NegativeInfinity) {
    return Number.NEGATIVE_INFINITY
  }
  if (value === CustomPriceRangeBound.PositiveInfinity) {
    return Number.POSITIVE_INFINITY
  }
  return value
}

const HISTOGRAM_PERCENT_MAX_DECIMALS = 4 as const

/** One custom range’s histogram tooltip / accessible name (used per hovered layer). */
export function getCustomPriceHistogramLayerTitle(
  entry: CustomPriceRangeEntry,
  formatPercent: LocalizationContextState['formatPercent'],
): string {
  if (!isCustomPriceRangeEntryValid(entry)) {
    return ''
  }

  const liquidity = formatPercent(entry.liquidityPercent, HISTOGRAM_PERCENT_MAX_DECIMALS)
  const min = formatPriceRangeBound(entry.minPercentFromClearing, (value) =>
    formatPercent(value, HISTOGRAM_PERCENT_MAX_DECIMALS),
  )
  const max = formatPriceRangeBound(entry.maxPercentFromClearing, (value) =>
    formatPercent(value, HISTOGRAM_PERCENT_MAX_DECIMALS),
  )
  const details = `${liquidity} (${min}, ${max})`
  return details
}

export type HistogramPercentToXParams = {
  startX: number
  centerX: number
  totalBarsWidth: number
}

/** Maps a % from clearing (or ±∞) to an x coordinate on the custom-range histogram. */
export function getHistogramXForPercentFromClearing(
  bound: number,
  { startX, centerX, totalBarsWidth }: HistogramPercentToXParams,
): number {
  const rightEdge = startX + totalBarsWidth
  const leftSpan = centerX - startX
  const rightSpan = rightEdge - centerX

  if (bound === Number.NEGATIVE_INFINITY) {
    return startX
  }
  if (bound === Number.POSITIVE_INFINITY) {
    return rightEdge
  }
  if (bound <= 0) {
    const clamped = Math.max(bound, -CUSTOM_PRICE_HISTOGRAM_NEGATIVE_FULL_EXTENT_PERCENT)
    return centerX + (clamped / CUSTOM_PRICE_HISTOGRAM_NEGATIVE_FULL_EXTENT_PERCENT) * leftSpan
  }
  const clamped = Math.min(bound, CUSTOM_PRICE_HISTOGRAM_POSITIVE_FULL_EXTENT_PERCENT)
  return centerX + (clamped / CUSTOM_PRICE_HISTOGRAM_POSITIVE_FULL_EXTENT_PERCENT) * rightSpan
}

export function getLayeredPriceHistogramColor({
  barColor,
  neutral1Color,
  layerIndex,
}: {
  barColor: string
  neutral1Color: string
  layerIndex: number
}): string {
  return mix(Math.min(layerIndex * 0.1, 0.9), neutral1Color, barColor)
}

type CustomPriceHistogramLayer = {
  entryId: string
  min: number
  max: number
  height: number
  y: number
  color: string
}

export function getCustomPriceHistogramLayers({
  entries,
  barColor,
  neutral1Color,
}: {
  entries: CustomPriceRangeEntry[]
  barColor: string
  neutral1Color: string
}): CustomPriceHistogramLayer[] {
  let nextY = PRICE_INDICATOR_TOP_OFFSET + CONTAINER_HEIGHT

  return entries
    .filter(isCustomPriceRangeEntryValid)
    .map((entry, index) => {
      const height = (Math.max(0, entry.liquidityPercent) / 100) * CONTAINER_HEIGHT
      nextY -= height

      return {
        entryId: entry.id,
        min: getComparableBound(entry.minPercentFromClearing),
        max: getComparableBound(entry.maxPercentFromClearing),
        height,
        y: nextY,
        color: getLayeredPriceHistogramColor({ barColor, neutral1Color, layerIndex: index }),
      }
    })
    .filter((layer) => layer.height > 0)
}

type PriceHistogramProps =
  | {
      strategy: PriceRangeStrategy.CONCENTRATED_FULL_RANGE | PriceRangeStrategy.FULL_RANGE
      barColor: string
    }
  | {
      strategy: PriceRangeStrategy.CUSTOM_RANGE
      barColor: string
      customPriceRanges: CustomPriceRangeEntry[]
      activeEntryId: string | null
      onHoverEntry: (entryId: string | null) => void
    }

export function PriceHistogram(props: PriceHistogramProps) {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const colors = useSporeColors()
  const svgRef = useRef<SVGSVGElement>(null)
  const clearingPriceMeasureRef = useRef<SVGTextElement>(null)
  const [svgWidth, setSvgWidth] = useState(0)
  const [clearingPricePillLayout, setClearingPricePillLayout] = useState<{
    width: number
    naturalTextWidth: number
  }>({ width: 88, naturalTextWidth: 0 })

  useEffect(() => {
    const el = svgRef.current
    const observer = new ResizeObserver(([entry]) => {
      setSvgWidth(entry.contentRect.width)
    })
    if (el) {
      observer.observe(el)
    }
    return () => {
      observer.disconnect()
    }
  }, [])

  const barCount = useMemo(() => getPriceHistogramBarCountForWidth(svgWidth), [svgWidth])
  const totalBarsWidth = barCount * HISTOGRAM_BAR_WIDTH + (barCount - 1) * HISTOGRAM_BAR_GAP
  const startX = (svgWidth - totalBarsWidth) / 2
  const centerIndex = Math.floor((barCount - 1) / 2)
  const centerX = startX + centerIndex * (HISTOGRAM_BAR_WIDTH + HISTOGRAM_BAR_GAP) + HISTOGRAM_BAR_WIDTH / 2
  const labelHeight = CUSTOM_RANGE_LABEL_HEIGHT
  const indicatorTop = labelHeight + PRICE_INDICATOR_TOP_OFFSET
  const chartHeight = labelHeight + PRICE_INDICATOR_TOP_OFFSET + CONTAINER_HEIGHT
  const customPriceRanges = props.strategy === PriceRangeStrategy.CUSTOM_RANGE ? props.customPriceRanges : undefined

  const finalClearingPriceLabel = t('toucan.statsBanner.finalClearingPrice')

  useLayoutEffect(() => {
    const measureEl = clearingPriceMeasureRef.current
    if (!measureEl || svgWidth <= 0) {
      return
    }

    const naturalTextWidth = measureEl.getBBox().width
    const paddedMinWidth = naturalTextWidth + FINAL_CLEARING_PRICE_PILL_H_PADDING * 2
    const maxHalfWidth = Math.min(centerX, svgWidth - centerX)
    const maxPillWidth = Math.max(FINAL_CLEARING_PRICE_PILL_H_PADDING * 2 + 1, maxHalfWidth * 2 - 4)
    const width = Math.max(32, Math.min(paddedMinWidth, maxPillWidth))

    setClearingPricePillLayout({ width, naturalTextWidth })
  }, [centerX, finalClearingPriceLabel, svgWidth])

  const clearingPricePillInnerWidth = Math.max(
    0,
    clearingPricePillLayout.width - FINAL_CLEARING_PRICE_PILL_H_PADDING * 2,
  )
  const clearingPriceTextShouldCompress =
    clearingPricePillInnerWidth > 0 && clearingPricePillLayout.naturalTextWidth > clearingPricePillInnerWidth + 0.75

  const heights = useMemo(() => {
    if (props.strategy === PriceRangeStrategy.CONCENTRATED_FULL_RANGE) {
      return getConcentratedPriceHistogramHeights(barCount)
    }
    if (props.strategy === PriceRangeStrategy.FULL_RANGE) {
      return Array<number>(barCount).fill(CONTAINER_HEIGHT)
    }
    return Array<number>(barCount).fill(0.5 * CONTAINER_HEIGHT)
  }, [barCount, props.strategy])

  const customLayers = useMemo(() => {
    if (!customPriceRanges) {
      return []
    }
    return getCustomPriceHistogramLayers({
      entries: customPriceRanges,
      barColor: props.barColor,
      neutral1Color: colors.neutral1.val,
    })
  }, [colors.neutral1.val, customPriceRanges, props.barColor])

  const svgAccessibleTitle = useMemo(() => {
    if (props.strategy === PriceRangeStrategy.CUSTOM_RANGE && customPriceRanges !== undefined) {
      return t('toucan.createAuction.step.customizePool.priceRange.custom')
    }
    if (props.strategy === PriceRangeStrategy.CONCENTRATED_FULL_RANGE) {
      return t('toucan.createAuction.step.customizePool.priceRange.concentratedFullRange')
    }
    return t('toucan.createAuction.step.customizePool.priceRange.fullRange')
  }, [customPriceRanges, props.strategy, t])

  const histogramXParams = useMemo(() => ({ startX, centerX, totalBarsWidth }), [startX, centerX, totalBarsWidth])

  const getXForCustomBound = (bound: number): number => getHistogramXForPercentFromClearing(bound, histogramXParams)

  return (
    <svg ref={svgRef} width="100%" height={chartHeight} role="img" style={{ display: 'block', overflow: 'visible' }}>
      <title>{svgAccessibleTitle}</title>
      <text
        ref={clearingPriceMeasureRef}
        x={0}
        y={0}
        fontSize={8}
        fontWeight={535}
        visibility="hidden"
        aria-hidden
        style={{ pointerEvents: 'none' }}
      >
        {finalClearingPriceLabel}
      </text>
      <rect
        x={centerX - clearingPricePillLayout.width / 2}
        y={0}
        width={clearingPricePillLayout.width}
        height={FINAL_CLEARING_PRICE_PILL_HEIGHT}
        rx={Math.min(6, clearingPricePillLayout.width / 2)}
        fill={colors.surface3.val}
      />
      <text
        x={centerX}
        y={11}
        textAnchor="middle"
        fontSize={8}
        fontWeight={535}
        fill={colors.neutral1.val}
        textLength={clearingPriceTextShouldCompress ? clearingPricePillInnerWidth : undefined}
        lengthAdjust={clearingPriceTextShouldCompress ? 'spacing' : undefined}
      >
        {finalClearingPriceLabel}
      </text>
      {props.strategy === PriceRangeStrategy.CUSTOM_RANGE ? (
        <>
          {customLayers.map((layer) => {
            const minX = Math.max(startX, Math.min(getXForCustomBound(layer.min), getXForCustomBound(layer.max)))
            const maxX = Math.min(
              startX + totalBarsWidth,
              Math.max(getXForCustomBound(layer.min), getXForCustomBound(layer.max)),
            )
            const isActive = props.activeEntryId === layer.entryId
            const hasActiveEntry =
              props.activeEntryId !== null && customLayers.some((l) => l.entryId === props.activeEntryId)
            const entry = customPriceRanges?.find((e) => e.id === layer.entryId)
            const layerTitle = entry !== undefined ? getCustomPriceHistogramLayerTitle(entry, formatPercent) : ''

            return (
              <g
                key={layer.entryId}
                opacity={!hasActiveEntry || isActive ? 1 : 0.25}
                onMouseEnter={() => props.onHoverEntry(layer.entryId)}
                onMouseLeave={() => props.onHoverEntry(null)}
              >
                {Array.from({ length: barCount }).map((_, index) => {
                  const x = startX + index * (HISTOGRAM_BAR_WIDTH + HISTOGRAM_BAR_GAP)
                  const overlapsLayer = x + HISTOGRAM_BAR_WIDTH >= minX && x <= maxX

                  if (!overlapsLayer) {
                    return null
                  }

                  return (
                    <rect
                      key={index}
                      x={x}
                      y={labelHeight + layer.y}
                      width={HISTOGRAM_BAR_WIDTH}
                      height={layer.height}
                      rx={2}
                      fill={layer.color}
                      opacity={getPriceHistogramBarOpacity(index, barCount)}
                    />
                  )
                })}
                <rect
                  x={minX}
                  y={labelHeight + layer.y}
                  width={Math.max(HISTOGRAM_BAR_WIDTH, maxX - minX)}
                  height={layer.height}
                  fill="transparent"
                  pointerEvents="all"
                >
                  {layerTitle ? <title>{layerTitle}</title> : null}
                </rect>
              </g>
            )
          })}
        </>
      ) : (
        heights.map((heightValue, index) => {
          const height = Math.round(heightValue)
          return (
            <rect
              key={index}
              x={startX + index * (HISTOGRAM_BAR_WIDTH + HISTOGRAM_BAR_GAP)}
              y={indicatorTop + CONTAINER_HEIGHT - height}
              width={HISTOGRAM_BAR_WIDTH}
              height={height}
              rx={2}
              fill={props.barColor}
              opacity={getPriceHistogramBarOpacity(index, heights.length)}
            />
          )
        })
      )}
      <line
        x1={centerX}
        y1={FINAL_CLEARING_PRICE_PILL_HEIGHT}
        x2={centerX}
        y2={chartHeight}
        stroke={colors.neutral3.val}
        strokeWidth={1}
        strokeDasharray="2 2"
      />
    </svg>
  )
}
