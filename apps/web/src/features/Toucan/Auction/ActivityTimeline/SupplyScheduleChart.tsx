import {
  CrosshairMode,
  createChart,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type ITimeScaleApi,
  type MouseEventParams,
  type Time,
  type UTCTimestamp,
} from 'lightweight-charts'
import { forwardRef, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, useSporeColors } from 'ui/src'
import { opacify } from 'ui/src/theme'
import { zIndexes } from 'ui/src/theme/zIndexes'
import {
  getSupplySchedulePoints,
  type SupplySchedulePoint,
} from '~/features/Toucan/Auction/ActivityTimeline/getSupplySchedulePoints'
import { useAuctionTokenColor } from '~/features/Toucan/Auction/hooks/useAuctionTokenColor'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { dottedMarkerStyle } from '~/features/Toucan/Auction/utils/dottedMarker'
import { formatCompactFromRaw } from '~/features/Toucan/Auction/utils/fixedPointFdv'
import { formatShortDateTime } from '~/features/Toucan/Auction/utils/formatting'
import { getAuctionTokenDecimals } from '~/features/Toucan/Auction/utils/tokenMetadata'
import { TooltipContainer } from '~/features/Toucan/Shared/TooltipContainer'

const CHART_HEIGHT = 200

interface TooltipData {
  dateLabel: string
  // Hidden for the inserted "now" pivot point — its per-step slice is arbitrary
  tokensReleasedFormatted: string | null
  totalReleasedFormatted: string
  // Right of the now line: amounts assume future demand absorbs the remaining supply
  isProjected: boolean
  x: number
  y: number
}

/**
 * Splits schedule points at the now pivot so the actual (solid) and projected
 * (dashed) portions render as separate series. Both include the pivot so the
 * line stays connected.
 */
function splitAtNowPoint(data: SupplySchedulePoint[]): {
  actual: SupplySchedulePoint[]
  projected: SupplySchedulePoint[]
} {
  const nowIndex = data.findIndex((p) => p.isNowPoint)
  if (nowIndex === -1) {
    return { actual: data, projected: [] }
  }
  return { actual: data.slice(0, nowIndex + 1), projected: data.slice(nowIndex) }
}

function computeNowX({
  data,
  timeScale,
}: {
  data: SupplySchedulePoint[]
  timeScale: ITimeScaleApi<Time>
}): number | null {
  if (data.length < 2) {
    return null
  }

  // The pivot is where the solid series ends; pin the now line to it so the solid
  // line can never render past "Now" even if block-time estimates drift.
  const nowPoint = data.find((p) => p.isNowPoint)
  if (nowPoint) {
    return timeScale.timeToCoordinate(nowPoint.time)
  }

  const nowSec = Date.now() / 1000
  const firstTime = data[0].time as number
  const lastTime = data[data.length - 1].time as number
  if (nowSec < firstTime || nowSec > lastTime) {
    return null
  }

  let segmentStart = 0
  for (let i = 0; i < data.length - 1; i++) {
    if (nowSec >= (data[i].time as number) && nowSec <= (data[i + 1].time as number)) {
      segmentStart = i
      break
    }
  }

  const t0 = data[segmentStart].time as number
  const t1 = data[segmentStart + 1].time as number
  const c0 = timeScale.timeToCoordinate(data[segmentStart].time)
  const c1 = timeScale.timeToCoordinate(data[segmentStart + 1].time)
  if (c0 === null || c1 === null) {
    return null
  }

  const fraction = t1 === t0 ? 0 : (nowSec - t0) / (t1 - t0)
  return c0 + fraction * (c1 - c0)
}

function MarkerLine({ x, top, height }: { x: number; top: number; height: number }) {
  const { neutral2 } = useSporeColors()
  return (
    <Flex
      position="absolute"
      top={top}
      height={Math.max(0, height)}
      pointerEvents="none"
      zIndex={1}
      style={{ left: x, transform: 'translateX(-50%)', ...dottedMarkerStyle(neutral2.val) }}
    />
  )
}

