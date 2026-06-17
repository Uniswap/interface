import { AuctionStep } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import {
  CrosshairMode,
  createChart,
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
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
import { useAuctionTokenColor } from '~/features/Toucan/Auction/hooks/useAuctionTokenColor'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { blockToTimestamp } from '~/features/Toucan/Auction/utils/blockToTimestamp'
import { dottedMarkerStyle } from '~/features/Toucan/Auction/utils/dottedMarker'
import { formatCompactFromRaw } from '~/features/Toucan/Auction/utils/fixedPointFdv'
import { formatShortDateTime } from '~/features/Toucan/Auction/utils/formatting'
import { TooltipContainer } from '~/features/Toucan/Shared/TooltipContainer'

const CHART_HEIGHT = 200

interface SupplySchedulePoint {
  time: UTCTimestamp
  value: number // percentage 0-100
  // Metadata for tooltip
  tokensReleasedInStep: bigint // raw tokens released in this step
  totalReleased: bigint // cumulative raw tokens released
}

interface TooltipData {
  dateLabel: string
  tokensReleasedFormatted: string
  totalReleasedFormatted: string
  x: number
  y: number
}

/**
 * Generates supply schedule data points from parsedAuctionSteps.
 *
 * mps = tokens released per block during a step.
 * Cumulative tokens at step boundary i = sum of (mps_j × blocks_in_step_j) for j < i.
 * Total tokens across all steps = totalMpsBlocks (denominator for percentage).
 */
function getSupplySchedulePoints({
  steps,
  endBlock,
  anchorBlock,
  anchorTime,
  chainId,
  totalSupplyRaw,
}: {
  steps: AuctionStep[]
  endBlock: number
  anchorBlock: number
  anchorTime: Date
  chainId: EVMUniverseChainId
  totalSupplyRaw: bigint
}): SupplySchedulePoint[] {
  if (steps.length === 0) {
    return []
  }

  const toTimestamp = (block: number): UTCTimestamp =>
    (blockToTimestamp({ block, anchorBlock, anchorTime, chainId }).getTime() / 1000) as UTCTimestamp

  // First compute total mps×blocks across all steps to get 100% denominator
  let totalMpsBlocks = BigInt(0)
  for (let i = 0; i < steps.length; i++) {
    const stepStartBlock = Number(steps[i].startBlock)
    const stepEndBlock = i < steps.length - 1 ? Number(steps[i + 1].startBlock) : endBlock
    const blocksInStep = stepEndBlock - stepStartBlock
    const mps = steps[i].mps ? BigInt(steps[i].mps) : BigInt(0)
    totalMpsBlocks += mps * BigInt(blocksInStep)
  }

  if (totalMpsBlocks === BigInt(0)) {
    return []
  }

  const points: SupplySchedulePoint[] = []
  let cumulativeMpsBlocks = BigInt(0)

  // Start point at 0%
  points.push({
    time: toTimestamp(Number(steps[0].startBlock)),
    value: 0,
    tokensReleasedInStep: BigInt(0),
    totalReleased: BigInt(0),
  })

  for (let i = 0; i < steps.length; i++) {
    const stepStartBlock = Number(steps[i].startBlock)
    const stepEndBlock = i < steps.length - 1 ? Number(steps[i + 1].startBlock) : endBlock
    const blocksInStep = stepEndBlock - stepStartBlock
    const mps = steps[i].mps ? BigInt(steps[i].mps) : BigInt(0)
    const mpsBlocksInStep = mps * BigInt(blocksInStep)

    cumulativeMpsBlocks += mpsBlocksInStep
    const pct = Number((cumulativeMpsBlocks * BigInt(10000)) / totalMpsBlocks) / 100

    // Convert mps-units to actual token amounts: tokens = (mpsBlocks / totalMpsBlocks) × totalSupply
    const tokensInStep = (mpsBlocksInStep * totalSupplyRaw) / totalMpsBlocks
    const totalTokensReleased = (cumulativeMpsBlocks * totalSupplyRaw) / totalMpsBlocks

    // Point at end of step
    points.push({
      time: toTimestamp(stepEndBlock),
      value: pct,
      tokensReleasedInStep: tokensInStep,
      totalReleased: totalTokensReleased,
    })
  }

  return points
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
        {data.dateLabel}
      </Text>

      {/* Divider */}
      <Flex width="100%" height={1} backgroundColor="$surface3" />

      {/* Token info */}
      <Flex gap="$spacing2">
        <Text variant="body4" color="$neutral1">
          {t('toucan.details.tokensReleased')} {data.tokensReleasedFormatted}
        </Text>
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
  const tooltipRef = useRef<HTMLDivElement>(null)

  const tokenDecimals = auctionDetails?.token?.currency.decimals ?? 18

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
    })
  }, [auctionDetails])

  const handleCrosshairMove = useCallback(
    (param: MouseEventParams<Time>) => {
      if (!param.time || !param.point || !seriesRef.current || !containerRef.current) {
        setTooltipData(null)
        setHoverLineX(null)
        return
      }

      const matchingPoint = data.find((p) => p.time === param.time)
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
        tokensReleasedFormatted: formatCompactFromRaw({
          raw: matchingPoint.tokensReleasedInStep,
          decimals: tokenDecimals,
          maxFractionDigits: 2,
        }),
        totalReleasedFormatted: formatCompactFromRaw({
          raw: matchingPoint.totalReleased,
          decimals: tokenDecimals,
          maxFractionDigits: 2,
        }),
        x: param.point.x,
        y: param.point.y,
      })
    },
    [data, tokenDecimals],
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container || data.length === 0) {
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

    const series = chart.addAreaSeries({
      priceScaleId: 'overlay-supply',
      lineWidth: 2,
      lineColor: effectiveTokenColor,
      topColor: opacify(20, effectiveTokenColor),
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
    })

    series.priceScale().applyOptions({
      scaleMargins: { top: 0.05, bottom: 0.05 },
    })

    series.setData(data)
    chart.timeScale().fitContent()

    chart.subscribeCrosshairMove(handleCrosshairMove)

    chartRef.current = chart
    seriesRef.current = series

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
      setNowLineX(computeNowX({ data, timeScale: chart.timeScale() }))
    }

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
    }
  }, [data, effectiveTokenColor, neutral2Val, surface3Val, handleCrosshairMove])

  useLayoutEffect(() => {
    if (nowLineX !== null && nowBadgeRef.current) {
      setNowBadgeHeight(nowBadgeRef.current.offsetHeight)
    }
  }, [nowLineX])

  if (data.length === 0) {
    return null
  }

  return (
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
  )
}