const ChartTooltip = forwardRef<HTMLDivElement, { data: TooltipData; containerWidth: number }>(function ChartTooltip(
  { data, containerWidth },
  ref,
) {
  const { t } = useTranslation()
  const tooltipEl = (ref as React.RefObject<HTMLDivElement> | null)?.current
  const tooltipWidth = tooltipEl?.offsetWidth ?? 0
  const halfWidth = tooltipWidth / 2
  const PADDING = 4

  // Clamp left so tooltip stays within the container
  let left = data.x
  if (left - halfWidth < PADDING) {
    left = halfWidth + PADDING
  } else if (left + halfWidth > containerWidth - PADDING) {
    left = containerWidth - halfWidth - PADDING
  }

  return (
    <TooltipContainer
      ref={ref}
      zIndex={zIndexes.tooltip}
      py="$spacing4"
      px="$spacing6"
      gap="$spacing4"
      width="max-content"
      style={{
        left: `${left}px`,
        top: `${data.y}px`,
        transform: 'translate(-50%, -110%)',
      }}
    >
      {/* Date header */}
      <Text variant="body4" color="$neutral2">
        {data.isProjected ? `${data.dateLabel} · ${t('toucan.details.projected')}` : data.dateLabel}
      </Text>

      {/* Divider */}
      <Flex width="100%" height={1} backgroundColor="$surface3" />

      {/* Token info */}
      <Flex gap="$spacing2">
        {data.tokensReleasedFormatted !== null && (
          <Text variant="body4" color="$neutral1">
            {t('toucan.details.tokensReleased')} {data.tokensReleasedFormatted}
          </Text>
        )}
        <Text variant="body4" color="$neutral1">
          {t('toucan.details.totalReleased')} {data.totalReleasedFormatted}
        </Text>
      </Flex>
    </TooltipContainer>
  )
})

export function SupplyScheduleChart() {
  const { t } = useTranslation()
  const { neutral2, surface3 } = useSporeColors()
  const neutral2Val = neutral2.val
  const surface3Val = surface3.val
  const { effectiveTokenColor } = useAuctionTokenColor()
  const auctionDetails = useAuctionStore((state) => state.auctionDetails)
  const totalCleared = useAuctionStore((state) => state.totalCleared)
  const currentBlockNumber = useAuctionStore((state) => state.currentBlockNumber)
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null)
  const [yAxisLabels, setYAxisLabels] = useState<Array<{ label: string; y: number }>>([])
  const [plotHeight, setPlotHeight] = useState(CHART_HEIGHT)
  const [nowLineX, setNowLineX] = useState<number | null>(null)
  const [hoverLineX, setHoverLineX] = useState<number | null>(null)
  const [nowBadgeHeight, setNowBadgeHeight] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const nowBadgeRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null)
  const projectedSeriesRef = useRef<ISeriesApi<'Area'> | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const dataRef = useRef<SupplySchedulePoint[]>([])
  const updateLabelPositionsRef = useRef<() => void>(() => {})

  const tokenDecimals = getAuctionTokenDecimals(auctionDetails?.token)

  const data = useMemo(() => {
    if (!auctionDetails?.endBlock || !auctionDetails.totalSupply) {
      return []
    }

    const steps = auctionDetails.parsedAuctionSteps

    return getSupplySchedulePoints({
      steps,
      endBlock: Number(auctionDetails.endBlock),
      anchorBlock: Number(auctionDetails.creationBlock),
      anchorTime: new Date(auctionDetails.createdAt),
      chainId: auctionDetails.chainId,
      totalSupplyRaw: BigInt(auctionDetails.totalSupply),
      actualSold:
        totalCleared !== null && currentBlockNumber !== undefined
          ? { currentBlock: currentBlockNumber, totalClearedRaw: BigInt(totalCleared) }
          : undefined,
    })
  }, [auctionDetails, totalCleared, currentBlockNumber])

  const handleCrosshairMove = useCallback(
    (param: MouseEventParams<Time>) => {
      if (!param.time || !param.point || !seriesRef.current || !containerRef.current || tokenDecimals === undefined) {
        setTooltipData(null)
        setHoverLineX(null)
        return
      }

      const matchingPoint = dataRef.current.find((p) => p.time === param.time)
      if (!matchingPoint) {
        setTooltipData(null)
        setHoverLineX(null)
        return
      }

      setHoverLineX(chartRef.current?.timeScale().timeToCoordinate(param.time) ?? null)

      const date = new Date((param.time as number) * 1000)
      const dateLabel = formatShortDateTime(date)

      setTooltipData({
        dateLabel,
        tokensReleasedFormatted: matchingPoint.isNowPoint
          ? null
          : formatCompactFromRaw({
              raw: matchingPoint.tokensReleasedInStep,
              decimals: tokenDecimals,
              maxFractionDigits: 2,
            }),
        totalReleasedFormatted: formatCompactFromRaw({
          raw: matchingPoint.totalReleased,
          decimals: tokenDecimals,
          maxFractionDigits: 2,
        }),
        isProjected: matchingPoint.isProjected ?? false,
        x: param.point.x,
        y: param.point.y,
      })
    },
    [tokenDecimals],
  )

  const hasData = data.length > 0

  // Create the chart once per color set; live data updates flow through the effect below
  useEffect(() => {
    const container = containerRef.current
    if (!container || !hasData) {
      return undefined
    }

    const chart = createChart(container, {
      width: container.clientWidth,
      height: CHART_HEIGHT,
      layout: {
        background: { color: 'transparent' },
        textColor: neutral2Val,
        fontSize: 11,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: surface3Val, style: 1 },
      },
      leftPriceScale: { visible: false },
      rightPriceScale: { visible: false },
      timeScale: {
        borderVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time: UTCTimestamp) => formatShortDateTime(new Date(time * 1000)),
      },
      handleScroll: false,
      handleScale: false,
      crosshair: {
        mode: CrosshairMode.Magnet,
        horzLine: { visible: false, labelVisible: false },
        vertLine: { visible: false, labelVisible: false },
      },
    })

    const sharedSeriesOptions = {
      priceScaleId: 'overlay-supply',
      lineWidth: 2,
      lineColor: effectiveTokenColor,
      bottomColor: opacify(0, effectiveTokenColor),
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerRadius: 4,
      crosshairMarkerBackgroundColor: effectiveTokenColor,
      crosshairMarkerBorderColor: effectiveTokenColor,
      priceFormat: {
        type: 'custom',
        formatter: (price: number) => `${Math.round(price)}%`,
      },
    } as const

    // Actual amounts sold (solid) up to the now line
    const series = chart.addAreaSeries({
      ...sharedSeriesOptions,
      topColor: opacify(20, effectiveTokenColor),
    })

    // Remaining schedule (dashed) — a projection that depends on future demand
    const projectedSeries = chart.addAreaSeries({
      ...sharedSeriesOptions,
      lineStyle: LineStyle.Dashed,
      topColor: opacify(10, effectiveTokenColor),
    })

    series.priceScale().applyOptions({
      scaleMargins: { top: 0.05, bottom: 0.05 },
    })

    const { actual, projected } = splitAtNowPoint(dataRef.current)
    series.setData(actual)
    projectedSeries.setData(projected)
    chart.timeScale().fitContent()

    chart.subscribeCrosshairMove(handleCrosshairMove)

    chartRef.current = chart
    seriesRef.current = series
    projectedSeriesRef.current = projectedSeries

    // Position y-axis labels using chart coordinates
    const updateLabelPositions = () => {
      const labels = [20, 40, 60, 80]
      const positions: Array<{ label: string; y: number }> = []
      for (const pct of labels) {
        const y = series.priceToCoordinate(pct)
        if (y !== null) {
          positions.push({ label: `${pct}%`, y })
        }
      }
      setYAxisLabels(positions)

      setPlotHeight(CHART_HEIGHT - chart.timeScale().height())
      setNowLineX(computeNowX({ data: dataRef.current, timeScale: chart.timeScale() }))
    }
    updateLabelPositionsRef.current = updateLabelPositions

    // Update after initial render and on resize
    let rafId = requestAnimationFrame(updateLabelPositions)

    const resizeObserver = new ResizeObserver(() => {
      chart.applyOptions({ width: container.clientWidth })
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(updateLabelPositions)
    })
    resizeObserver.observe(container)

    return () => {
      cancelAnimationFrame(rafId)
      resizeObserver.disconnect()
      chart.unsubscribeCrosshairMove(handleCrosshairMove)
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
      projectedSeriesRef.current = null
    }
  }, [hasData, effectiveTokenColor, neutral2Val, surface3Val, handleCrosshairMove])

  // Push data updates into the existing chart (e.g. per-block rollover adjustments)
  // without tearing it down
  useEffect(() => {
    dataRef.current = data
    const chart = chartRef.current
    const series = seriesRef.current
    const projectedSeries = projectedSeriesRef.current
    if (!chart || !series || !projectedSeries || data.length === 0) {
      return undefined
    }

    const { actual, projected } = splitAtNowPoint(data)
    series.setData(actual)
    projectedSeries.setData(projected)
    chart.timeScale().fitContent()
    const rafId = requestAnimationFrame(() => updateLabelPositionsRef.current())
    return () => cancelAnimationFrame(rafId)
  }, [data])

  useLayoutEffect(() => {
    if (nowLineX !== null && nowBadgeRef.current) {
      setNowBadgeHeight(nowBadgeRef.current.offsetHeight)
    }
  }, [nowLineX])

  if (data.length === 0) {
    return null
  }

  const hasProjected = data.some((p) => p.isProjected)

  return (
    <Flex width="100%" gap="$spacing8">
      <Flex position="relative" width="100%" height={CHART_HEIGHT}>
        {/* Custom y-axis labels positioned to match chart grid lines */}
        {yAxisLabels.map((item) => (
          <Text
            key={item.label}
            variant="body4"
            color="$neutral2"
            fontSize={11}
            position="absolute"
            left={0}
            zIndex={1}
            pointerEvents="none"
            style={{ top: item.y, transform: 'translateY(-100%)' }}
          >
            {item.label}
          </Text>
        ))}
        <Flex ref={containerRef} width="100%" height={CHART_HEIGHT} />
        {hoverLineX !== null && <MarkerLine x={hoverLineX} top={nowBadgeHeight} height={plotHeight - nowBadgeHeight} />}
        {nowLineX !== null && (
          <>
            <MarkerLine x={nowLineX} top={nowBadgeHeight} height={plotHeight - nowBadgeHeight} />
            <Flex
              ref={nowBadgeRef}
              position="absolute"
              top={0}
              borderRadius="$rounded4"
              backgroundColor="$surface3"
              px="$spacing4"
              py="$spacing2"
              pointerEvents="none"
              zIndex={1}
              style={{ left: nowLineX, transform: 'translateX(-50%)' }}
            >
              <Text variant="body4" color="$neutral1">
                {t('toucan.details.now')}
              </Text>
            </Flex>
          </>
        )}
        {tooltipData && (
          <ChartTooltip ref={tooltipRef} data={tooltipData} containerWidth={containerRef.current?.clientWidth ?? 0} />
        )}
      </Flex>
      {hasProjected && (
        <Text variant="body4" color="$neutral2">
          {t('toucan.details.projectedSupplyNote')}
        </Text>
      )}
    </Flex>
  )
}
